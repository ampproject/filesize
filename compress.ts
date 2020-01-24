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

import { Context, ItemConfig, Compression } from './validation/Condition';
import { cpus } from 'os';
import bytes from 'bytes';
import { constants as brotliConstants, brotliCompress, gzip, ZlibOptions } from 'zlib';
import { readFile } from './fs';
import { LogError, LogPassingOutput, LogFailingOutput } from './log';

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

/**
 * Use the given configuration and actual size to report item filesize.
 * @param item Configuration for an Item
 * @param error Error from compressing an Item
 * @param size actual size for this comparison
 */
function report(item: ItemConfig, error: Error | null, size: number): boolean {
  if (error !== null) {
    LogError(`Could not compress '${item.path}' with '${item.compression}'.`);
    return false;
  }

  if (item.maxSize >= size) {
    LogPassingOutput(`${item.path} ${bytes(size)} <= ${bytes(item.maxSize)}`);
    return true;
  }

  LogFailingOutput(`${item.path} ${bytes(size)} > ${bytes(item.maxSize)}`);
  return false;
}

/**
 * Compress an Item and report status to the console.
 * @param item Configuration for an Item.
 */
async function compressor(item: ItemConfig): Promise<boolean> {
  const contents = await readFile(item.path);
  if (contents) {
    const buffer = Buffer.from(contents, 'utf8');

    switch (item.compression) {
      case Compression.BROTLI:
        return new Promise(resolve =>
          brotliCompress(buffer, BROTLI_OPTIONS, (error: Error | null, result: Buffer) => resolve(report(item, error, result.byteLength))),
        );
      case Compression.GZIP:
        return new Promise(resolve =>
          gzip(buffer, GZIP_OPTIONS, (error: Error | null, result: Buffer) => resolve(report(item, error, result.byteLength))),
        );
      case Compression.NONE:
      default:
        return report(item, null, buffer.byteLength);
    }
  }

  return false;
}

/**
 * Given a context, compress all Items within splitting work eagly per cpu core to achieve some concurrency.
 * @param context Finalized Valid Context from Configuration
 */
export default async function compress(context: Context): Promise<boolean> {
  let success: boolean = true;
  for (let iterator: number = 0; iterator < context.config.length; iterator += COMPRESSION_CONCURRENCY) {
    let itemsSuccessful = await Promise.all(context.config.slice(iterator, iterator + COMPRESSION_CONCURRENCY).map(compressor));
    if (itemsSuccessful.includes(false)) {
      success = false;
    }
  }

  return success;
}
