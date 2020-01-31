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

import { ItemConfig, Compression } from './Condition';
import { isFile } from '../fs';
import { resolve } from 'path';
const bytes = require('bytes');
import { MakeError } from '../log';

const READABLE_KEY_NAMES = ['path', 'compression', 'maxSize'];

/**
 * Format input string to a known Compression Enum Value.
 * @param fsValue
 */
function compressionValue(fsValue: string): { compression: Compression; error: string | null } {
  switch (fsValue.toLowerCase()) {
    case 'brotli':
      return { compression: Compression.BROTLI, error: null };
    case 'gzip':
      return { compression: Compression.GZIP, error: null };
    case '':
    case 'none':
      return { compression: Compression.NONE, error: null };
    default:
      return { compression: Compression.NONE, error: `Invalid compression value '${fsValue}'` };
  }
}

/**
 * Ensure a File config entry contains all the necessary keys.
 * @param bundle
 */
export function FileConfigContainsKeys(fileConfig: { [key: string]: string }): { success: boolean; invalid: number | null } {
  const mandatoryValues = READABLE_KEY_NAMES.map(key => fileConfig[key]);
  const missingKeyIndex = mandatoryValues.findIndex(item => typeof item !== 'string');

  return { success: missingKeyIndex < 0, invalid: missingKeyIndex < 0 ? null : missingKeyIndex };
}

/**
 * Validate a File config contains necessary keys and valid values.
 * @param fileConfig
 * @param index
 */
export default async function ValidateFileConfig(
  fileConfig: { path: string; compression: string; maxSize: string },
  index: number,
): Promise<{ success: boolean; config: ItemConfig | null; error: string | null }> {
  const path = resolve(fileConfig.path);
  const { compression, error: compressionError } = compressionValue(fileConfig.compression);
  const maxSize = bytes(fileConfig.maxSize);

  const invalidValue = [await isFile(path), compressionError === null, maxSize > 0].findIndex(item => item === false);
  if (invalidValue >= 0) {
    const valueErrorMapping = ['(path is not a valid file)', `(${compressionError})`, '(maxSize is not valid)'];

    return {
      success: false,
      config: null,
      error: MakeError(`${fileConfig.path ? `'${fileConfig.path}'` : `#${index}`} configuration is invalid. ${valueErrorMapping[invalidValue]}`),
    };
  }

  return {
    success: true,
    config: {
      originalPath: fileConfig.path,
      path,
      compression,
      maxSize,
    },
    error: null,
  };
}
