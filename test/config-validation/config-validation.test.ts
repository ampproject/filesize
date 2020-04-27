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
import { exec } from 'child_process';
import Config from '../../src/validation/Config';
import { Context } from '../../src/validation/Condition';

test('missing package.json should fail', async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/missing-package-json/package.json',
    projectPath: 'test/config-validation/fixtures/missing-package-json',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, `Could not read the configuration in '${context.packagePath}'`);
});

test('unparseable package.json should fail', async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/unparseable-package-json/package.json',
    projectPath: 'test/config-validation/fixtures/unparseable-package-json',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, `Could not parse '${context.packagePath}'`);
});

test("missing 'filesize' key from package.json should fail", async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/missing-configuration/package.json',
    projectPath: 'test/config-validation/fixtures/missing-configuration',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, `There is no 'filesize' configuration in '${context.packagePath}'`);
});

test("missing path from item in 'filesize' should fail", async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/item-path-missing/package.json',
    projectPath: 'test/config-validation/fixtures/item-path-missing',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, `There is no data inside the 'filesize' configuration in '${context.packagePath}'`);
});

test("missing maxSize from item in 'filesize' should fail", async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/max-size-missing/package.json',
    projectPath: 'test/config-validation/fixtures/max-size-missing',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, `Configuration for 'index.js' is invalid. (size unspecified)`);
});

test("missing compression from item in 'filesize' should fail", async (t) => {
  const context: Context = {
    packagePath: 'test/config-validation/fixtures/compression-missing/package.json',
    projectPath: 'test/config-validation/fixtures/compression-missing',
    packageContent: '',
    originalPaths: new Map(),
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
    fileModifier: null,
    fileContents: new Map(),
  };
  const message = await Config(context)();

  t.is(message, `Configuration for 'index.js' is invalid. (compression values unspecified)`);
});

test.cb('standalone configuration file when valid should pass', (t) => {
  const executeSuccess = exec('./dist/filesize -c=test/config-validation/fixtures/standalone-config/filesize.json');

  executeSuccess.on('exit', (code) => {
    t.is(code, 0);
    t.end();
  });
});
