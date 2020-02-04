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

import { stdout, exit } from 'process';

let locked: boolean = false;
const outputQueue: Array<string> = [];

// Plan to use this spinner while a file is being processed.
const isWin32 = process.platform === 'win32';
export const SPINNER = isWin32
  ? {
      interval: 130,
      frames: ['-', '\\', '|', '/'],
    }
  : {
      interval: 80,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    };

const ESC_SEQUENCE = '\u001B[';
const ERASE_LINE = ESC_SEQUENCE + '2K';
const CURSOR_LEFT = ESC_SEQUENCE + 'G';
const CURSOR_UP = ESC_SEQUENCE + '1A';
export function eraseLines(count: number): void {
  let sequence = '';
  for (let i = 0; i < count; i++) {
    sequence += ERASE_LINE + (i < count - 1 ? CURSOR_UP : '');
  }
  if (count) {
    sequence += CURSOR_LEFT;
  }

  write(sequence, true);
}

function exhaustQueue() {
  if (!locked) {
    locked = true;
    const text: string | undefined = outputQueue.shift();

    if (text) {
      // console.log('write', text);
      stdout.write(text, () => {
        locked = false;
        if (outputQueue.length > 0) {
          exhaustQueue();
        }
      });
      return;
    }
    locked = false;
  }
}

export function write(content: string, del: boolean = false): void {
  outputQueue.push(content);
  exhaustQueue();
}

export function shutdown(code: number) {
  if (outputQueue.length > 0) {
    setTimeout(() => shutdown(code), 10);
  } else {
    exit(code);
  }
}
