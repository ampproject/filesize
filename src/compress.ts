/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { cpus } from 'os';
import { Context, Compression, OrderedCompressionValues, maxSize } from './validation/Condition';
import { readFile } from './helpers/fs';
import { Report } from './log/report';
import { compressor } from './compressor';

const COMPRESSION_CONCURRENCY = cpus().length;

export interface CompressionItem {
  path: string;
  compression: Compression;
  maxSize: maxSize;
}

/**
 * Store the original content so it isn't retrieved from FileSystem for each compression.
 * @param context
 * @param path
 */
async function storeOriginalFileContents(context: Context, path: string): Promise<void> {
  if (!context.fileContents.has(path)) {
    let content = await readFile(path);
    if (context.fileModifier !== null && content !== null) {
      content = context.fileModifier(content);
    }
    context.fileContents.set(path, content || '');
  }
}

/**
 * Find all items to compress, and store them for future compression.
 * @param context
 * @param findDefaultSize
 */
export async function findItemsToCompress(context: Context, findDefaultSize: boolean): Promise<Array<CompressionItem>> {
  const toCompress: Array<CompressionItem> = [];
  for (const [path, sizeMapValue] of context.compressed) {
    for (let iterator: number = 0; iterator < OrderedCompressionValues.length; iterator++) {
      const compression: Compression = OrderedCompressionValues[iterator] as Compression;
      const [size, maxSize] = sizeMapValue[iterator];
      await storeOriginalFileContents(context, path);
      if (findDefaultSize && compression === 'none') {
        await compressor(context, null, { path, compression, maxSize });
      }
      if (size !== undefined) {
        toCompress.push({
          path,
          compression,
          maxSize,
        });
      }
    }
  }

  return toCompress;
}

/**
 * Given a context, compress all Items within splitting work eagly per cpu core to achieve some concurrency.
 * @param context Finalized Valid Context from Configuration
 */
export default async function compress(
  context: Context,
  toCompress: Array<CompressionItem>,
  report: Report | null,
): Promise<boolean> {
  let success = true;
  if (toCompress.length === 0) {
    return success;
  }

  const returnable: Array<Promise<boolean>> = [];
  const executing: Array<Promise<boolean>> = [];
  for (const item of toCompress) {
    const promise: Promise<boolean> = Promise.resolve(item).then((item) => compressor(context, report, item));
    returnable.push(promise);

    if (COMPRESSION_CONCURRENCY <= toCompress.length) {
      const execute: any = promise.then((successful) => {
        if (!successful) {
          success = successful;
        }
        executing.splice(executing.indexOf(execute), 1);
      });
      executing.push(execute);
      if (executing.length >= COMPRESSION_CONCURRENCY) {
        await Promise.race(executing);
      }
    }
  }
  if ((await Promise.all(returnable)).includes(false)) {
    success = false;
  }

  return success;
}
