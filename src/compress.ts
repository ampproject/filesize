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
import { cpus } from 'os';
import { readFile } from './helpers/fs';
import { Report } from './log/report';
// import { TTYReport } from './log/tty-report';
// import { stdout } from 'process';
import { compressor } from './worker';

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
    const promise: Promise<boolean> = Promise.resolve().then(() => compressor(context, report, item));
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
  await Promise.all(returnable);

  return success;

  // const toCompressPromises: Array<Promise<boolean>> = toCompress.map(item => compressor(context, report, item));
  // let success = true;
  // let active = 0;
  // let index = 0;

  // report?.update(context);
  // do {
  //   const compressionPromisesToStart = toCompressPromises.slice(index, index + (COMPRESSION_CONCURRENCY - active));
  //   const fastestResult = await Promise.race(compressionPromisesToStart);

  //   if (fastestResult === false) {
  //     success = false;
  //   }
  //   yield success;
  //   // let itemResult = await Promise.race()
  // } while(index < toCompress.length)

  // async function asyncPool(poolLimit, array, iteratorFn) {
  //   const ret: Array<any> = [];
  //   const executing: Array<any> = [];
  //   for (const item of array) {
  //     const p = Promise.resolve().then(() => iteratorFn(item, array));
  //     ret.push(p);

  //     if (poolLimit <= array.length) {
  //       const e = p.then(() => executing.splice(executing.indexOf(e), 1));
  //       executing.push(e);
  //       if (executing.length >= poolLimit) {
  //         await Promise.race(executing);
  //       }
  //     }
  //   }
  //   return Promise.all(ret);
  // }

  // for (let index: number = 0; index < toCompressLength; index += (COMPRESSION_CONCURRENCY - active)) {
  //   if (iterator === 0) {
  //     report?.update(context);
  //   }
  //   let itemResult = await Promise.race(
  //     toCompress.slice(iterator, iterator + COMPRESSION_CONCURRENCY).map(item => compressor(context, report, item)),
  //   );
  //   if (itemResult === false) {
  //     success = false;
  //   }

  //   if (itemsSuccessful.includes(false)) {
  //     success = false;
  //   }
  //   yield success;
  // }

  report?.end();
  return success;
}
