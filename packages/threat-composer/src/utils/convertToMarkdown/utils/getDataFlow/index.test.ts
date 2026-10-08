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
import { getDataflowContent } from '.';
import { DataExchangeFormat } from '../../../../customTypes';

const render = (dataflow: DataExchangeFormat['dataflow']) =>
  getDataflowContent({ schema: 1.1, dataflow } as DataExchangeFormat);

describe('getDataflowContent', () => {
  test('renders every diagram in order, each under its name with its introduction and image', async () => {
    const markdown = await render({
      diagrams: [
        { id: '1', name: 'Login flow', description: 'How users sign in.', image: 'data:image/png;base64,AAAA' },
        { id: '2', name: 'Payment flow', description: 'How payments are processed.', image: 'data:image/jpeg;base64,CCCC' },
        { id: '3', name: 'Admin flow', description: 'How admins manage users.', image: 'data:image/svg+xml;base64,BBBB' },
      ],
    });

    expect(markdown).toBe([
      '## Dataflow',
      '### Login flow',
      'How users sign in.',
      '![Login flow](data:image/png;base64,AAAA)',
      '### Payment flow',
      'How payments are processed.',
      '![Payment flow](data:image/jpeg;base64,CCCC)',
      '### Admin flow',
      'How admins manage users.',
      '![Admin flow](data:image/svg+xml;base64,BBBB)',
      '\n',
    ].join('\n'));
  });

  test('omits the introduction or image line when a diagram has none', async () => {
    const markdown = await render({
      diagrams: [
        { id: '1', name: 'Image only', image: 'data:image/png;base64,AAAA' },
        { id: '2', name: 'Introduction only', description: 'No image yet.' },
        { id: '3', name: 'Name only' },
      ],
    });

    expect(markdown).toBe([
      '## Dataflow',
      '### Image only',
      '![Image only](data:image/png;base64,AAAA)',
      '### Introduction only',
      'No image yet.',
      '### Name only',
      '\n',
    ].join('\n'));
  });

  test('renders only the section heading when there are no diagrams', async () => {
    expect(await render({ diagrams: [] })).toBe('## Dataflow\n\n');
  });

  test('renders only the section heading when the model has no Data Flow section', async () => {
    expect(await render(undefined)).toBe('## Dataflow\n\n');
  });
});
