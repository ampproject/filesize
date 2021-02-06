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

import * as path from 'path';
import Project from './validation/Project';
import Config from './validation/Config';
import { Context, FileModifier, SizeMap } from './validation/Condition';
import compress, { CompressionItem, findItemsToCompress } from './compress';
import { Report } from './log/report';
export { Report } from './log/report';
export { NoTTYReport } from './log/no-tty-report';

export async function report(
  configOrProjectPath: string,
  fileModifier: FileModifier,
  report?: typeof Report,
  silent?: boolean,
): Promise<SizeMap> {
  let projectPath = '';
  let packagePath = '';
  if (path.extname(configOrProjectPath) === '.json') {
    // The requested config or project path is a config.
    packagePath = configOrProjectPath;
  } else {
    projectPath = configOrProjectPath;
  }

  const conditions = [Project, Config];
  let context: Context = {
    projectPath,
    packagePath,
    packageContent: '',
    silent: silent ?? true,
    originalPaths: new Map(),
    // Stores the result of compression <path, [...results]>
    compressed: new Map(),
    // Stores the basis of comparison.
    comparison: new Map(),
    fileModifier,
    fileContents: new Map(),
  };

  for (const condition of conditions) {
    const message = await condition(context)();
    if (message !== null) {
      throw message;
    }
  }

  const toCompress: Array<CompressionItem> = await findItemsToCompress(context, true);
  await compress(context, toCompress, report || null);
  return context.compressed;
}
