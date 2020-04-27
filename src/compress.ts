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

import { Context, Compression, OrderedCompressionValues, maxSize } from './validation/Condition';
import { readFile } from './helpers/fs';
import { Report } from './log/report';
import { compressor } from './compressor';
import { pool } from '@kristoferbaxter/async';

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
  await pool(Array.from(context.compressed), async ([path, sizeMapValue]) => {
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
  });

  return toCompress;
}

/**
 * Given a context, compress all Items within splitting work eagly per cpu core to achieve some concurrency.
 * @param context Finalized Valid Context from Configuration
 */
export default async function compress(
  context: Context,
  toCompress: Array<CompressionItem>,
  report: typeof Report | null,
): Promise<boolean> {
  if (toCompress.length === 0) {
    return true;
  }

  const reportInstance: Report | null = report ? new report(context) : null;
  const successful = await pool(toCompress, (item: CompressionItem) => compressor(context, reportInstance, item));
  reportInstance?.end();
  return successful.every((success) => success);
}
