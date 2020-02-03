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

import { Context, ValidationResponse } from './Condition';
import glob from 'fast-glob';

/**
 * Use 'fast-glob' to find files requested to track from configuration.
 * @param context
 * @param trackGlobs pre-parsed array of globs to use.
 */
export async function Track(context: Context, json: any): Promise<ValidationResponse> {
  if ('track' in json && Array.isArray(json.track)) {
    const entries: Array<string> = await glob(json.track);
    context.track.push(...entries);
  }

  return null;
}
