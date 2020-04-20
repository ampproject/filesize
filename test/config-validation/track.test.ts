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
import { resolve } from 'path';
import { report } from '../../src/api';
import Config from '../../src/validation/Config';
import { Context, SizeMapValue, SizeMap } from '../../src/validation/Condition';

test('including trackable items should succeed', async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/track/package.json',
    projectPath: 'test/config-validation/fixtures/track',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, null);
});

test('trackable items uses glob to find files', async (t) => {
  const sizes: SizeMapValue = [
    [null, undefined], // brotli
    [null, undefined], // gzip
    [null, undefined], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/config-validation/fixtures/track-standalone/index.js'), sizes);

  const values = report('test/config-validation/fixtures/track-standalone', null);
  let next = await values.next();
  let results: SizeMap | undefined = undefined;
  while (!next.done) {
    results = next.value[0];
    next = await values.next();
  }
  t.deepEqual(results, expected);
});

test('trackable items uses trackFormats to restrict compression types', async (t) => {
  const sizes: SizeMapValue = [
    [null, undefined], // brotli
    [undefined, undefined], // gzip
    [undefined, undefined], // none
  ];
  const expected: SizeMap = new Map();
  expected.set(resolve('test/config-validation/fixtures/track-standalone-format/index.js'), sizes);

  const values = report('test/config-validation/fixtures/track-standalone-format', null);
  let next = await values.next();
  let results: SizeMap | undefined = undefined;
  while (!next.done) {
    results = next.value[0];
    next = await values.next();
  }
  t.deepEqual(results, expected);
});
