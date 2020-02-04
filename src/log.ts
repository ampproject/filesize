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
  private pathsDrawn: Set<string>;
  private success: number = 0;
  private failure: number = 0;
  private warning: number = 0;
  private currentLine: string;
  private silent: boolean = false;

  constructor(context: Context) {
    if (context.silent === true) {
      this.silent = true;
      return;
    }

    this.paths = Array.from(context.compressed.keys());
    this.maxPathDisplay = Math.max.apply(
      null,
      this.paths.map(path => Math.min(path.length, this.maxPathDisplay) + 2),
    );

    this.maxFormatDisplay =
      Math.max.apply(
        null,
        OrderedCompressionValues.map(compression => compression.length),
      ) + 2;

    this.pathsDrawn = new Set();

    this.start();
  }

  private displaySize = (sizeMapValue: SizeMapValue, mapIndex: number): boolean => {
    const [size, maxSize] = sizeMapValue[mapIndex] as [number | null, number | null];
    if (size === undefined || size === null || maxSize === undefined || maxSize === null) {
      this.currentLine += dim().grey('–'.padEnd(this.maxFormatDisplay));
      return false;
    }

    if (size < maxSize) {
      if (1 - size / maxSize < 0.05) {
        this.warning++;
        this.currentLine += yellow(prettyBytes(size).padEnd(this.maxFormatDisplay));
        return false;
      }

      this.success++;
      this.currentLine += dim().green(prettyBytes(size).padEnd(this.maxFormatDisplay));
      return false;
    }

    this.failure++;
    this.currentLine += red(prettyBytes(size).padEnd(this.maxFormatDisplay));
    return true;
  };

  private start(): void {
    const formats = OrderedCompressionValues.map(compression => compression.padEnd(this.maxFormatDisplay)).join('');
    console.log(bold('\n  Filesizes'));
    console.log(''.padEnd(this.maxPathDisplay + 4) + ' ' + formats);
  }

  public update = (context: Context): void => {
    if (this.silent) {
      return;
    }

    for (const path of this.paths) {
      const sizeMapValue = context.compressed.get(path);
      if (!sizeMapValue || this.pathsDrawn.has(path)) {
        // Do not output paths already drawn or with incomplete maps.
        continue;
      }

      if (sizeMapValue.some(size => size[0] === null)) {
        // If any size is null, then it's still being calculated.
        // This is our indication to exit the update.
        // Since we will recall it when each entry has been calculated in order.
        return;
      }

      // Otherwise, we can draw this path.
      let includesFailure = false;
      this.currentLine = ' ' + path.substring(path.length - this.maxPathDisplay) + ' ';
      for (let i = 0; i < OrderedCompressionValues.length; i++) {
        const hasFailure = this.displaySize(sizeMapValue, i);
        if (includesFailure !== true) {
          includesFailure = hasFailure;
        }
      }
      if (includesFailure) {
        this.currentLine = '  ' + red(ICONS['cross']) + this.currentLine;
      } else {
        this.currentLine = '  ' + dim().green(ICONS['tick']) + this.currentLine;
      }

      this.pathsDrawn.add(path);
      console.log(this.currentLine);
    }
  };

  public end = (): void => {
    if (this.silent) {
      return;
    }

    const { success, failure, warning } = this;
    if (success > 0 || failure > 0) {
      console.log('\n  ' + green(success + ` ${success === 1 ? 'check' : 'checks'} passed`) + (failure === 0 ? ` ${ICONS['tada']}` : ''));
      if (warning > 0) {
        console.log('  ' + yellow(warning + ` ${warning === 1 ? 'check' : 'checks'} warned`) + grey(' (within 5% of allowed size)'));
      }
      if (failure > 0) {
        console.log('  ' + red(failure + ` ${failure === 1 ? 'check' : 'checks'} failed`));
      }
    }
  };
}
