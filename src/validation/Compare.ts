/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
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

import { ConditionFunction, Context, SizeMap } from './Condition';
import { isDirectory, isFile, readFile } from '../helpers/fs';
import { resolve, dirname } from 'path';
import { MakeError } from '../log/helpers/error';

/**
 * Ensure context contains a valid project directory and `package.json` inside.
 * @param context
 */
const Compare: ConditionFunction = (context: Context) => {
  return async function () {
    if (context.comparisonPath !== '') {
      // The comparison path was specified up front
      if (!(await isFile(context.comparisonPath))) {
        return MakeError(`comparison path specified '${context.comparisonPath}' doesn't exist, is this a valid comparison?`);
      }

      const comparisonFileContent = await readFile(context.comparisonPath);
      if (comparisonFileContent === null) {
        return MakeError(`comparison path specified '${context.comparisonPath}' appears invalid, does it have contents?`);
      }

      context.comparison = new Map(JSON.parse(comparisonFileContent)) as SizeMap;
      // TODO: Likely need to do some validation on the contents to ensure its a SizeMap structure.
    }

    return null;
    // if (context.packagePath !== '') {
    //   // The package path was specified up front, its likely not a package.json
    //   if (!(await isFile(context.packagePath))) {
    //     return MakeError(`config specified '${context.packagePath}' doesn't exist, is this a valid project?`);
    //   }
    //   context.projectPath = dirname(context.packagePath);
    //   return null;
    // }

    // const projectPath: string = resolve(context.projectPath);
    // if (!(await isDirectory(projectPath))) {
    //   return MakeError(`project specified '${context.projectPath}' doesn't exist, is this a valid project?`);
    // }

    // const packagePath = resolve(context.projectPath, 'package.json');
    // if (!(await isFile(packagePath))) {
    //   return MakeError(`Missing '${packagePath}', is this a valid project?`);
    // }

    // context.projectPath = projectPath;
    // context.packagePath = packagePath;
    // return null;
  };
};

export default Compare;
