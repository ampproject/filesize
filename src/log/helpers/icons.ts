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

export const ICONS = {
  tick: isWin32 ? '√' : '✔',
  cross: isWin32 ? '×' : '✖',
  tada: '🎉',
};
