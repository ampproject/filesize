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

import { Compression, ItemConfig } from '../validation/Condition';
import { resolve } from 'path';
import { isFile } from '../fs';
const bytes = require('bytes');

/**
 * Format input string to a known Compression Enum Value.
 * @param fsValue
 */
function compressionValue(fsValue: string): [Compression, string | null] {
  switch (fsValue.toLowerCase()) {
    case 'brotli':
      return [Compression.BROTLI, null];
    case 'gzip':
      return [Compression.GZIP, null];
    case '':
    case 'none':
      return [Compression.NONE, null];
    default:
      return [Compression.NONE, `Invalid compression value '${fsValue}'`];
  }
}

export default async function ValidateFileConfig(
  originalPath: string,
  index: number,
  compressionConfig: { [key: string]: string },
): Promise<{ success: boolean; config: Array<ItemConfig> | null; error: string | null }> {
  const entries = Object.entries(compressionConfig);
  if (entries.length === 0) {
    return {
      success: false,
      config: [],
      error: `Configuration for ${originalPath ? `'${originalPath}'` : `#${index}`} is invalid. (compression values unspecified)`,
    };
  }

  const path = resolve(originalPath);
  const config: Array<ItemConfig> = [];
  for (const [configKey, configValue] of entries) {
    const [compression, compressionError] = compressionValue(configKey);
    const maxSize = bytes(configValue);
    const invalidValue = [await isFile(path), compressionError === null, maxSize > 0].findIndex(item => item === false);
    const valueErrorMapping = ['(path is not a valid file)', `(${compressionError})`, '(size unspecified)'];
    if (invalidValue >= 0) {
      return {
        success: false,
        config: null,
        error: `Configuration for ${originalPath ? `'${originalPath}'` : `#${index}`} is invalid. ${valueErrorMapping[invalidValue]}`,
      };
    }

    config.push({
      originalPath,
      path,
      compression,
      maxSize,
    });
  }

  return {
    success: true,
    config,
    error: null,
  };
}
