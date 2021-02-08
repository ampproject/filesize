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

import { Compression, Context, SizeMapValue, SizeMapValueIndex } from './Condition';
import { resolve, isAbsolute } from 'path';
import { isFile } from '../helpers/fs';
import bytes from '@kristoferbaxter/bytes';

/**
 * Format input string to a known Compression Enum Value.
 * @param fsValue
 */
export function validateCompressionName(fsValue: string): Compression | null {
  const lowerCaseValue = fsValue.toLowerCase();
  switch (fsValue.toLowerCase()) {
    case 'brotli':
    case 'gzip':
    case 'none':
      return lowerCaseValue as Compression;
    case '':
      return 'none';
    default:
      return null;
  }
}

export default async function validateFileConfig(
  originalPath: string,
  compressionConfig: { [key: string]: string },
  context: Context,
): Promise<string | null> {
  const entries = Object.entries(compressionConfig);
  if (entries.length === 0) {
    return `Configuration for '${originalPath}' is invalid. (compression values unspecified)`;
  }

  let path: string;
  if (isAbsolute(originalPath)) {
    path = resolve(originalPath);
  } else {
    path = resolve(context.projectPath, originalPath);
  }
  if (!(await isFile(path))) {
    return `Configuration for '${originalPath}' is invalid. (path is not a valid file)`;
  }

  for (const [configKey, configValue] of entries) {
    const compression: Compression | null = validateCompressionName(configKey);
    if (compression === null) {
      return `Configuration for '${originalPath}' is invalid. (Invalid compression value '${configKey}')`;
    }

    const maxSize = bytes(configValue);
    if (maxSize === null || maxSize < 0) {
      return `Configuration for '${originalPath}' is invalid. (size unspecified)`;
    }

    let compressedItem: SizeMapValue | undefined = context.compressed.get(path);
    if (!compressedItem) {
      compressedItem = [
        [undefined, undefined],
        [undefined, undefined],
        [undefined, undefined],
      ];
    }
    compressedItem[SizeMapValueIndex[compression]] = [null, maxSize];
    context.compressed.set(path, compressedItem);
    context.originalPaths.set(path, originalPath);
  }
  return null;
}
