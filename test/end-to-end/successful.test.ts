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
import { report } from '../../src/api';
import { SizeMapValue, SizeMap } from '../../src/validation/Condition';
import { resolve } from 'path';

test.cb('item under requested filesize limit passes', t => {
  const executeFailure = exec('./dist/filesize -p=test/end-to-end/fixtures/successful');

  executeFailure.on('exit', code => {
    t.is(code, 0);
    t.end();
  });
});

test('item under requested filesize limit passes from API', async t => {
  const toReport = 'test/end-to-end/fixtures/successful';

  const sizes: SizeMapValue = [
    [3410, 3584], // brotli
    [3737, 4096], // gzip
    [9327, 10240], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/end-to-end/fixtures/successful/index.js'), sizes);

  const values = report(toReport, null);
  let next = await values.next();
  let results: SizeMap | undefined = undefined;
  while (!next.done) {
    results = next.value[0];
    next = await values.next();
  }
  t.deepEqual(results, expected);
});

test('item under requested filesize limit passes from API, with replacement', async t => {
  const toReport = 'test/end-to-end/fixtures/successful';

  const sizes: SizeMapValue = [
    [3401, 3584], // brotli
    [3731, 4096], // gzip
    [9317, 10240], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/end-to-end/fixtures/successful/index.js'), sizes);

  const values = report(toReport, content => content.replace(new RegExp('preact.umd.js.map', 'g'), 'FOO.map'));
  let next = await values.next();
  let results: SizeMap | undefined = undefined;
  while (!next.done) {
    results = next.value[0];
    next = await values.next();
  }
  t.deepEqual(results, expected);
});
