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
import renderThreatStatement from '.';
import { TemplateThreatStatement } from '../../customTypes';

const threat = (fields: Partial<TemplateThreatStatement>): TemplateThreatStatement => ({
  id: 'id',
  numericId: 1,
  ...fields,
});

const formattedTokens = (displayed?: ReturnType<typeof renderThreatStatement>['displayedStatement']) =>
  displayed?.filter((token) => typeof token !== 'string');

describe('renderThreatStatement - one filled field without a custom template (unchanged)', () => {
  test('renders the first field with a trailing ellipsis and no displayed statement', () => {
    const result = renderThreatStatement(threat({ threatSource: 'external actor' }));
    expect(result.statement).toBe('external actor...');
    expect(result.displayedStatement).toBeUndefined();
  });

  test('renders a middle field with ellipses on both sides', () => {
    expect(renderThreatStatement(threat({ threatAction: 'steal credentials' })).statement).toBe('...steal credentials...');
  });

  test('renders the last field with a leading ellipsis', () => {
    expect(renderThreatStatement(threat({ impactedAssets: ['user data'] })).statement).toBe('...user data');
  });
});

describe('renderThreatStatement - multiple filled fields (unchanged)', () => {
  test('renders the default template with the threat action in bold', () => {
    const result = renderThreatStatement(threat({ threatSource: 'external actor', threatAction: 'steal credentials' }));
    expect(result.statement).toBe('An external actor can steal credentials');
    expect(formattedTokens(result.displayedStatement)).toContainEqual({ type: 'b', content: 'steal credentials', tooltip: 'threat action' });
  });

  test('renders a custom template with the threat action in bold', () => {
    const result = renderThreatStatement(threat({
      threatSource: 'external actor',
      threatAction: 'steal credentials',
      customTemplate: 'A [threat_source] may [threat_action]',
    }));
    expect(result.statement).toBe('An external actor may steal credentials');
    expect(formattedTokens(result.displayedStatement)).toContainEqual({ type: 'b', content: 'steal credentials', tooltip: 'threat action' });
  });
});

describe('renderThreatStatement - one filled field with a custom template', () => {
  const description = 'An attacker could replay tokens to impersonate the user';
  const result = renderThreatStatement(threat({ threatAction: description, customTemplate: '[threat_action]' }));

  test('renders the field through the template without ellipses or surrounding whitespace', () => {
    expect(result.statement).toBe(description);
  });

  test('displays the field as a single normal-weight token', () => {
    expect(formattedTokens(result.displayedStatement)).toEqual([{ type: 'span', content: description, tooltip: 'threat action' }]);
  });

  test('applies the standard a/an correction', () => {
    const corrected = renderThreatStatement(threat({ threatAction: 'a attacker could replay tokens', customTemplate: '[threat_action]' }));
    expect(corrected.statement).toBe('an attacker could replay tokens');
  });

  test('provides the full set of editor suggestions', () => {
    expect(result.suggestions).toContain('[threat_source] Consider specifying who or what is the source of the threat');
  });
});

describe('renderThreatStatement - invalid input with a custom template', () => {
  test('passes HTML-looking text through as literal text', () => {
    const markup = '<img src=x onerror=alert(1)>';
    const rendered = renderThreatStatement(threat({ threatAction: markup, customTemplate: '[threat_action]' }));
    expect(rendered.statement).toBe(markup);
    expect(formattedTokens(rendered.displayedStatement)).toEqual([{ type: 'span', content: markup, tooltip: 'threat action' }]);
  });

  test.each([
    ['unbalanced brackets', ']][['],
    ['an unclosed bracket', '['],
    ['a prototype key', '[__proto__]'],
    ['a constructor key', '[constructor]'],
    ['an unknown token', '[not_a_field]'],
    ['a maximum-length run of empty tokens', '[]'.repeat(100)],
  ])('terminates without leaking field content for %s', (_name, customTemplate) => {
    const rendered = renderThreatStatement(threat({ threatAction: 'steal credentials', customTemplate }));
    expect(rendered.statement).not.toContain('steal credentials');
    expect(formattedTokens(rendered.displayedStatement)?.every((token) => (token as { content: string }).content === '')).toBe(true);
  });

  test('renders a whitespace-only field as an empty statement', () => {
    expect(renderThreatStatement(threat({ threatAction: '   ', customTemplate: '[threat_action]' })).statement).toBe('');
  });
});
