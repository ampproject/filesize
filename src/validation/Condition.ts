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

// string indicates an error of the formatted return type.
// null indicates success.
export type ValidationResponse = string | null;
export type ConditionFunction = (context: Context) => () => Promise<ValidationResponse>;

export type Compression = 'brotli' | 'gzip' | 'none';
export const OrderedCompressionValues = ['brotli', 'gzip', 'none'];

type path = string;
export type OriginalPath = Map<path, path>;

/*
- number    = calculated
- null      = awaiting calculation
- undefined = ignored
*/
type size = number | null | undefined;
/*
- number    = max allowed size
- undefined = unrestricted size
*/
export type maxSize = number | undefined;
type brotli = [size, maxSize];
type gzip = [size, maxSize];
type none = [size, maxSize];
export type SizeMapValue = [brotli, gzip, none];
export const SizeMapValueIndex = {
  brotli: 0,
  gzip: 1,
  none: 2,
};
export type SizeMap = Map<path, SizeMapValue>;

export interface Context {
  projectPath: string;
  packagePath: string;
  packageContent: string | null;
  silent: boolean;
  // Stores the result of compression <path, [...results]>
  compressed: SizeMap;
  // Stores the basis of comparison.
  comparison: SizeMap;
}
