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

import { readFile } from '../fs';
import { Context, ConditionFunction, ItemConfig } from './Condition';
import { Track } from './Track';
import { MakeError } from '../log';
import ValidateFileConfig from './File';
import { isObject } from '../object';

interface ConfigContext {
  error: string | null;
  package: string;
  content: string | null;
  json: any;
  keys: any;
}

/**
 * Read the contents of package.json.
 * @param context
 */
async function readPackage(context: ConfigContext): Promise<void> {
  context.content = await readFile(context.package);
  if (context.content === null) {
    context.error = `Could not read the configuration in '${context.package}'`;
  }
}

/**
 * Parse the content of package.json, ensure data is usable.
 * @param context
 */
async function parsePackage(context: ConfigContext): Promise<void> {
  try {
    const { filesize: json } = JSON.parse(context.content as string);

    if (typeof json === 'undefined') {
      context.error = `There is no 'filesize' configuration in '${context.package}'`;
      return;
    }

    const { track, ...keys } = json;
    if (Object.entries(keys).length === 0) {
      context.error = `There is no data inside the 'filesize' configuration in '${context.package}'`;
      return;
    }

    if (!isObject(keys)) {
      context.error =
        `'filesize' configuration is not an object in '${context.package}'` +
        '(See https://github.com/ampproject/filesize/... for details on the structure of the filesize object).';
      return;
    }

    context.json = json;
    context.keys = keys;
  } catch (e) {
    context.error = `Could not parse '${context.package}'`;
  }
}

/**
 * Parse the content of the 'filesize' items.
 * @param context
 * @param overallContext
 */
async function parseFiles(context: ConfigContext, overallContext: Context): Promise<void> {
  let index = 0;
  for (const [path, item] of Object.entries(context.keys)) {
    index++;
    if (!isObject(item)) {
      continue;
    }

    const { success, error, config } = await ValidateFileConfig(path, index, item as any);
    if (!success) {
      context.error = error;
      return;
    }
    overallContext.config.push(...(config as Array<ItemConfig>));
  }
}

const CONDITIONS = [readPackage, parsePackage, parseFiles];

const Config: ConditionFunction = (context: Context) =>
  async function() {
    const configContext: ConfigContext = {
      error: null,
      package: context.package,
      content: null,
      keys: null,
      json: null,
    };
    for await (const condition of CONDITIONS) {
      await condition(configContext, context);
      if (configContext.error !== null) {
        return MakeError(configContext.error);
      }
    }

    // If all successful, add elements for tracking size deltas.
    await Track(context, configContext.keys);
    return null;
  };

export default Config;
