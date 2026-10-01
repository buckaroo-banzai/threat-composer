/** *******************************************************************************************************************
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ******************************************************************************************************************** */
import {
  convertInchesToTwip,
  ILevelsOptions,
  LevelFormat,
  AlignmentType,
} from 'docx';

export const ORDERED_LIST_REF = 'ordered';
export const BULLET_LIST_REF = 'bullet';
export const INDENT = 0.5;

// Word's default bullet: a Symbol-font round bullet at the standard indent (the 'bullet' shorthand renders oversized).
export const BULLET_NUMBERINGS: ILevelsOptions[] = [
  {
    level: 0,
    format: LevelFormat.BULLET,
    text: '\uF0B7',
    alignment: AlignmentType.LEFT,
    style: {
      run: { font: 'Symbol' },
      paragraph: {
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
      },
    },
  },
];

export const DEFAULT_NUMBERINGS: ILevelsOptions[] = [
  {
    level: 0,
    format: LevelFormat.DECIMAL,
    text: '%1.',
    alignment: AlignmentType.START,
  },
  {
    level: 1,
    format: LevelFormat.DECIMAL,
    text: '%2.',
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT * 1) },
      },
    },
  },
  {
    level: 2,
    format: LevelFormat.DECIMAL,
    text: '%3.',
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT * 2) },
      },
    },
  },
  {
    level: 3,
    format: LevelFormat.DECIMAL,
    text: '%4.',
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT * 3) },
      },
    },
  },
  {
    level: 4,
    format: LevelFormat.DECIMAL,
    text: '%5.',
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT * 4) },
      },
    },
  },
  {
    level: 5,
    format: LevelFormat.DECIMAL,
    text: '%6.',
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT * 5) },
      },
    },
  },
];

export const PT_BASE = 20;
export const LINE_BASE = 276;
export const SPACING = {
  line: LINE_BASE,
  after: PT_BASE * 6,
};
export const LIST_PARA_SPACING = {
  line: Math.floor(LINE_BASE * 0.9),
  after: PT_BASE * 3,
};
