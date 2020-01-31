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
import { ItemConfig, CompressionMap, Context } from './validation/Condition';

// Disable output colors for test runs.
kleur.enabled = !('AVA_PATH' in process.env);

// Aliases to colors used.
const { red, grey, green, bold } = kleur;

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
 * Given a compression type, format it to a human readable file extension.
 * @param compression
 */
function compressedExtension(compression: string): string {
  if (compression === 'none') {
    return ''.padEnd(3);
  }
  return '.' + compression.substring(0, 2);
}

/**
 * Display report to the console.
 * @param report
 */
export function LogReport({ silent }: Context, report: Map<ItemConfig['path'], CompressionMap>) {
  let success: number = 0;
  let failure: number = 0;

  if (!silent && [...report.keys()].length > 0) {
    console.log(bold('\nFilesize Report'));
    for (const [originalPath, values] of report) {
      const multipleOutputs = Array.from(values.values()).filter(([before]) => before !== null).length > 1;
      if (multipleOutputs) {
        console.log(grey(`\npath: ${originalPath}`));
        for (const [compression, compressionResults] of values) {
          const [size, maxSize] = compressionResults;
          const compressedPath = originalPath + grey(compressedExtension(compression));
          if (size === null || maxSize === null) {
            continue;
          } else if (size < maxSize) {
            success++;
            console.log(`  ✔️  ${compressedPath} ${prettyBytes(size)} ${green('<')} ${prettyBytes(maxSize)}`);
          } else {
            failure++;
            console.log(`  ❌ ${compressedPath} ${prettyBytes(size)} ${red('>')} ${prettyBytes(maxSize)}`);
          }
        }
      } else {
        const maximumPath =
          Math.max.apply(
            null,
            Array.from(report.keys()).map(item => item.length),
          ) + 1;
        for (const [compression, compressionResults] of values) {
          const [size, maxSize] = compressionResults;
          const compressedPath = originalPath + grey(compressedExtension(compression)) + new Array(maximumPath - originalPath.length).join(' ');
          if (size === null || maxSize === null) {
            continue;
          } else if (size < maxSize) {
            success++;
            console.log(`  ✔️  ${compressedPath} ${prettyBytes(size)} ${green('<')} ${prettyBytes(maxSize)}`);
          } else {
            failure++;
            console.log(`  ❌ ${compressedPath} ${prettyBytes(size)} ${red('>')} ${prettyBytes(maxSize)}`);
          }
        }
      }
    }
    if (success > 0 || failure > 0) {
      console.log('\n  ' + green(success + ` ${success === 1 ? 'check' : 'checks'} passed`) + (failure === 0 ? ' 🎉' : ''));
      const failureColor = failure < 1 ? grey : red;
      console.log('  ' + failureColor(failure + ` ${failure === 1 ? 'check' : 'checks'} failed`));
    }
    console.log();
  } else if (!silent) {
    MakeError('No report available.');
  }
}
