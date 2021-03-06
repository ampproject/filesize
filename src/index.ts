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

import mri from 'mri';
import { stdout } from 'process';
import Project from './validation/Project';
import Config from './validation/Config';
import { Context } from './validation/Condition';
import compress, { CompressionItem, findItemsToCompress } from './compress';
import { LogError } from './log/helpers/error';
import { shutdown } from './helpers/process';
import { Report } from './log/report';
import { TTYReport } from './log/tty-report';
import { NoTTYReport } from './log/no-tty-report';

const args = mri(process.argv.slice(2), {
  alias: { p: 'project', c: 'config' },
  default: { project: process.cwd(), config: '', silent: false },
});

/**
 * Read the configuration from the specified project, validate it, perform requested compression, and report the results.
 */
(async function () {
  const { project: projectPath, silent, config: requestedConfig } = args;
  const conditions = [Project, Config];
  const context: Context = {
    projectPath,
    packagePath: requestedConfig,
    packageContent: '',
    silent,
    originalPaths: new Map(),
    // Stores the result of compression <path, [...results]>
    compressed: new Map(),
    // Stores the basis of comparison.
    comparison: new Map(),
    fileModifier: null,
    fileContents: new Map(),
  };

  for (const condition of conditions) {
    const message = await condition(context)();
    if (message !== null) {
      LogError(message);
      shutdown(5);
      return;
    }
  }

  const toCompress: Array<CompressionItem> = await findItemsToCompress(context, true);
  const report: typeof Report = stdout.isTTY && toCompress.length < 30 ? TTYReport : NoTTYReport;
  const successful = await compress(context, toCompress, report);
  if (!successful) {
    shutdown(6);
  }
})();
