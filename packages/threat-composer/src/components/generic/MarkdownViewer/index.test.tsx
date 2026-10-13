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
import { render, cleanup } from '@testing-library/react';
import MarkdownViewer from '.';

const SVG_IMAGE = 'data:image/svg+xml;base64,PHN2Zy8+';
const PNG_IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const renderMarkdown = (markdown: string, allowHtml = false) =>
  render(<MarkdownViewer allowHtml={allowHtml}>{markdown}</MarkdownViewer>).container;

describe('MarkdownViewer', () => {
  afterEach(cleanup);

  // Covers the bug where react-markdown 10 blanked data-URL diagrams in the Report and Preview.
  it.each([
    ['SVG', SVG_IMAGE],
    ['PNG', PNG_IMAGE],
  ])('keeps the src of a base64 %s data-URL image', (_, image) => {
    const container = renderMarkdown(`![Diagram](${image})`, true);
    expect(container.querySelector('img')).toHaveAttribute('src', image);
  });

  it('keeps the src of an https image', () => {
    const container = renderMarkdown('![Diagram](https://example.com/diagram.png)');
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/diagram.png');
  });

  it('removes the src of a non-image data-URL image', () => {
    const container = renderMarkdown('![x](data:text/html;base64,PHNjcmlwdD4=)', true);
    expect(container.querySelector('img')).not.toHaveAttribute('src');
  });

  it.each([
    ['data-URL image', PNG_IMAGE],
    ['javascript', 'javascript:alert(1)'],
  ])('removes the href of a %s link', (_, href) => {
    const container = renderMarkdown(`[x](${href})`, true);
    expect(container.querySelector('a[href]')).toBeNull();
  });

  it.each([
    ['iframe', `<iframe src="${SVG_IMAGE}"></iframe>`],
    ['embed', `<embed src="${SVG_IMAGE}">`],
    ['input', `<input type="image" src="${SVG_IMAGE}">`],
  ])('removes a data-URL image src from a raw HTML %s', (tag, html) => {
    const container = renderMarkdown(html, true);
    expect(container.querySelector(tag)).not.toHaveAttribute('src');
  });
});
