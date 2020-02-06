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
import { Context, OrderedCompressionValues, SizeMapValue } from '../validation/Condition';
import { maxFormatDisplay, formats } from './helpers/format';
import { maxPathDisplay } from './helpers/path';
import { write } from './helpers/output';
import { prettyBytes } from './helpers/bytes';
import { ICONS } from './helpers/icons';

// Disable output colors for test runs.
kleur.enabled = !('AVA_PATH' in process.env);
// Aliases to colors used.
// @ts-ignore
const { red, grey, yellow, green, bold, dim } = kleur;

export class Report {
  protected silent: boolean = false;
  protected paths: Array<string>;
  protected maxPathDisplay: number;
  protected maxFormatDisplay: number;
  protected currentLine: string;
  protected warning: number = 0;
  protected success: number = 0;
  protected failure: number = 0;
  private completedPaths: Array<string> = [];

  constructor(context: Context) {
    if (context.silent) {
      this.silent = true;
      return;
    }

    this.paths = Array.from(context.compressed.keys());
    this.maxPathDisplay = maxPathDisplay(context);
    this.maxFormatDisplay = maxFormatDisplay(context);

    this.start();
  }

  private start(): void {
    write(bold('\n  Filesizes\n'));
    write(`${''.padEnd(this.maxPathDisplay + 5)} ${formats(this.maxFormatDisplay)}\n`);
  }

  protected displaySize = (sizeMapValue: SizeMapValue, mapIndex: number): boolean | null => {
    const [size, maxSize] = sizeMapValue[mapIndex];
    if (size === undefined || size === null) {
      this.currentLine += dim().grey('–'.padEnd(this.maxFormatDisplay));
      return size === undefined ? false : null;
    }

    const outputBytes = prettyBytes(size);
    if (maxSize === undefined) {
      this.currentLine += dim().grey(outputBytes.padEnd(this.maxFormatDisplay));
      return false;
    }
    if (size < maxSize) {
      if (1 - size / maxSize < 0.05) {
        this.warning++;
        this.currentLine += yellow(outputBytes.padEnd(this.maxFormatDisplay));
        return false;
      }

      this.success++;
      this.currentLine += dim().green(outputBytes.padEnd(this.maxFormatDisplay));
      return false;
    }

    this.failure++;
    this.currentLine += red(outputBytes.padEnd(this.maxFormatDisplay));
    return true;
  };

  public update = (context: Context): void => {
    if (this.silent) {
      return;
    }
    this.success = 0;
    this.failure = 0;
    this.warning = 0;

    let output: string = '';
    for (const path of this.paths) {
      const sizeMapValue = context.compressed.get(path);
      if (!sizeMapValue || this.completedPaths.includes(path)) {
        continue;
      }

      this.currentLine = '';
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
      if (isProcessing) {
        // The default report is used when TTY terminal isn't supported.
        // We can only output items that are fully calculated.
        break;
      }
      this.completedPaths.push(path);

      if (includesFailure) {
        this.currentLine = '  ' + red(ICONS['cross']) + this.currentLine;
      } else {
        this.currentLine = '  ' + dim().green(ICONS['tick']) + this.currentLine;
      }

      output += this.currentLine + '\n';
    }

    write(output);
  };

  public end = (): void => {
    if (this.silent) {
      return;
    }

    const { success, failure, warning } = this;
    if (success > 0 || failure > 0 || warning > 0) {
      write('\n  ' + green(success + ` ${success === 1 ? 'check' : 'checks'} passed`) + (failure === 0 ? ` ${ICONS['tada']}` : ''));
      if (warning > 0) {
        write('\n  ' + yellow(warning + ` ${warning === 1 ? 'check' : 'checks'} warned`) + grey(' (within 5% of allowed size)'));
      }
      if (failure > 0) {
        write('\n  ' + red(failure + ` ${failure === 1 ? 'check' : 'checks'} failed`));
      }
      write('\n\n');
    }
  };
}
