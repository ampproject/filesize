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
import { Report } from './report';
import { Context, brotliSize, gzipSize, noneSize } from '../validation/Condition';
import { maxFormatDisplay, formats } from './helpers/format';
import { maxPathDisplay } from './helpers/path';
import { write } from './helpers/output';
import { prettyBytes } from './helpers/bytes';
import { ICONS } from './helpers/icons';

export class CLIReport extends Report {
  protected maxPathDisplay: number;
  protected maxFormatDisplay: number;
  protected currentLine: string;

  constructor(context: Context) {
    super(context);

    this.silent = context.silent;
    this.maxPathDisplay = maxPathDisplay(context);
    this.maxFormatDisplay = maxFormatDisplay(context);

    this.start();
  }

  private start(): void {
    write(kleur.bold('\n  Filesizes\n'));
    write(`${''.padEnd(this.maxPathDisplay + 5)} ${formats(this.maxFormatDisplay)}\n`);
  }

  protected displaySize([size, maxSize]: brotliSize | gzipSize | noneSize): {
    success: number;
    warning: number;
    failure: number;
    processing: number;
  } {
    const status = {
      success: 0,
      warning: 0,
      failure: 0,
      processing: 0,
    };

    if (size === null) {
      // Item is still processing.
      status.processing++;
    }

    if (size === undefined || size === null) {
      // Will not be calculated.
      this.currentLine += kleur.dim().grey('–'.padEnd(this.maxFormatDisplay));
      return status;
    }

    const outputBytes = prettyBytes(size);
    if (maxSize === undefined) {
      this.currentLine += kleur.dim().grey(outputBytes.padEnd(this.maxFormatDisplay));
      return status;
    }
    if (size < maxSize) {
      if (1 - size / maxSize < 0.05) {
        this.warning++;
        status.warning++;
        this.currentLine += kleur.yellow(outputBytes.padEnd(this.maxFormatDisplay));
        return status;
      }

      this.success++;
      status.success++;
      this.currentLine += kleur.dim().green(outputBytes.padEnd(this.maxFormatDisplay));
      return status;
    }

    this.failure++;
    status.failure++;
    this.currentLine += kleur.red(outputBytes.padEnd(this.maxFormatDisplay));
    return status;
  }

  public end(): void {
    super.end();

    const { success, failure, warning } = this;
    if (success > 0 || failure > 0 || warning > 0) {
      write(
        '\n  ' +
          kleur.green(success + ` ${success === 1 ? 'check' : 'checks'} passed`) +
          (failure === 0 ? ` ${ICONS['tada']}` : ''),
      );
      if (warning > 0) {
        write(
          '\n  ' +
            kleur.yellow(warning + ` ${warning === 1 ? 'check' : 'checks'} warned`) +
            kleur.grey(' (within 5% of allowed size)'),
        );
      }
      if (failure > 0) {
        write('\n  ' + kleur.red(failure + ` ${failure === 1 ? 'check' : 'checks'} failed`));
      }
      write('\n\n');
    }
  }
}
