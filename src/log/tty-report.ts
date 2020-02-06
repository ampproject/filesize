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

const kleur = require('kleur');
import { Report } from './report';
import { Context, OrderedCompressionValues } from '../validation/Condition';
import { write, erase } from './helpers/output';
import { ICONS } from './helpers/icons';

// Disable output colors for test runs.
kleur.enabled = !('AVA_PATH' in process.env);
// Aliases to colors used.
// @ts-ignore
const { red, grey, yellow, green, bold, dim } = kleur;

export class TTYReport extends Report {
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

  public update = (context: Context): void => {
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
      let includesFailure = false;
      let isProcessing = false;
      this.currentLine = ' ' + displayPath.substring(displayPath.length - this.maxPathDisplay).padEnd(this.maxPathDisplay) + '  ';
      for (let i = 0; i < OrderedCompressionValues.length; i++) {
        const hasFailure = this.displaySize(sizeMapValue, i);
        if (hasFailure === null) {
          isProcessing = true;
        } else if (includesFailure !== true) {
          includesFailure = hasFailure;
        }
      }
      if (includesFailure) {
        this.currentLine = '  ' + red(ICONS['cross']) + this.currentLine;
      } else if (isProcessing) {
        this.currentLine = '  ' + dim().grey('-') + this.currentLine;
      } else {
        this.currentLine = '  ' + dim().green(ICONS['tick']) + this.currentLine;
      }

      output += this.currentLine + '\n';
      this.outputLength++;
    }

    erase(previousOutputLength);
    write(output);
    write('\n  ' + green(this.success + ` ${this.success === 1 ? 'check' : 'checks'} passed`) + (this.failure === 0 ? ` ${ICONS['tada']}` : ''));
    this.outputLength++;
    if (this.warning > 0) {
      write('\n  ' + yellow(this.warning + ` ${this.warning === 1 ? 'check' : 'checks'} warned`) + grey(' (within 5% of allowed size)'));
      this.outputLength++;
    }
    if (this.failure > 0) {
      write('\n  ' + red(this.failure + ` ${this.failure === 1 ? 'check' : 'checks'} failed`));
      this.outputLength++;
    }
    write('\n\n');
    this.outputLength = this.outputLength + 3;
  };

  /**
   *
   */
  public end = (): void => {
    return;
  };
}
