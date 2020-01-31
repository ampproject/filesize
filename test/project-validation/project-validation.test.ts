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
import Project from '../../validation/Project';
import { resolve } from 'path';

test('valid directory should pass', async t => {
  const context = {
    project: 'test/project-validation/fixtures/contains-package-json',
    package: '',
    config: [],
    silent: false,
    track: [],
  };
  const message = await Project(context)();

  t.is(message, null);
});

test('invalid directory should fail', async t => {
  const context = {
    project: 'test/project-validation/fixtures-invalid',
    package: '',
    config: [],
    silent: false,
    track: [],
  };
  const message = await Project(context)();

  t.is(message, `error project specified '${context.project}' doesn't exist, is this a valid project?`);
});

test('directory missing package.json should fail', async t => {
  const context = {
    project: 'test/project-validation/fixtures/missing-package-json',
    package: '',
    config: [],
    silent: false,
    track: [],
  };
  const message = await Project(context)();

  t.is(message, `error Missing '${resolve(context.project, 'package.json')}', is this a valid project?`);
});
