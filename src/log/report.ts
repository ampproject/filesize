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

import { Context, SizeMap } from '../validation/Condition';

export class Report {
  protected silent: boolean = false;
  protected paths: Set<string>;
  protected warning: number = 0;
  protected success: number = 0;
  protected failure: number = 0;

  constructor(context: Context) {
    this.paths = new Set(context.compressed.keys());
  }

  public end(): void {}
  public update(context: Context): void {}

  public getUpdated(context: Context): SizeMap {
    const completed: SizeMap = new Map();

    iterate_paths: for (const path of this.paths) {
      const sizeMapValue = context.compressed.get(path);
      if (!sizeMapValue) {
        continue iterate_paths;
      }

      for (const value of sizeMapValue) {
        if (value[0] === null) {
          // A null value for the size indicates the resource is still processing.
          continue iterate_paths;
        }
      }

      completed.set(path, sizeMapValue);
      this.paths.delete(path);
    }

    return completed;
  }
}
