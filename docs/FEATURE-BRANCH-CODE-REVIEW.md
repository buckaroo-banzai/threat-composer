# Code review: 'feature/tmt-import' branch

Date: 2026-09-30. Branch head: '838c581'.

## Scope and method

- **Scope:** all code the branch adds or changes compared with the fork's 'main' (97 files, tests included). This covers US-1 (multi-diagram data flows, schema 1.1, consent-gated migration), the security fixes (import sanitization, image-fetch guard), and US-4 (Microsoft TMT import, custom metadata editing, per-threat report layout).
- **Authorship:** git history does not record which AI model wrote which code, so this review cannot single out code written by Claude Opus 4.8. It covers the whole branch, including US-4-T5 and US-4-T10, which were written in the current session.
- **Method:** four parallel read-only review passes produced candidate findings. Every finding below was then checked by reading the code. One finding (R1) was reproduced in the running app. Candidate findings that did not survive checking are listed under "Considered and not recommended", with the reason.
- **Confidence labels:** **Confirmed** means reproduced at run time. **Verified** means checked by reading the code. **Judgment** means a design opinion that is open to discussion.

## Summary

| ID | Recommendation | Category | Impact | Confidence |
| --- | --- | --- | --- | --- |
| R1 | Fix the 'save' after **Upgrade** in the IDE path: it sends the workspace as it was before the import | Bug (data loss) | High | Fixed 2026-10-01 ([ace4898](https://github.com/buckaroo-banzai/threat-composer/commit/ace4898b24bf177849e80c57df39b7a74e166ba5)) |
| R2 | Define the schema version (1.1) once instead of three times | Simplicity | Medium | Fixed 2026-10-01 ([3e8c8b0](https://github.com/buckaroo-banzai/threat-composer/commit/3e8c8b05437ba6affba2da17373c76995cce1eaa)) |
| R3 | Use a single name for the migration entry point, and drop the repeated version check | Simplicity | Medium | Fixed 2026-10-01 ([3e8c8b0](https://github.com/buckaroo-banzai/threat-composer/commit/3e8c8b05437ba6affba2da17373c76995cce1eaa)) |
| R4 | Extract the shared held-edit logic of 'CommentsEdit' and 'CustomMetadataEditor' | Simplicity | Medium | Declined 2026-10-01: little value, abstraction risk, heavy re-testing |
| R5 | Reset the TMT import state in one place in 'FileImport' | Simplicity | Medium | Fixed 2026-10-01 ([fdc3879](https://github.com/buckaroo-banzai/threat-composer/commit/fdc38795ac3df8e96ecb9c2c084a519d3b0ec8cd)) |
| R6 | Share the per-threat report fields between the Markdown and Word exports | Simplicity | Medium | Fixed 2026-10-01 ([2bcc2bd](https://github.com/buckaroo-banzai/threat-composer/commit/2bcc2bd2794945bbe7a9b3a28ac1e41c7897ccd4)) |
| R7 | Split the 150-line loop in 'convertTmtThreats' into named steps | Design | Medium | Fixed 2026-10-01 ([b5c37f5](https://github.com/buckaroo-banzai/threat-composer/commit/b5c37f5143304c0e6f05607df569cfac95efbbcd)) |
| R8 | Remove unused TMT model fields and a no-op sort | Simplicity | Low | Partly done 2026-10-01 ([31d7a9b](https://github.com/buckaroo-banzai/threat-composer/commit/31d7a9b16982d16e376f5202b46e0e8813b49189)): 'order' and its sort removed; 'version' restored because it documents the supported TMT format version; other fields kept by decision |
| R9 | Trim TMT surface names once, at parse time | Simplicity | Low | Fixed 2026-10-01 ([31d7a9b](https://github.com/buckaroo-banzai/threat-composer/commit/31d7a9b16982d16e376f5202b46e0e8813b49189)) |
| R10 | Fix comments that break project rules (internal SDL ID, untagged forward reference, TODO format, spelling) | Comments | Low | Fixed 2026-10-01 ([febeb2e](https://github.com/buckaroo-banzai/threat-composer/commit/febeb2e8c355c59805c1c8832938b3c9a74d4717)) |
| R11 | 'ImportErrors': duplicate React keys, a duplicated prop type, and wording when there are only warnings | Bug / Types | Low | Fixed 2026-10-01 ([c2d80fc](https://github.com/buckaroo-banzai/threat-composer/commit/c2d80fc3182543d64e7729aa1e796f1a13893419)) |
| R12 | Remove two avoidable type casts and an 'any[]' | Types | Low | Fixed 2026-10-01 ([0a4b767](https://github.com/buckaroo-banzai/threat-composer/commit/0a4b767ea8e4186c6d885c9fc8ff253a0e373ae4)) |
| R13 | Review the image-fetch guard's Microsoft-specific blocked ranges | Security / project fit | Low | Declined 2026-10-01: ranges kept because the problem also exists in other enterprise environments |
| R14 | Revoke the object URL created for each exported image | Bug (memory) | Low | Fixed 2026-10-01 ([07198fb](https://github.com/buckaroo-banzai/threat-composer/commit/07198fbe9c23bad6bb85d9ed0b35335a8abc152f)) |
| R15 | Remove internal story IDs from test names | Tests | Low | Fixed 2026-10-01 ([febeb2e](https://github.com/buckaroo-banzai/threat-composer/commit/febeb2e8c355c59805c1c8832938b3c9a74d4717)) |

Overall, the branch is in good shape. The import pipeline is layered cleanly: parse, then extract the report diagrams, then convert the threats, then assemble the model, then the standard sanitize, migrate, and validate step. Untrusted input is handled carefully, and tests cover hostile input and real fixtures. R1 is the only finding with user impact. Most of the rest remove duplication that has built up across user stories.

## Findings

### R1: The 'save' after Upgrade carries pre-import data (High, Confirmed in browser mode)

**Status:** fixed 2026-10-01 with option (a), in commit [ace4898](https://github.com/buckaroo-banzai/threat-composer/commit/ace4898b24bf177849e80c57df39b7a74e166ba5).
- A new 'WindowExporter' test reproduces the bug: it failed before the fix and passes after it.
- In VS Code, a schema 1.0 file with 20 threats was saved on disk as schema 1.1 with all 20 threats and its diagram image after **Upgrade**.

**Where:** [WindowExporter/index.tsx](../packages/threat-composer/src/components/generic/WindowExporter/index.tsx#L41-L72); the 'save' event is dispatched at [line 66](../packages/threat-composer/src/components/generic/WindowExporter/index.tsx#L66).

**What:** 'setWorkspaceData' is a 'useCallback' closure that is registered on 'window.threatcomposer'. While it runs, it awaits 'importData' and then the consent prompt. When the user chooses **Upgrade**, it dispatches 'save' with 'getWorkspaceData()'. That 'getWorkspaceData' is the copy captured when the callback was created, before the import, so it reads the old React state.

**Evidence:** the browser-mode dev server was used. A listener was registered for 'save', 'setCurrentWorkspaceData' was called with a schema-1.0 document containing 1 threat, and **Upgrade** was clicked. Results:
- The 'save' payload had 0 threats and no application name; its schema was 1.1.
- 'getCurrentWorkspaceData()' afterwards had 1 threat and the name "StaleClosureProbe".

**Why it matters:** in the AWS Toolkit for VS Code, the bridge's 'save' handler writes 'e.detail' to the file with 'SAVE_FILE' (checked in 'vsCodeExtensionInterface.js'). On **Upgrade**, that would replace the user's '.tc.json' with the workspace as it was before the load; for a freshly opened file, that is the empty default. This has not yet been reproduced inside VS Code. The code path is the same, but it should be confirmed there.

**Suggested change (options to discuss):**
- (a) Keep the latest 'getWorkspaceData' in a ref ('getWorkspaceDataRef.current = getWorkspaceData' on each render), and read the ref inside the 'setTimeout'. This is a small change that keeps the current normalization ('cleanupThreatData', composer mode).
- (b) Dispatch the migrated document that is already in scope ('parsedData'). This is deterministic, but it skips the normalization 'getWorkspaceData' applies.

I recommend (a), followed by a real VS Code check: open a 1.0 file, choose **Upgrade**, and inspect the file on disk. The same stale closure gives the prompt a stale 'currentWorkspace' name; this is cosmetic.

### R2: The schema version is hard-coded three times (Medium, Verified)

**Status:** fixed 2026-10-01 in commit [3e8c8b0](https://github.com/buckaroo-banzai/threat-composer/commit/3e8c8b05437ba6affba2da17373c76995cce1eaa). 'CURRENT_SCHEMA_VERSION' is defined once, in 'src/configs/constants.ts'.

**Where:**
- [useExportImport/index.ts](../packages/threat-composer/src/hooks/useExportImport/index.ts#L35) has 'const SCHEMA_VERSION = 1.1'.
- [dataExchange.ts](../packages/threat-composer/src/customTypes/dataExchange.ts#L28) has 'z.number().max(1.1)'.
- [migrateDataExchange/index.ts](../packages/threat-composer/src/utils/migrateDataExchange/index.ts#L20) has 'CURRENT_SCHEMA_VERSION = 1.1'.

**Why it matters:** the next schema version has to change all three places in step. If one is missed, the app exports the wrong version or rejects valid files.

**Suggested change:** move 'CURRENT_SCHEMA_VERSION' into 'src/configs' and import it in all three places. A 'configs' location avoids an import cycle, because 'customTypes' would otherwise import from 'utils', which imports 'customTypes'.

### R3: Two names for one migration entry point, and a repeated check (Medium, Verified)

**Status:** fixed 2026-10-01 in commit [3e8c8b0](https://github.com/buckaroo-banzai/threat-composer/commit/3e8c8b05437ba6affba2da17373c76995cce1eaa). By your decision, the single name is 'migrateToCurrentSchema' (module folder renamed to match), and its input type is now 'UnmigratedDataExchangeFormat'. The supported-version check is kept only in the migration function, which every load path calls. Three tests that duplicated others under the old second name were removed. The links below point to the old file locations.

**Where:**
- 'migrateToCurrent' ([migrateDataExchange/index.ts](../packages/threat-composer/src/utils/migrateDataExchange/index.ts#L111)) and the default export 'migrateDataExchange' ([line 128](../packages/threat-composer/src/utils/migrateDataExchange/index.ts#L128)) are the same function under two names. Production code imports the default; only the tests use 'migrateToCurrent'.
- 'parseImportedData' checks 'SUPPORTED_SCHEMA_VERSIONS' ([parseImportedData/index.ts](../packages/threat-composer/src/utils/parseImportedData/index.ts#L36)), and the migration function immediately checks it again.

**Suggested change:** keep one name ('migrateDataExchange' matches the module and its callers). Keep the version check in one place. The check in 'parseImportedData' gives a friendlier message when 'schema' is missing, so either keep it there and remove the one in the migration function, or the reverse.

### R4: 'CommentsEdit' and 'CustomMetadataEditor' duplicate the held-edit lifecycle (Medium, Verified + Judgment)

**Decision (2026-10-01): declined; no change.** Extracting a shared hook would couple the two editors: once both depend on the shared code, a change made for one affects the other. Only two editors would use it, and they already differ (rows with validation versus plain text, and a keystroke-save mode in 'CommentsEdit'), so the hook would need optional parts to fit both, an early sign of the wrong abstraction. The benefit is small, and the refactor would require re-testing working behavior in the browser and VS Code. Revisit if a third editor needs held edits.

**Where:** [CommentsEdit/index.tsx](../packages/threat-composer/src/components/generic/CommentsEdit/index.tsx#L43-L83) and [CustomMetadataEditor/index.tsx](../packages/threat-composer/src/components/threats/CustomMetadataEditor/index.tsx#L52-L107).

**What:** both components hold typed text until focus loss or page hide. Both implement the same mechanics:
- a ref for the unsaved value and a ref for the latest props;
- a ref for the "last known stored value";
- four 'useEffect's: discard the draft on an outside change, clear the unsaved edit on unmount, stop sharing once the save comes back, and (in 'CustomMetadataEditor') resync on threat change;
- a 'save' that skips unchanged values;
- 'useSaveOnPageHide';
- registering and clearing unsaved edits.

**Why it matters:** this is the subtlest code on the branch; it handles the host autosave and the IDE round trip. Two hand-kept copies can drift apart, and a fix to one is easy to miss in the other.

**Suggested change:** extract one hook, given the editor key, the threat, a serializer for the stored value, and an 'EntityUpdate' factory, that returns 'edit(value)' and 'save()'. The name needs discussion; one option is 'useHeldThreatEdit'. This is a refactor of working, manually verified behavior, so it needs the same manual browser and VS Code checks afterwards.

### R5: 'FileImport' resets TMT state in three places (Medium, Verified)

**Status:** fixed 2026-10-01 in commit [fdc3879](https://github.com/buckaroo-banzai/threat-composer/commit/fdc38795ac3df8e96ecb9c2c084a519d3b0ec8cd). 'resetImportState()' clears the parse result, error, and errors overlay; the two places that also clear the selected files still do so themselves, because clearing the files from the file-change handler would trigger that handler again. By your decision, the four TMT import size limits also moved into 'src/configs/constants.ts', next to the project's other input limits.

**Where:** 'finishImport' ([FileImport/index.tsx](../packages/threat-composer/src/components/workspaces/FileImport/index.tsx#L102)), the file-change effect ([line 178](../packages/threat-composer/src/components/workspaces/FileImport/index.tsx#L178)), and 'handleModeChange' ([line 187](../packages/threat-composer/src/components/workspaces/FileImport/index.tsx#L187)). Each clears the same five or six state variables by hand.

**Suggested change:** one 'resetImportState()' function called from all three places. This is a small change; it removes the risk of adding a new state variable and missing one of the resets.

### R6: The Markdown and Word reports duplicate the per-threat field logic (Medium, Verified + Judgment)

**Status:** fixed 2026-10-01 in commit [2bcc2bd](https://github.com/buckaroo-banzai/threat-composer/commit/2bcc2bd2794945bbe7a9b3a28ac1e41c7897ccd4). A generic 'getThreatReportFields(threat, data)' in the core package (exported for the app) returns the status label, priority, STRIDE, the TMT description, the other custom entries, and the linked mitigations and assumptions; both reports use it, and the Word export's two copied loops are replaced by 'linkedItemRuns(label, items)'. The helper has its own unit tests, and the existing Markdown report tests pass unchanged. The Word export's threat section has no unit test, so it is checked manually.

**Where:**
- Markdown: [getThreats/index.ts](../packages/threat-composer/src/utils/convertToMarkdown/utils/getThreats/index.ts#L62-L84).
- Word: [getThreats.ts](../packages/threat-composer-app/src/utils/convertToDocx/getThreats.ts#L33). Its mitigation and assumption loops ([line 63](../packages/threat-composer-app/src/utils/convertToDocx/getThreats.ts#L63) and [line 78](../packages/threat-composer-app/src/utils/convertToDocx/getThreats.ts#L78)) are copies of each other.

**What:** both exports derive the same values: status label, priority, STRIDE, the 'custom:TMT Description' special case, and the remaining custom-metadata entries. The TMT-specific rule ("TMT Description first, the rest under Additional metadata") therefore lives in two places.

**Suggested change:**
- Export a helper from the core package that returns these fields for a threat, and have both renderers use it.
- In the Word export, replace the two linked-item loops with one function that takes the label, links, items, and ID prefix.

Upstream already keeps the two exports in parallel, so this is a judgment call. The benefit is keeping the TMT-specific rule in one place.

### R7: 'convertTmtThreats' is one long loop (Medium, Judgment)

**Status:** fixed 2026-10-01 in commit [b5c37f5](https://github.com/buckaroo-banzai/threat-composer/commit/b5c37f5143304c0e6f05607df569cfac95efbbcd). By your decision, the metadata building moved into 'buildThreatMetadata(threat, model, category)', and the three limit checks into 'getMetadataLimitError(metadata)', which returns the reason or 'undefined' (matching the existing 'getCustomMetadataNameError' pattern). The existing converter tests pass unchanged. One edge case changed: the 'custom:TMT Diagram' lookup now takes the first surface with a matching GUID rather than the last; valid TMT files have unique surface GUIDs.

**Where:** [convertTmtThreats/index.ts](../packages/threat-composer/src/utils/tmt/convertTmtThreats/index.ts#L191-L338).

**What:** after 'composeStatement' was extracted, the loop still builds metadata (from [line 237](../packages/threat-composer/src/utils/tmt/convertTmtThreats/index.ts#L237)), runs three limit checks (from [line 278](../packages/threat-composer/src/utils/tmt/convertTmtThreats/index.ts#L278)), reallocates IDs, and validates against the schema.

**Suggested change:** extract a function that builds the metadata entries for a threat and another that finds the first metadata limit it exceeds. The loop then reads as: compose, render, build metadata, check limits, validate. Behavior stays the same, and the existing 29 converter tests cover it.

### R8: Unused TMT model fields and a no-op sort (Low, Verified)

**Status (2026-10-01, commit [31d7a9b](https://github.com/buckaroo-banzai/threat-composer/commit/31d7a9b16982d16e376f5202b46e0e8813b49189)):** by your decision, 'TmtDrawingSurface.order' (with its sort) was removed, because it always equalled the array position. 'TmtModel.version' was also removed in that commit, then restored in the next change (commit [d4ef106](https://github.com/buckaroo-banzai/threat-composer/commit/d4ef106065ac2618c4918e7f9b794d7ec6000188)): although it is always '4.3', it documents which TMT format version the import is meant to support. 'surfaceGuid', 'TmtThreat.key', 'interactionKey', and 'TmtThreatType.description' were kept, so the parser stays a faithful model of the file for later tasks.

**Where:**
- Never read in production code: 'TmtReportDiagram.surfaceGuid' ([extractTmtReportDiagrams/index.ts](../packages/threat-composer/src/utils/tmt/extractTmtReportDiagrams/index.ts#L20)), 'TmtThreat.key' and 'interactionKey' ([tmtModel.ts](../packages/threat-composer/src/utils/tmt/tmtModel.ts#L39-L47)), 'TmtThreatType.description', and 'TmtModel.version'.
- 'TmtDrawingSurface.order' is always the array index, so the sort by 'order' ([extractTmtReportDiagrams/index.ts](../packages/threat-composer/src/utils/tmt/extractTmtReportDiagrams/index.ts#L83)) changes nothing.

**Suggested change:** remove any of these fields that US-4-T11 (mitigations) and US-5 do not need, and remove 'order' together with the sort. To discuss: the parser was designed as a neutral, faithful model, so you may prefer to keep some of these fields deliberately.

### R9: Trim surface names once (Low, Verified)

**Status:** fixed 2026-10-01 in commit [31d7a9b](https://github.com/buckaroo-banzai/threat-composer/commit/31d7a9b16982d16e376f5202b46e0e8813b49189). The XML parser is configured with 'trimValues: true', so names already come out trimmed; a new parser test confirms this, and the five redundant '.trim()' calls in the extractor were removed. No parser change was needed.

**Where:** 'surface.name.trim()' appears five times in [extractTmtReportDiagrams/index.ts](../packages/threat-composer/src/utils/tmt/extractTmtReportDiagrams/index.ts#L95-L113).

**Suggested change:** trim in 'parseTmtModel' when the surface is built; every consumer then gets a clean name.

### R10: Comments that break project rules (Low, Verified)

**Status:** fixed 2026-10-01 in commit [febeb2e](https://github.com/buckaroo-banzai/threat-composer/commit/febeb2e8c355c59805c1c8832938b3c9a74d4717). The same 'TODO' format was also fixed in 'MigrationConsentModal'.

- [FileImport/index.tsx](../packages/threat-composer/src/components/workspaces/FileImport/index.tsx#L33-L35) cites an internal SDL requirement ID and "tuned in US-4-T1". For this open-source project, describe the reason instead: avoid reading an oversized file into memory.
- [extractTmtReportDiagrams/index.ts](../packages/threat-composer/src/utils/tmt/extractTmtReportDiagrams/index.ts#L25) says "calibrate against real report sizes in US-4-T1". That is either a 'TODO: ' item or stale, since US-4-T1 is done.
- [migrateDataExchange/index.ts](../packages/threat-composer/src/utils/migrateDataExchange/index.ts#L80) uses 'TODO: (US-3-T3):' rather than the agreed 'TODO: US-3-T3 ...', and the British spelling "favour".

### R11: 'ImportErrors' details (Low, Verified)

**Status:** fixed 2026-10-01 in commit [c2d80fc](https://github.com/buckaroo-banzai/threat-composer/commit/c2d80fc3182543d64e7729aa1e796f1a13893419). List items are keyed by position, the prop type reuses 'TmtUnconvertibleThreat', and when there are only warnings the overlay is headed "Review import warnings" and says "Some threats were imported with adjustments. Review them below, then abort or continue." No failing unit test was written for the duplicate keys: reproducing them requires rendering the Cloudscape modal, which this package has no test setup for; the change is checked manually.

**Where:** [ImportErrors/index.tsx](../packages/threat-composer/src/components/workspaces/FileImport/components/ImportErrors/index.tsx#L25-L54).

- 'key={item.id}' uses the TMT threat ID. Two unconvertible threats can share an ID (the converter already handles duplicate IDs), which gives React duplicate keys. Use the index instead, or combine the ID with the index.
- The prop type re-declares '{ id: number; reason: string }' instead of reusing 'TmtUnconvertibleThreat'.
- When there are only warnings, the header "Import errors" and the text "Some content in this model could not be imported" overstate the problem. This is a wording decision for you.

### R12: Avoidable casts (Low, Verified)

**Status:** fixed 2026-10-01 in commit [0a4b767](https://github.com/buckaroo-banzai/threat-composer/commit/0a4b767ea8e4186c6d885c9fc8ff253a0e373ae4). 'values as string[]' is replaced by a type-guard filter, and the Word export's 'children' is typed with the docx element types. The final 'filled as TmtTemplateFields' cast remains: the object is built key by key from 'Object.entries', so TypeScript cannot infer its shape.

- 'fillMappingFields' uses 'values as string[]' and 'filled as TmtTemplateFields' ([convertTmtThreats/index.ts](../packages/threat-composer/src/utils/tmt/convertTmtThreats/index.ts#L138-L140)). A type-guard filter ('(v): v is string => v !== undefined') removes the first cast.
- 'const children: any[]' in the Word export's 'getThreats' can use the docx element types.

### R13: The image-fetch guard's Microsoft-specific ranges (Low, Judgment)

**Where:** [isImageUrlSafeToFetch.ts](../packages/threat-composer-app/src/utils/convertToDocx/isImageUrlSafeToFetch.ts#L42-L45).

**What:** the guard blocks 25.0.0.0/8 and 168.63.129.16 (the Azure WireServer address). Both come from Microsoft-environment conventions. 25.0.0.0/8 is publicly routable, so blocking it in an AWS open-source tool is arbitrary.

**Context:** the fetch runs in the user's browser, so the guard protects against the browser being made to call intranet or metadata addresses on the user's behalf. It is not a server-side request forgery (SSRF) defense in the usual sense. The guard is still worthwhile, and its comments state the DNS rebinding limitation.

**Suggested change:** decide whether to keep these two Microsoft-specific entries.

**Decision (2026-10-01): keep both ranges; no change.** Microsoft uses these ranges, but other enterprise environments have the same problem, so they are not Microsoft-specific. This confirms the earlier decision to keep them. The "Microsoft-specific" and "arbitrary" wording above was this review's assessment, which the decision overrides.

### R14: Object URL never revoked (Low, Verified)

**Status:** fixed 2026-10-01 in commit [07198fb](https://github.com/buckaroo-banzai/threat-composer/commit/07198fbe9c23bad6bb85d9ed0b35335a8abc152f). A new 'fetchImage' test failed before the fix and passes after it.

**Where:** [fetchImage.ts](../packages/threat-composer-app/src/utils/convertToDocx/fetchImage.ts#L66).

**What:** each exported image creates a Blob URL that is never released. The branch modified this line; the leak may predate it.

**Suggested change:** call 'URL.revokeObjectURL' in 'onload' and 'onerror'.

### R15: Story IDs in test names (Low, Judgment)

**Status:** fixed 2026-10-01 in commit [febeb2e](https://github.com/buckaroo-banzai/threat-composer/commit/febeb2e8c355c59805c1c8832938b3c9a74d4717).

Several 'describe' names embed internal plan IDs, for example "(US-1-T2)" and "(US-1-T5 / US-2)". If the branch is offered upstream, these refer to a plan that upstream doesn't have. Consider plain behavior descriptions instead.

## Considered and not recommended

| Candidate | Why not |
| --- | --- |
| "Missing '?.' on 'onUpdateEntity' in 'CustomMetadataEditor' crashes" | The prop is required ([line 38](../packages/threat-composer/src/components/threats/CustomMetadataEditor/index.tsx#L38)); not a bug. |
| "Module-level 'unsavedEdits' registry is unsafe for concurrent server use" | The app runs only in the browser, and 'window.threatcomposer' is already a page-level singleton. Tests reset the registry. |
| "Cache the regular expressions in 'matchesTemplate'" | At most two are compiled per threat; the cost is negligible next to the extra code. |
| "Add comments explaining the null-prototype maps" | Each one already has such a comment. |
| "Add JSDoc to test helpers" | Conflicts with the project's short-comment convention. |
| "Move 'MAX_TMT_FILE_BYTES' or the unsaved-edit key strings into shared constants" | Each has one or two uses; a shared constant adds indirection without benefit. |
| "Generalize 'DataflowMigrationGate' for future schema changes" | Speculative; the step-based migration registry already allows for new versions. |
| "Remove the single-step migration registry as over-engineering" | Keep it: it follows the project's schema-versioning principle (versions coexist, migrate at the boundary). |
| "React index keys in 'ThreatStatementCard'" | The token array is derived and fixed for each render; index keys are correct here. |

## Strengths worth keeping

- **Import pipeline:** clear stage boundaries. Each stage either throws a specific error or returns typed results, and the final data goes through the same sanitize, migrate, and validate path as a JSON import.
- **Untrusted input:**
  - DOCTYPE and ENTITY declarations are rejected before XML parsing.
  - Null-prototype maps are used for keys taken from the file.
  - Lengths are computed before strings are built.
  - Lengths are checked on the HTML-encoded form that is actually stored.
  - The base64 image payload is checked against an allow-list.
  - Markdown output is escaped.
  - Image fetches refuse redirects ('redirect: "error"').
- **Failure policy:** threats that can't be converted are reported with specific reasons and the user decides whether to continue; nothing is silently dropped.
- **Tests:** real TMT fixtures, plus targeted tests for hostile input that were confirmed to fail when the fixes were undone.
- **IDE safety:** while consent is pending, the original document is returned to the host unchanged, so the host's autosave can't persist an upgraded schema before the user consents.

## Suggested order

1. **R1** (data loss) — done.
2. **R10, R11, R14** (small, local fixes).
3. **R2, R3, R5** (small simplifications with low risk).
4. **R4, R6, R7** (larger refactors; agree on the design first, then retest manually). R4 was declined (see its decision).
5. **R8, R9, R12, R15**, as you choose. R13 was declined (see its decision).
