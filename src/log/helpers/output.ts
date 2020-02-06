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

import { stdout } from 'process';

const ESC_SEQUENCE = '\u001B[';
const ERASE_LINE = ESC_SEQUENCE + '2K';
const CURSOR_LEFT = ESC_SEQUENCE + 'G';
const CURSOR_UP = ESC_SEQUENCE + '1A';

const outputQueue: Array<string> = [];

/**
 * Erase the number of lines from a TTY terminal
 * @param count
 */
export function erase(count: number): void {
  if (count <= 0) {
    return;
  }

  let sequence = '';
  for (let i = 0; i < count; i++) {
    sequence += ERASE_LINE + (i < count - 1 ? CURSOR_UP : '');
  }
  if (count) {
    sequence += CURSOR_LEFT;
  }

  write(sequence);
}

/**
 * Exhause the outputQueue and call the callback method when finished.
 * @param callback
 */
export function exhaust(callback: () => any = () => void 0) {
  const text: string | undefined = outputQueue.shift();

  if (text) {
    stdout.write(text, () => {
      if (outputQueue.length > 0) {
        exhaust(callback);
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

export function write(content: string): void {
  outputQueue.push(content);
  exhaust();
}
