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

import { readFile } from '../helpers/fs';
import { Context, ConditionFunction, ValidationResponse } from './Condition';
import { Track } from './Track';
import { MakeError } from '../log/helpers/error';
import ValidateFileConfig from './File';
import { isObject } from '../helpers/object';

/**
 * Parse the content of the 'filesize' items.
 * @param context
 * @param overallContext
 */
async function parseEnforcedKeys(context: Context, enforcedKeys: any): Promise<ValidationResponse> {
  for (const [path, item] of Object.entries(enforcedKeys)) {
    if (!isObject(item)) {
      continue;
    }

    const error = await ValidateFileConfig(path, item as any, context);
    if (error) {
      return error;
    }
  }

  return null;
}

const CONDITIONS = [
  /**
   * Read the contents of package.json.
   * @param context
   */
  async function readPackage(context: Context): Promise<ValidationResponse> {
    const packageContent = await readFile(context.packagePath);
    if (packageContent === null) {
      return `Could not read the configuration in '${context.packagePath}'`;
    }

    context.packageContent = packageContent;
    return null;
  },
  /**
   * Parse the content of package.json, ensure data is usable.
   * @param context
   */
  async function parsePackage(context: Context): Promise<ValidationResponse> {
    try {
      const { filesize: json } = JSON.parse(context.packageContent as string);

      if (typeof json === 'undefined') {
        return `There is no 'filesize' configuration in '${context.packagePath}'`;
      }

      const { track, ...keys } = json;
      if (Object.entries(keys).length === 0 && track === undefined) {
        return `There is no data inside the 'filesize' configuration in '${context.packagePath}'`;
      }

      if (!isObject(keys) && track === undefined) {
        return (
          `'filesize' configuration is not an object in '${context.packagePath}'` +
          '(See https://github.com/ampproject/filesize/#usage for details on the structure of the filesize object).'
        );
      }

      // Since we have tracked entries, we need to store them
      const parseTrackingResult = await Track(context, json);
      if (parseTrackingResult !== null) {
        return parseTrackingResult;
      }

      const parseKeysResults = await parseEnforcedKeys(context, keys);
      if (parseKeysResults !== null) {
        return parseKeysResults;
      }
    } catch (e) {
      return `Could not parse '${context.packagePath}'`;
    }
    return null;
  },
];

const Config: ConditionFunction = (context: Context) =>
  async function() {
    for await (const condition of CONDITIONS) {
      const conditionResult = await condition(context);
      if (conditionResult !== null) {
        return MakeError(conditionResult);
      }
    }

    return null;
  };

export default Config;
