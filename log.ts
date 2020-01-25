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

// Disable output colors for test runs.
kleur.enabled = !('AVA_PATH' in process.env);

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
 * Display output as a success message on the console.
 * @param output
 */
export function LogPassingOutput(output: string): void {
  console.log(`${kleur.green('success')} ${kleur.white(output)}`);
}

/**
 * Display output as a failure message on the console.
 * @param output
 */
export function LogFailingOutput(output: string): void {
  console.log(`${kleur.red('failure')} ${kleur.white(output)}`);
}
