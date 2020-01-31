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
import { report } from '../../api';
import { CompressionMap } from '../../validation/Condition';

test.cb('item under requested filesize limit passes', t => {
  const executeFailure = exec('./dist/filesize -p=test/end-to-end/fixtures/successful');

  executeFailure.on('exit', code => {
    t.is(code, 0);
    t.end();
  });
});

test('item under requested filesize limit passes from API', async t => {
  const toReport = 'test/end-to-end/fixtures/successful';

  const sizes: CompressionMap = new Map([
    ['brotli', [3410, 3584]],
    ['gzip', [3737, 4096]],
    ['none', [9327, 10240]],
  ]);
  const expected: Map<string, CompressionMap> = new Map([['test/end-to-end/fixtures/successful/index.js', sizes]]);
  const results = await report(toReport);
  t.deepEqual(results, expected);
});
