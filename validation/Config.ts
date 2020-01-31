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

import { readFile } from '../fs';
import { Context, ConditionFunction, ItemConfig } from './Condition';
import ValidateFileConfig, { FileConfigContainsKeys } from './File';
import { MakeError } from '../log';

const READABLE_KEY_NAMES = ['path', 'compression', 'maxSize'];

const Config: ConditionFunction = (context: Context) =>
  async function() {
    let contents: string = '';

    const readFileAttempt: string | null = await readFile(context.package);
    if (readFileAttempt !== null) {
      contents = readFileAttempt;
    } else {
      return [false, MakeError(`Could not read the configuration in '${context.package}'`)];
    }

    try {
      const { filesize } = JSON.parse(contents);

      if (typeof filesize === 'undefined') {
        return [false, MakeError(`There is no 'filesize' configuration in '${context.package}'`)];
      } else if (Array.isArray(filesize)) {
        let index = 0;

        for (const file of filesize) {
          index++;

          const hasNecessaryKeys = FileConfigContainsKeys(file);
          if (hasNecessaryKeys.success) {
            const validatedItem = await ValidateFileConfig(file, index);

            if (validatedItem.success) {
              context.config.push(validatedItem.config as ItemConfig);
            } else {
              return [false, validatedItem.error];
            }
          } else {
            const message = MakeError(
              `Configuration for ${file.path ? `'${file.path}'` : `#${index}`} is invalid. (key: ${
                READABLE_KEY_NAMES[hasNecessaryKeys.invalid as number]
              })`,
            );
            return [false, message];
          }
        }
      }

      return [true, null];
    } catch (e) {
      return [false, MakeError(`Could not parse '${context.package}'`)];
    }
  };

export default Config;
