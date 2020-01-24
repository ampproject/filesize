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
import Config from '../../validation/Config';

test('missing package.json should fail', async t => {
  const context = {
    package: 'test/config-validation/fixtures/missing-package-json/package.json',
    config: [],
    project: 'test/config-validation/fixtures/missing-package-json',
  };
  const [success, message] = await Config(context)();

  t.false(success);
  t.is(message, `error Could not read the configuration in '${context.package}'`);
});

test('unparseable package.json should fail', async t => {
  const context = {
    package: 'test/config-validation/fixtures/unparseable-package-json/package.json',
    config: [],
    project: 'test/config-validation/fixtures/unparseable-package-json',
  };
  const [success, message] = await Config(context)();

  t.false(success);
  t.is(message, `error Could not parse '${context.package}'`);
});

test("missing 'filesize' key from package.json should fail", async t => {
  const context = {
    package: 'test/config-validation/fixtures/missing-configuration/package.json',
    config: [],
    project: 'test/config-validation/fixtures/missing-configuration',
  };
  const [success, message] = await Config(context)();

  t.false(success);
  t.is(message, `error There is no 'filesize' configuration in '${context.package}'`);
});

test("missing path from item in 'filesize' should fail", async t => {
  const context = {
    package: 'test/config-validation/fixtures/item-path-missing/package.json',
    config: [],
    project: 'test/config-validation/fixtures/item-path-missing',
  };
  const [success, message] = await Config(context)();

  t.false(success);
  t.is(message, 'error Configuration for #1 is invalid. (key: path)');
});

test("missing maxSize from item in 'filesize' should fail", async t => {
  const context = {
    package: 'test/config-validation/fixtures/max-size-missing/package.json',
    config: [],
    project: 'test/config-validation/fixtures/max-size-missing',
  };
  const [success, message] = await Config(context)();

  t.false(success);
  t.is(message, `error Configuration for '${context.project}/index.js' is invalid. (key: maxSize)`);
});

test("missing compression from item in 'filesize' should fail", async t => {
  const context = {
    package: 'test/config-validation/fixtures/compression-missing/package.json',
    config: [],
    project: 'test/config-validation/fixtures/compression-missing',
  };
  const [success, message] = await Config(context)();

  t.false(success);
  t.is(message, `error Configuration for '${context.project}/index.js' is invalid. (key: compression)`);
});
