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

import kleur from '@kristoferbaxter/kleur';
import { Context, OrderedCompressionValues, SizeMap } from '../validation/Condition';
import { write } from './helpers/output';
import { ICONS } from './helpers/icons';
import { CLIReport } from './cli-report';

export class NoTTYReport extends CLIReport {
  protected maxPathDisplay: number;
  protected maxFormatDisplay: number;
  protected currentLine: string;

  public update(context: Context): void {
    const completed: SizeMap = super.getUpdated(context);
    if (this.silent) {
      return;
    }

    for (const complete of completed) {
      const [path, sizeMapValue] = complete;
      const displayPath = context.originalPaths.get(path) || path;
      let failure = 0;

      this.currentLine = ` ${displayPath
        .substring(displayPath.length - this.maxPathDisplay)
        .padEnd(this.maxPathDisplay)}  `;
      for (let i = 0; i < OrderedCompressionValues.length; i++) {
        failure += this.displaySize(sizeMapValue[i]).failure;
      }

      if (failure > 0) {
        this.currentLine = `  ${kleur.red(ICONS['cross'])}${this.currentLine}`;
      } else {
        this.currentLine = `  ${kleur.dim().green(ICONS['tick'])}${this.currentLine}`;
      }

      write(this.currentLine + '\n');
    }
  }
}
