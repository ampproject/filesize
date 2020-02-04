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
import { constants as brotliConstants, brotliCompress, gzip, ZlibOptions } from 'zlib';
import { readFile } from './fs';
import { LogError, Report } from './log';

const COMPRESSION_CONCURRENCY = cpus().length;
const BROTLI_OPTIONS = {
  params: {
    [brotliConstants.BROTLI_PARAM_MODE]: brotliConstants.BROTLI_DEFAULT_MODE,
    [brotliConstants.BROTLI_PARAM_QUALITY]: brotliConstants.BROTLI_MAX_QUALITY,
    [brotliConstants.BROTLI_PARAM_SIZE_HINT]: 0,
  },
};
const GZIP_OPTIONS: ZlibOptions = {
  level: 9,
};

interface CompressionItem {
  path: string;
  compression: Compression;
  maxSize: maxSize;
}

/**
 * Use the given configuration and actual size to report item filesize.
 * @param item Configuration for an Item
 * @param error Error from compressing an Item
 * @param size actual size for this comparison
 */
function store(report: Report, context: Context, item: CompressionItem, error: Error | null, size: number): boolean {
  if (error !== null) {
    LogError(`Could not compress '${item.path}' with '${item.compression}'.`);
    return false;
  }

  // Store the size of the item in the compression map.
  const sizeMap = context.compressed.get(item.path);
  if (sizeMap === undefined) {
    LogError(`Could not find item '${item.path}' with '${item.compression}' in compression map.`);
    return false;
  }
  sizeMap[OrderedCompressionValues.indexOf(item.compression)][0] = size;

  report.update(context);
  if (item.maxSize === undefined) {
    return true;
  }
  return size < item.maxSize;
}

/**
 * Given a context, compress all Items within splitting work eagly per cpu core to achieve some concurrency.
 * @param context Finalized Valid Context from Configuration
 */
export default async function compress(context: Context): Promise<boolean> {
  const report = new Report(context);

  /**
   * Compress an Item and report status to the console.
   * @param item Configuration for an Item.
   */
  async function compressor(item: CompressionItem): Promise<boolean> {
    const contents = await readFile(item.path);
    if (contents) {
      const buffer = Buffer.from(contents, 'utf8');

      switch (item.compression) {
        case 'brotli':
          return new Promise(resolve =>
            brotliCompress(buffer, BROTLI_OPTIONS, (error: Error | null, result: Buffer) =>
              resolve(store(report, context, item, error, result.byteLength)),
            ),
          );
        case 'gzip':
          return new Promise(resolve =>
            gzip(buffer, GZIP_OPTIONS, (error: Error | null, result: Buffer) => resolve(store(report, context, item, error, result.byteLength))),
          );
        default:
          return store(report, context, item, null, buffer.byteLength);
      }
    }

    return false;
  }

  const toCompress: Array<CompressionItem> = [];
  for (const [path, sizeMapValue] of context.compressed) {
    for (let iterator: number = 0; iterator < OrderedCompressionValues.length; iterator++) {
      const [size, maxSize] = sizeMapValue[iterator];
      if (size !== undefined) {
        toCompress.push({
          path,
          compression: OrderedCompressionValues[iterator] as Compression,
          maxSize,
        });
      }
    }
  }

  let success: boolean = true;
  for (let iterator: number = 0; iterator < toCompress.length; iterator += COMPRESSION_CONCURRENCY) {
    if (iterator === 0) {
      report.update(context);
    }
    let itemsSuccessful = await Promise.all(toCompress.slice(iterator, iterator + COMPRESSION_CONCURRENCY).map(compressor));
    if (itemsSuccessful.includes(false)) {
      success = false;
    }
  }

  report.end();
  return success;
}
