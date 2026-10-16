/** *******************************************************************************************************************
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
 ******************************************************************************************************************** */
import { fileURLToPath } from 'node:url';
import { test, expect } from '../fixtures/console-guard';
import { expectOnDashboard, navigateVia, waitForAppShell } from '../fixtures/app';
import { byTooltip, entityCard } from '../fixtures/selectors';
import type { Locator, Page } from '@playwright/test';

/**
 * TMT import XSS acceptance, in a real browser (US-4-T4).
 *
 * The fixture pair is shared with the unit test
 * packages/threat-composer/src/utils/tmt/importTmtModel/xss.test.tsx rather than
 * copied, so the two cannot drift apart. In the fixture, every TCXSS-* marker is
 * followed by <script>, onerror/onload, and javascript: link payloads that set
 * `top.__xss`.
 *
 * On each page the test checks that the markers are present (the positive
 * control), that no active content or unsafe link reached the DOM, that no
 * payload ran, and that the app's Content-Security-Policy reported no
 * violation. The console guard also fails the test on any console.error, which
 * is how React reports an on* handler it dropped.
 */

const fixture = (name: string) =>
  fileURLToPath(new URL(`../../packages/threat-composer/src/utils/tmt/__fixtures__/${name}`, import.meta.url));

const TM7 = fixture('Sample_Threat_Model_With_XSS.tm7');
const REPORT = fixture('Sample_Threat_Model_With_XSS.htm');

/** Where each threat-level marker lands after import. */
const THREAT_MARKERS: { numericId: number; marker: string; in: 'statement' | 'metadata' }[] = [
  { numericId: 7, marker: 'TCXSS-title', in: 'metadata' },
  { numericId: 8, marker: 'TCXSS-description', in: 'statement' },
  { numericId: 9, marker: 'TCXSS-property', in: 'metadata' },
  { numericId: 10, marker: 'TCXSS-mitigation', in: 'metadata' },
];

const REPORT_MARKERS = [
  'TCXSS-title',
  'TCXSS-description',
  'TCXSS-property',
  'TCXSS-mitigation',
  'TCXSS-note',
  'TCXSS-owner',
  'TCXSS-system',
  'TCXSS-modelname',
];

/** The model name becomes the application name; the rest land in the Application description. */
const APPLICATION_MARKERS = ['TCXSS-modelname', 'TCXSS-note', 'TCXSS-owner', 'TCXSS-system'];

/**
 * PRE-EXISTING, on every page load and unrelated to the import: zod's `allowsEval`
 * feature probe runs `new Function("")` in a try/catch, which the app's
 * `script-src 'self'` policy blocks and reports. zod then uses its non-eval
 * parser, which it must do anyway under this policy. Harmless, so not reported.
 * The report names zod.js on the dev server and the bundle file in a production
 * build, so any same-origin script is matched; the fixture's payloads are inline
 * scripts and handlers, which report as 'inline', not 'eval'.
 */
const KNOWN_CSP_VIOLATIONS = [/^script-src eval http:\/\/localhost:\d+\/\S+\.js:\d+$/];

declare global {
  interface Window {
    __cspViolations: string[];
    __xss?: unknown;
  }
}

const textareaValues = (scope: Locator): Promise<string[]> =>
  scope.locator('textarea').evaluateAll((elements) => elements.map((e) => (e as HTMLTextAreaElement).value));

async function expand(scope: Locator, name: string | RegExp): Promise<void> {
  const header = scope.getByRole('button', { name, exact: true });
  if ((await header.getAttribute('aria-expanded')) === 'false') {
    await header.click();
  }
  await expect(header).toHaveAttribute('aria-expanded', 'true');
}

async function expectNoActiveContent(page: Page): Promise<void> {
  const found = await page.evaluate(() => {
    const root = document.getElementById('root')!;
    return {
      activeElements: [...root.querySelectorAll('script, iframe, object, embed')].map((e) => e.outerHTML),
      handlers: [...root.querySelectorAll('*')].flatMap((element) =>
        element.getAttributeNames().filter((name) => name.toLowerCase().startsWith('on')),
      ),
      unsafeHrefs: [...root.querySelectorAll('a[href]')]
        .map((link) => link.getAttribute('href') ?? '')
        .filter((href) => !href.startsWith('#') && !['http:', 'https:'].includes(new URL(href, location.href).protocol)),
      xss: window.__xss,
      cspViolations: window.__cspViolations,
    };
  });
  found.cspViolations = found.cspViolations.filter((v) => !KNOWN_CSP_VIOLATIONS.some((known) => known.test(v)));

  expect(found).toEqual({
    activeElements: [],
    handlers: [],
    unsafeHrefs: [],
    xss: undefined,
    cspViolations: [],
  });
}

