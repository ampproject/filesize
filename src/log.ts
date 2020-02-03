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
import { ItemConfig, CompressionMap, Context, OrderedCompressionValues } from './validation/Condition';

// Disable output colors for test runs.
kleur.enabled = !('AVA_PATH' in process.env);

// Aliases to colors used.
// @ts-ignore
const { red, grey, yellow, green, bold, dim } = kleur;
const ICONS = {
  tick: ['✔', '√'],
  cross: ['✖', '×'],
  tada: ['🎉', '🎉'],
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

/**
 * Retrieve an icon appropriate for your OS.
 * @param name
 */
function getIcon(name: 'tick' | 'cross' | 'tada') {
  if (process.platform === 'win32') {
    return ICONS[name][1];
  }

  return ICONS[name][0];
}

/**
 *
 * @param size
 * @param maxSize
 * @param maxWidth
 */
function displaySize(size: number | null, maxSize: number | null, maxWidth: number): ['success' | 'warning' | 'failure' | null, string] {
  if (size === null || maxSize === null) {
    return [null, dim().grey('–'.padEnd(maxWidth))];
  } else if (size < maxSize) {
    if (1 - size / maxSize < 0.05) {
      return ['warning', yellow(prettyBytes(size).padEnd(maxWidth))];
    }
    return ['success', dim().green(prettyBytes(size).padEnd(maxWidth))];
  } else {
    return ['failure', red(prettyBytes(size).padEnd(maxWidth))];
  }
}

/**
 *
 * @param report
 * @param paths
 * @param compression
 */
function maxLengthForCompression(report: Map<ItemConfig['path'], CompressionMap>, paths: Array<string>, compression: string): number {
  const reportedValueStrings: Array<number> = [compression.length];

  for (const path of paths) {
    const value = report.get(path)?.get(compression);
    if (value) {
      const [size] = value;
      if (size !== null) {
        reportedValueStrings.push(prettyBytes(size).length);
      }
    }
  }

  return Math.max.apply(null, reportedValueStrings) + 2;
}

/**
 * Given a compression type, format it to a human readable file extension.
 * @param compression
 */
function compressedExtension(compression: string, padEnd: number): string {
  return compression.padEnd(padEnd);
}

/**
 * Display report to the console.
 * @param report
 */
export function LogReport({ silent }: Context, report: Map<ItemConfig['path'], CompressionMap>) {
  if (silent) {
    return;
  }

  const paths = Array.from(report.keys());
  const maxDisplayablePath = 30;
  const pathMaxLength = Math.max.apply(
    null,
    paths.map(path => Math.min(path.length, maxDisplayablePath) + 2),
  );
  const formatMaxLengths = OrderedCompressionValues.map(compression => maxLengthForCompression(report, paths, compression));
  const compressionHeaders = OrderedCompressionValues.map((compression, index) => compressedExtension(compression, formatMaxLengths[index]));
  let success: number = 0;
  let failure: number = 0;
  let warning: number = 0;

  console.log(bold('\n  Filesizes'));
  console.log(''.padEnd(pathMaxLength + 4) + ' ' + compressionHeaders.join(''));
  for (const path of paths) {
    const compressionMap = report.get(path);
    if (!compressionMap) {
      continue;
    }

    let includesFailure = false;
    let message = ' ' + path.substring(path.length - maxDisplayablePath).padEnd(pathMaxLength) + ' ';
    let compressionIndex = 0;
    for (const compression of OrderedCompressionValues) {
      const padding = compressionHeaders[compressionIndex].length;
      const [size, maxSize] = compressionMap.get(compression) as [number | null, number | null];

      const [status, compressionMessage] = displaySize(size, maxSize, padding);
      switch (status) {
        case 'success':
          success++;
          break;
        case 'failure':
          failure++;
          includesFailure = true;
          break;
        case 'warning':
          warning++;
          break;
      }
      message += compressionMessage;
      compressionIndex++;
    }
    if (includesFailure) {
      message = '  ' + red(getIcon('cross')) + message;
    } else {
      message = '  ' + dim().green(getIcon('tick')) + message;
    }
    console.log(message);
  }
  if (success > 0 || failure > 0) {
    console.log('\n  ' + green(success + ` ${success === 1 ? 'check' : 'checks'} passed`) + (failure === 0 ? ` ${getIcon('tada')}` : ''));
    if (warning > 0) {
      console.log('  ' + yellow(warning + ` ${warning === 1 ? 'check' : 'checks'} warned`) + grey(' (within 5% of allowed size)'));
    }
    if (failure > 0) {
      console.log('  ' + red(failure + ` ${failure === 1 ? 'check' : 'checks'} failed`));
    }
  }
  console.log();
}
