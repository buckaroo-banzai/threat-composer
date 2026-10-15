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
import { readFileSync } from 'fs';
import { join } from 'path';
import { cleanup, render } from '@testing-library/react';
import type { MockInstance } from 'vitest';
import { importTmtModel } from '.';
import MarkdownViewer from '../../../components/generic/MarkdownViewer';
import convertToMarkdown from '../../convertToMarkdown';
import parseImportedData from '../../parseImportedData';

const fixture = (name: string) => readFileSync(join(__dirname, '../__fixtures__', name), 'utf-8');

// In the fixture, each marker is followed by <script>, onerror/onload, and javascript: link payloads.
const MARKERS = [
  'TCXSS-title',
  'TCXSS-description',
  'TCXSS-property',
  'TCXSS-mitigation',
  'TCXSS-note',
  'TCXSS-owner',
  'TCXSS-system',
  'TCXSS-modelname',
];
const APPLICATION_DESCRIPTION_MARKERS = ['TCXSS-note', 'TCXSS-owner', 'TCXSS-system'];

const importFixture = () =>
  parseImportedData(
    importTmtModel(
      fixture('Sample_Threat_Model_With_XSS.tm7'),
      fixture('Sample_Threat_Model_With_XSS.htm'),
      'Sample_Threat_Model_With_XSS.tm7',
    ).data,
  );

const expectNoActiveContent = (container: HTMLElement) => {
  expect(container.querySelectorAll('script, iframe, object, embed')).toHaveLength(0);

  const handlers = [...container.querySelectorAll('*')].flatMap((element) =>
    element.getAttributeNames().filter((name) => name.toLowerCase().startsWith('on')),
  );
  expect(handlers).toEqual([]);

  const unsafeHrefs = [...container.querySelectorAll('a[href]')]
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => !href.startsWith('#') && !['http:', 'https:'].includes(new URL(href, location.href).protocol));
  expect(unsafeHrefs).toEqual([]);
};

describe('TMT import - XSS acceptance (Sample_Threat_Model_With_XSS)', () => {
  // React drops string on* handlers from the DOM and only logs an error, so any console.error fails the test.
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error');
  });

  afterEach(() => {
    cleanup();
    const errors = [...consoleError.mock.calls];
    consoleError.mockRestore();
    expect(errors).toEqual([]);
  });

  test('the Markdown export keeps every marker but no raw HTML payload or javascript: link', async () => {
    const markdown = await convertToMarkdown(importFixture());

    for (const marker of MARKERS) {
      expect(markdown).toContain(marker);
    }
    expect(markdown).not.toMatch(/\]\(\s*<?\s*javascript:/i);
    expect(markdown).not.toMatch(/<\s*(script|img|svg|iframe)\b/i);
    expect(markdown).not.toMatch(/<a\s[^>]*href/i);
  });

  test('the report view shows every marker with no script, event handler, or unsafe link', async () => {
    const markdown = await convertToMarkdown(importFixture());

    const { container } = render(<MarkdownViewer allowHtml>{markdown}</MarkdownViewer>);

    for (const marker of MARKERS) {
      expect(container.textContent).toContain(marker);
    }
    expectNoActiveContent(container);
  });

  test('the Application description shows its markers with no script, event handler, or unsafe link', () => {
    const { container } = render(<MarkdownViewer>{importFixture().applicationInfo?.description ?? ''}</MarkdownViewer>);

    for (const marker of APPLICATION_DESCRIPTION_MARKERS) {
      expect(container.textContent).toContain(marker);
    }
    expectNoActiveContent(container);
  });
});