/** Custom metadata values render as textarea values under "Metadata" > "Additional metadata (N)". */
async function expectThreatMarker(scope: Locator, { marker, in: where }: (typeof THREAT_MARKERS)[number]) {
  if (where === 'statement') {
    await expect(scope.getByText(marker).first()).toBeVisible();
    return;
  }
  await expand(scope, 'Metadata');
  await expand(scope, /^Additional metadata \(\d+\)$/);
  const index = await textareaValues(scope).then((values) => values.findIndex((v) => v.includes(marker)));
  expect(index, `${marker} in a metadata value`).toBeGreaterThanOrEqual(0);
  await expect(scope.locator('textarea').nth(index)).toBeVisible();
}

test.describe('TMT import - XSS acceptance (Sample_Threat_Model_With_XSS)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.__cspViolations.push(`${event.violatedDirective} ${event.blockedURI} ${event.sourceFile}:${event.lineNumber}`);
      });
    });

    await page.goto('/');
    await expectOnDashboard(page);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByText('Import into current workspace', { exact: true }).click();
    await page.getByText('Microsoft TMT', { exact: true }).click();
    await page.locator('input[type="file"][accept^=".tm7"]').setInputFiles(TM7);
    await page.locator('input[type="file"][accept^=".htm"]').setInputFiles(REPORT);

    const importButton = page.getByRole('button', { name: 'Import', exact: true });
    await expect(importButton).toBeEnabled();
    await importButton.click();
    // Threats 7 and 8 have no curated template mapping, so the import reports warnings first.
    await page.getByRole('button', { name: 'Ignore and continue', exact: true }).click();
    await expect(importButton).toBeHidden();
  });

  test('the Application info page shows its markers with no active content', async ({ page }) => {
    await navigateVia(page, 'Application info');

    for (const marker of APPLICATION_MARKERS) {
      await expect(page.locator('#root').getByText(marker).first(), marker).toBeVisible();
    }
    await expectNoActiveContent(page);
  });

  test('the threat list shows each threat marker with no active content', async ({ page }) => {
    await navigateVia(page, 'Threats');

    for (const expected of THREAT_MARKERS) {
      await expectThreatMarker(entityCard(page, 'Threat', expected.numericId), expected);
    }
    await expectNoActiveContent(page);
  });

  for (const expected of THREAT_MARKERS) {
    test(`the threat editor for threat ${expected.numericId} shows ${expected.marker} with no active content`, async ({
      page,
    }) => {
      await navigateVia(page, 'Threats');
      await byTooltip(entityCard(page, 'Threat', expected.numericId), 'Edit').click();
      await expect(page).toHaveURL(/\/threats\/[0-9a-f-]{36}$/);
      await waitForAppShell(page);
      // Wait for the list's cards (one Metadata section each) to unmount, leaving only the editor's.
      await expect(page.getByRole('button', { name: 'Metadata', exact: true })).toHaveCount(1);

      await expectThreatMarker(page.locator('#root'), expected);
      await expectNoActiveContent(page);
    });
  }

  test('the report view shows every marker with no active content', async ({ page }) => {
    await navigateVia(page, 'Threat model');
    // The report renders the threats after the application section; wait for all 29 threat blocks.
    const metadataBlocks = page.locator('#root details');
    await expect(metadataBlocks).toHaveCount(29);

    // Each threat's "Additional metadata" is a collapsed <details>; open them all, as a reviewer would.
    const collapsed = page.locator('#root details:not([open]) > summary');
    for (let remaining = await collapsed.count(); remaining > 0; remaining--) {
      await collapsed.first().click();
    }
    await expect(collapsed).toHaveCount(0);

    for (const marker of REPORT_MARKERS) {
      await expect(page.getByText(marker).first(), marker).toBeVisible();
    }
    await expectNoActiveContent(page);
  });
});
