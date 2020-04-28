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

import kleur from '@kristoferbaxter/kleur';
import { Context, OrderedCompressionValues } from '../validation/Condition';
import { write, erase } from './helpers/output';
import { ICONS } from './helpers/icons';
import { CLIReport } from './cli-report';

export class TTYReport extends CLIReport {
  private outputLength: number = 0;

  private reset = (): number => {
    const previousOutputLength = this.outputLength;
    this.currentLine = '';
    this.success = 0;
    this.failure = 0;
    this.warning = 0;
    this.outputLength = 0;
    return previousOutputLength;
  };

  private status = () => {
    write(
      '\n  ' +
        kleur.green(this.success + ` ${this.success === 1 ? 'check' : 'checks'} passed`) +
        (this.failure === 0 ? ` ${ICONS['tada']}` : ''),
    );
    this.outputLength++;
    if (this.warning > 0) {
      write(
        '\n  ' +
          kleur.yellow(this.warning + ` ${this.warning === 1 ? 'check' : 'checks'} warned`) +
          kleur.grey(' (within 5% of allowed size)'),
      );
      this.outputLength++;
    }
    if (this.failure > 0) {
      write('\n  ' + kleur.red(this.failure + ` ${this.failure === 1 ? 'check' : 'checks'} failed`));
      this.outputLength++;
    }
    write('\n\n');
    this.outputLength = this.outputLength + 3;
  };

  public end(): void {}
  public update(context: Context): void {
    if (this.silent) {
      return;
    }
    const previousOutputLength = this.reset();

    let output: string = '';
    for (const path of this.paths) {
      const sizeMapValue = context.compressed.get(path);
      if (!sizeMapValue) {
        continue;
      }

      const displayPath = context.originalPaths.get(path) || path;
      let failure = 0;
      let processing = 0;

      this.currentLine = ` ${displayPath
        .substring(displayPath.length - this.maxPathDisplay)
        .padEnd(this.maxPathDisplay)}  `;
      for (let i = 0; i < OrderedCompressionValues.length; i++) {
        const status = super.displaySize(sizeMapValue[i]);
        failure += status.failure;
        processing += status.processing;
      }

      const icon =
        failure > 0
          ? kleur.red(ICONS['cross'])
          : processing > 0
          ? kleur.dim().grey('-')
          : kleur.dim().green(ICONS['tick']);
      output += `  ${icon}${this.currentLine}\n`;
      this.outputLength++;
    }

    erase(previousOutputLength);
    write(output);
    this.status();
  }
}
