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
import Config from '../../src/validation/Config';

test('missing package.json should fail', async t => {
  const context = {
    package: 'test/config-validation/fixtures/compression-array/package.json',
    config: [],
    project: 'test/config-validation/fixtures/compression-array',
    silent: false,
    track: [],
  };
  const message = await Config(context)();

  t.is(message, null);
});
