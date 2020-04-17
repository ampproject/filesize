/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

import { constants as brotliConstants, brotliCompress, gzip } from 'zlib';
import { Report } from './log/report';
import { Context, Compression, maxSize, OrderedCompressionValues } from './validation/Condition';
import { LogError } from './log/helpers/error';

type CompressionMethod = (buffer: Buffer, options: {}, callback: (error: Error | null, result: Buffer) => void) => void;

interface CompressionItem {
  path: string;
  compression: Compression;
  maxSize: maxSize;
}

const SUPPORTED_COMPRESSION: Map<string, [CompressionMethod, Object]> = new Map([
  [
    'brotli',
    [
      brotliCompress,
      {
        params: {
          [brotliConstants.BROTLI_PARAM_MODE]: brotliConstants.BROTLI_DEFAULT_MODE,
          [brotliConstants.BROTLI_PARAM_QUALITY]: brotliConstants.BROTLI_MAX_QUALITY,
          [brotliConstants.BROTLI_PARAM_SIZE_HINT]: 0,
        },
      },
    ],
  ],
  [
    'gzip',
    [
      gzip,
      {
        level: 9,
      },
    ],
  ],
]);

/**
 * Use the given configuration and actual size to report item filesize.
 * @param report Optional reporter to update with this value
 * @param item Configuration for an Item
 * @param error Error from compressing an Item
 * @param size actual size for this comparison
 */
function store(
  report: Report | null,
  context: Context,
  item: CompressionItem,
  error: Error | null,
  size: number,
): boolean {
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

  report?.update(context);
  if (item.maxSize === undefined) {
    return true;
  }
  return size < item.maxSize;
}

export function compressor(context: Context, report: Report | null, item: CompressionItem): Promise<boolean> {
  const contents = context.fileContents.get(item.path);
  if (contents) {
    const buffer = Buffer.from(contents, 'utf8');

    return new Promise((resolve) => {
      const compression = SUPPORTED_COMPRESSION.get(item.compression);
      if (compression) {
        compression[0](buffer, compression[1], (error: Error | null, result: Buffer) => {
          resolve(store(report, context, item, error, result.byteLength));
        });
      } else {
        resolve(store(report, context, item, null, buffer.byteLength));
      }
    });
  }

  return Promise.resolve(false);
}
