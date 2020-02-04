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

const kleur = require('kleur');
const bytes = require('bytes');
import { Context, OrderedCompressionValues, SizeMapValue } from './validation/Condition';
import { eraseLines, write } from './process';

// Disable output colors for test runs.
kleur.enabled = !('AVA_PATH' in process.env);

// Aliases to colors used.
// @ts-ignore
const { red, grey, yellow, green, bold, dim } = kleur;

const isWin32 = process.platform === 'win32';
const ICONS = {
  tick: isWin32 ? '√' : '✔',
  cross: isWin32 ? '×' : '✖',
  tada: '🎉',
};

/**
 * Format output as an error message.
 * @param output
 */
export function MakeError(output: string): string {
  return `${kleur.red('error')} ${output}`;
}

/**
 * Display output as an error message on the console.
 * @param output
 */
export function LogError(output: string): void {
  console.log(MakeError(output));
}

/**
 * Format size into more human readable string.
 * @param size
 */
function prettyBytes(size: number): string {
  return bytes(size, { unit: 'kb', fixedDecimals: true, unitSeparator: ' ' });
}

export class Report {
  private paths: Array<string>;
  private maxPathDisplay: number = 30;
  private maxFormatDisplay: number;
  private success: number = 0;
  private failure: number = 0;
  private warning: number = 0;
  private silent: boolean = false;
  private firstUpdate: boolean = true;
  private currentLine: string;
  private redraw: boolean = false;

  constructor(context: Context) {
    if (context.silent === true) {
      this.silent = true;
      return;
    }

    this.paths = Array.from(context.compressed.keys());
    this.maxPathDisplay = Math.max.apply(
      null,
      Array.from(context.originalPaths.values()).map(ogPath => Math.min(ogPath.length, this.maxPathDisplay) + 2),
    );

    this.maxFormatDisplay =
      Math.max.apply(
        null,
        OrderedCompressionValues.map(compression => compression.length),
      ) + 3;

    this.start();
  }

  private displaySize = (sizeMapValue: SizeMapValue, mapIndex: number): boolean | null => {
    const [size, maxSize] = sizeMapValue[mapIndex] as [number | null, number | null];
    if (size === undefined || size === null || maxSize === undefined || maxSize === null) {
      this.currentLine += dim().grey('–'.padEnd(this.maxFormatDisplay));
      return size === undefined ? false : null;
    }

    const outputBytes = prettyBytes(size);
    if (outputBytes.length >= this.maxFormatDisplay) {
      this.maxFormatDisplay = outputBytes.length + 2;
      this.redraw = true;
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

  private formats = (): string => {
    return OrderedCompressionValues.map(compression => compression.padEnd(this.maxFormatDisplay)).join('');
  };

  private start(): void {
    write(bold('\n  Filesizes\n'));
  }

  public update = (context: Context): void => {
    if (this.silent) {
      return;
    }
    this.currentLine = '';
    this.redraw = false;
    this.success = 0;
    this.failure = 0;
    this.warning = 0;

    let output: string = '';
    for (const path of this.paths) {
      const sizeMapValue = context.compressed.get(path);
      if (!sizeMapValue) {
        continue;
      }

      const displayPath = context.originalPaths.get(path) || path;
      let includesFailure = false;
      let isProcessing = false;
      this.currentLine = ' ' + displayPath.substring(displayPath.length - this.maxPathDisplay).padEnd(this.maxPathDisplay) + ' ';
      for (let i = 0; i < OrderedCompressionValues.length; i++) {
        const hasFailure = this.displaySize(sizeMapValue, i);
        if (hasFailure === null) {
          isProcessing = true;
        } else if (includesFailure !== true) {
          includesFailure = hasFailure;
        }
      }
      if (isProcessing) {
        this.currentLine = '  ' + dim().grey('-') + this.currentLine;
      } else if (includesFailure) {
        this.currentLine = '  ' + red(ICONS['cross']) + this.currentLine;
      } else {
        this.currentLine = '  ' + dim().green(ICONS['tick']) + this.currentLine;
      }

      output += this.currentLine + '\n';
    }

    const toErase = this.firstUpdate ? 1 : this.paths.length + 2;
    if (!this.redraw) {
      eraseLines(toErase);
      this.firstUpdate = false;
      write(`${''.padEnd(this.maxPathDisplay + 4)} ${this.formats()}\n` + output);
    } else {
      this.update(context);
    }
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
