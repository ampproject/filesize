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

import test from 'ava';
import { exec } from 'child_process';
import { report, Report } from '../../src/api';
import { SizeMapValue, SizeMap } from '../../src/validation/Condition';
import { resolve, relative } from 'path';

test.cb('item under requested filesize limit passes', (t) => {
  const executeSuccess = exec('./dist/filesize -p=test/end-to-end/fixtures/successful');

  executeSuccess.on('exit', (code) => {
    t.is(code, 0);
    t.end();
  });
});

test.cb('standalone configuration file when valid should pass', (t) => {
  const executeSuccess = exec('./dist/filesize -c=test/end-to-end/fixtures/successful/filesize.json');

  executeSuccess.on('exit', (code) => {
    t.is(code, 0);
    t.end();
  });
});

test('item under requested filesize limit passes from API', async (t) => {
  const sizes: SizeMapValue = [
    [3410, 3584], // brotli
    [3737, 4096], // gzip
    [9327, 10240], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/end-to-end/fixtures/successful/index.js'), sizes);

  const results = await report('test/end-to-end/fixtures/successful', null);
  t.deepEqual(results, expected);
});

test('item under requested filesize limit passes from API, using configuration file', async (t) => {
  const sizes: SizeMapValue = [
    [3410, 3584], // brotli
    [3737, 4096], // gzip
    [9327, 10240], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/end-to-end/fixtures/successful/index.js'), sizes);

  const results = await report('test/end-to-end/fixtures/successful/filesize.json', null);
  t.deepEqual(results, expected);
});

test('item under requested filesize limit passes from API, with replacement', async (t) => {
  const sizes: SizeMapValue = [
    [3401, 3584], // brotli
    [3731, 4096], // gzip
    [9317, 10240], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/end-to-end/fixtures/successful/index.js'), sizes);

  const results = await report('test/end-to-end/fixtures/successful', (content) =>
    content.replace(new RegExp('preact.umd.js.map', 'g'), 'FOO.map'),
  );
  t.deepEqual(results, expected);
});

test('item under requested filesize limit passes from API, using configuration file, with replacement', async (t) => {
  const sizes: SizeMapValue = [
    [3401, 3584], // brotli
    [3731, 4096], // gzip
    [9317, 10240], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/end-to-end/fixtures/successful/index.js'), sizes);

  const results = await report('test/end-to-end/fixtures/successful/filesize.json', (content) =>
    content.replace(new RegExp('preact.umd.js.map', 'g'), 'FOO.map'),
  );
  t.deepEqual(results, expected);
});

test('api is interactive with custom reporter', async (t) => {
  const mapping = new Map([
    ['preact.js', 3477],
    ['inferno.js', 7297],
    ['react-dom.js', 28721],
  ]);

  await report(
    'test/end-to-end/fixtures/api-report',
    (content) => content,
    class extends Report {
      update(context: any) {
        const completed = super.getUpdated(context);
        for (const complete of completed) {
          const [filePath, sizeMap] = complete;
          const relativePath = relative('test/end-to-end/fixtures/api-report', filePath);
          t.is(mapping.has(relativePath), true);
          t.is(mapping.get(relativePath), sizeMap[0][0]);
        }
      }
    },
  );
});

test('api is interactive with custom reporter, using configuration file', async (t) => {
  const mapping = new Map([
    ['preact.js', 3477],
    ['inferno.js', 7297],
    ['react-dom.js', 28721],
  ]);

  await report(
    'test/end-to-end/fixtures/api-report/filesize.json',
    (content) => content,
    class extends Report {
      update(context: any) {
        const completed = super.getUpdated(context);
        for (const complete of completed) {
          const [filePath, sizeMap] = complete;
          const relativePath = relative('test/end-to-end/fixtures/api-report', filePath);
          t.is(mapping.has(relativePath), true);
          t.is(mapping.get(relativePath), sizeMap[0][0]);
        }
      }
    },
  );
});
