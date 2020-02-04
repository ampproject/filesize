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
import Project from '../../src/validation/Project';
import { resolve } from 'path';
import { Context } from '../../src/validation/Condition';

test('valid directory should pass', async t => {
  const context: Context = {
    packagePath: '',
    projectPath: 'test/project-validation/fixtures/contains-package-json',
    packageContent: '',
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
  };
  const message = await Project(context)();

  t.is(message, null);
});

test('invalid directory should fail', async t => {
  const context = {
    packagePath: '',
    projectPath: 'test/project-validation/fixtures-invalid',
    packageContent: '',
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
  };
  const message = await Project(context)();

  t.is(message, `error project specified '${context.projectPath}' doesn't exist, is this a valid project?`);
});

test('directory missing package.json should fail', async t => {
  const context = {
    packagePath: '',
    projectPath: 'test/project-validation/fixtures/missing-package-json',
    packageContent: '',
    compressed: new Map(),
    comparison: new Map(),
    silent: false,
  };
  const message = await Project(context)();

  t.is(message, `error Missing '${resolve(context.projectPath, 'package.json')}', is this a valid project?`);
});
