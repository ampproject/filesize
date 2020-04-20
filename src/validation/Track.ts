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

import { resolve } from 'path';
import glob from 'fast-glob';
import { Context, ValidationResponse, SizeMapValue } from './Condition';
import { validateCompressionName } from './File';

/**
 * Given formats, format a SizeMapValue.
 * @param {Array<string>} formats
 * @return {SizeMapValue}
 */
function getTrackedFormats(formats: Array<string>): SizeMapValue {
  return [
    [formats.includes('brotli') ? null : undefined, undefined],
    [formats.includes('gzip') ? null : undefined, undefined],
    [formats.includes('none') ? null : undefined, undefined],
  ];
}

/**
 * Use 'fast-glob' to find files requested to track from configuration.
 * @param {Context} context
 */
export async function Track(context: Context, json: any): Promise<ValidationResponse> {
  if ('track' in json && Array.isArray(json.track)) {
    const entries: Array<string> = await glob(json.track);
    let formats = ['brotli', 'gzip', 'none'];

    if ('trackFormat' in json && Array.isArray(json.trackFormat)) {
      // `trackFormats` allows you to limit the compression types for tracking
      formats = json.trackFormat.map((format: any) => validateCompressionName(String(format))).filter(Boolean);
    }

    // glob ensures the results are valid files.
    for (const entry of entries) {
      const path = resolve(entry);

      context.compressed.set(path, getTrackedFormats(formats));
      context.originalPaths.set(path, entry);
    }
  }

  return null;
}
