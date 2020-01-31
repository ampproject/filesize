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

import test from 'ava';
import { report } from '../../api';
import { exec } from 'child_process';

test.cb('item with missing file fails with exit code 5', t => {
  const executeFailure = exec('./dist/filesize -p=test/end-to-end/fixtures/missing-item');

  executeFailure.on('exit', code => {
    t.is(code, 5);
    t.end();
  });
});

test.cb('too large valid item fails with exit code 6', t => {
  const executeFailure = exec('./dist/filesize -p=test/end-to-end/fixtures/item-too-large');

  executeFailure.on('exit', code => {
    t.is(code, 6);
    t.end();
  });
});

test('item with missing file throws exception from API', async t => {
  const toReport = 'test/end-to-end/fixtures/missing-item';
  const missingFile = toReport + '/index.js';

  try {
    await report(toReport);
  } catch (e) {
    t.is(e, `error '${missingFile}' configuration is invalid. (path is not a valid file)`);
  }
});
