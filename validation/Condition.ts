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

export type ValidationResponse = [boolean, string | null];

export enum Compression {
  NONE = 'none',
  GZIP = 'gzip',
  BROTLI = 'brotli',
}
const OrderedCompressionValues = [Compression.BROTLI, Compression.GZIP, Compression.NONE];

export type CompressionMapValue = [number | null, number | null];
export type CompressionMap = Map<string, CompressionMapValue>;
export const OrderedCompressionMap: CompressionMap = new Map(OrderedCompressionValues.map(value => [value, [null, null]]));
export const CompressionDisplayLength = OrderedCompressionValues.sort((a, b) => b.length - a.length)[0].length;

export interface ItemConfig {
  originalPath: string;
  path: string;
  compression: string;
  maxSize: number;
}
export interface Context {
  project: string;
  package: string;
  config: Array<ItemConfig>;
}

export type ConditionFunction = (context: Context) => () => Promise<ValidationResponse>;
