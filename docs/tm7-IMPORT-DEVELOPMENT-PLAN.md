# Microsoft TMT Model Import Development Plan

## Status

This document records the design decisions agreed for importing Microsoft Threat Modeling Tool '.tm7' models into Threat Composer (TC). It is a living plan and should be updated as implementation discoveries require further decisions.

The TC baseline was verified before design work began:

- 'pdk build': all five projects passed.
- 'pdk test': all five projects passed.

## User Stories and Development Tasks

This section is the living execution board for the feature. It refines the Delivery Phases into independently valuable user stories. Development tasks are recorded beneath the user story they belong to. Update statuses as work progresses.

**Statuses:** 'Backlog' · 'In Development' · 'Completed'

Statuses apply to both user stories and their development tasks. A user story is 'In Development' when at least one of its tasks is 'In Development', and 'Completed' only when every task is 'Completed' and its acceptance criteria pass.

### US-1 — A user maintains multiple named data-flow diagrams in the Data Flow section

**Status:** 'Completed' (2026-09-02: all tasks US-1-T1 through US-1-T8 are Completed; acceptance criteria verified via unit tests plus manual in-browser, IDE, and Word-export checks. Documented deviations remain recorded below.)

**Story:** As a Threat Composer user, I can maintain multiple named data-flow diagrams in the Data Flow section — view, add, rename, reorder, replace, and delete — with my diagrams persisted locally, while my existing single-image workspaces keep working unchanged.

**Business value:** Delivers standalone value to every TC user independent of TMT import, and establishes the schema '1.1' 'dataflow.diagrams' foundation that the TMT importer will later populate.

**Boundary:**

- In scope: schema '1.1' 'dataflow.diagrams' model; '1.0' → '1.1' import migration; local persistence and on-load migration for both Data Flow context providers; multi-DFD CRUD and reorder UI; a minimal export shim so single-diagram exports keep working.
- Deferred to US-2: updating the on-screen report and Markdown/Word/PDF exports to render *all* diagrams. Until US-2, exports emit the first diagram only.

**Acceptance criteria:**

- Schema '1.1' defines 'dataflow.diagrams' as an ordered array of '{ id, name, image }'; 'dataflow.description' is retained.
- Importing a schema '1.0' '.tc.json' migrates 'dataflow.image' into a one-item 'diagrams' array and removes the legacy 'image' key so strict validation passes.
- A model with no Data Flow image imports to an empty 'diagrams' array.
- Existing browser workspaces with a single Data Flow image migrate to a one-item 'diagrams' array on load, under both the singleton local-state and multi-workspace localStorage providers.
- Architecture's single-image behavior is unchanged (shared 'BaseImageInfo' not regressed).
- Users can add, rename, reorder (keyboard-accessible Move up / Move down), replace, and delete diagrams; the first diagram is selected by default; the shared description remains above the collection.
- '.tc.json' export round-trips through schema '1.1'; 'pdk build' and 'pdk test' pass; new tests cover schema, migration, and CRUD/reorder.

**Development tasks:**

| ID | Task | Status |
| --- | --- | --- |
| US-1-T1 | Data layer: add a Data-Flow-specific 'diagrams' model and 'DiagramSchema'; bump 'SCHEMA_VERSION' to '1.1' across all three enforcement points (Zod 'z.number().max(...)', JSON schema 'maximum', and the import version check); replace the hard '!== SCHEMA_VERSION' equality with an accept-list for '1.0' and '1.1'; add a '1.0' → '1.1' migrator that moves 'image' into 'diagrams[0]' and strips the legacy key; unit tests. | 'Completed' |
| US-1-T2 | Consent-gated persistence and on-load migration in both 'DataflowContext' providers (singleton local-state and multi-workspace localStorage). Detect a schema 1.0 dataflow shape — a stored dataflow that still carries the removed 'image' key and has no 'diagrams' (the per-workspace localStorage blobs do not record a schema number, so this shape is the only signal of schema 1.0) — and require explicit user consent before altering anything: no silent migration. Detection and the consent gate live at workspace-open orchestration (before the per-workspace contexts mount), so a cancelled model stays fully unloaded (1.1 UI never runs on 1.0 data); a modal drives the UX and the providers persist the migrated value on Proceed. Proceed: migrate 'image' into 'diagrams[0]' and persist as 1.1. Cancel: leave the stored model unaltered and unloaded. The same consent must also guard the IDE injection path (window.threatcomposer.setCurrentWorkspaceData -> parseImportedData): detect schema 1.0 and prompt before applying/migrating, using one shared consent mechanism for both entry points; on cancel, do not load the model (in-memory migration without explicit consent is unsafe because the user could Save the upgraded file by accident). Explicit file-import (the import modal) is NOT gated: it creates a new workspace and never alters a source file, so it migrates as today. Offer a backup export before proceeding. Tests: pure migration fn + provider/injection render tests. Implementation constraint (leave-it-better): route the '1.0' → '1.1' migrator through the shared single-step migration entry point described in 'Schema Migration Architecture (Target State)' and US-3, rather than invoking it ad hoc; keep structural detection only as the transitional 'absent-marker ⇒ 1.0' fallback. The original system never accounted for schema evolution; this migration must not perpetuate that oversight by adding disposable one-off checks — it should leave future migrations simpler. | 'Completed' (2026-08-27: localStorage provider gated via 'DataflowMigrationGate'; the singleton local-state/examples path now auto-migrates in-memory at the 'WorkspaceExamplesContext' boundary via the shared 'migrateDataExchange' — no consent needed since examples are read-only; verified in-browser that a schema-1.0 example's Data Flow diagram renders again. The IDE-injection consent gate is tracked separately as US-1-T7.) |
| US-1-T3 | Multi-DFD UI built additively on the Data Flow section (named selection, add/rename/reorder/replace/delete, keyboard-accessible reorder) without regressing the shared Architecture single-image component; tests. | 'Completed' (2026-08-27: Select picker + Add / 'Confirm and Add' + Rename + Delete + keyboard-accessible Move up/down; verified in-browser; shared 'BaseDiagramInfo' gained a forwardRef 'confirm()' handle with Architecture unaffected). |
| US-1-T4 | Export continuity shim: report and Markdown/Word/PDF export read 'diagrams[0].image' so single-diagram exports keep working before US-2. | 'Completed' (2026-08-27: instead of a first-diagram shim, the Markdown and Word/docx exporters and the on-screen report render ALL diagrams; see US-2). |
| US-1-T5 | Set up a Jest project for 'threat-composer-app' via its projen config so the Word/docx export path (in 'threat-composer-app', touched by US-1-T4) can be unit-tested. Currently 'threat-composer-app' has a 'test' script but no Jest dependency or config. Prerequisite for testing US-1-T4. | 'Completed' (2026-09-02: the plan's premise was stale — a harness already exists: 'threat-composer-app' tests via CRA (Create React App) 'react-scripts'/'craco test' with '@testing-library/*' and 'setupTests.ts'. Added 'convertToDocx/getDataflow.test.ts' (6 tests) covering multi-diagram ordering plus the no-description / no-image / empty-diagrams / no-dataflow edge cases. No config change was needed: the anticipated ESM 'transformIgnorePatterns' tweak proved unnecessary because 'getDataflow's helpers that pull ESM deps ('convertMarkdown' -> unified/remark) and 'docx' are mocked. Gotcha recorded: CRA enables Jest 'resetMocks', so the test mocks use plain functions (not 'jest.fn') to survive the per-test reset. Visual/appearance check is US-1-T8.) |
| US-1-T6 | Manual verification of the IDE (VS Code / AWS Toolkit) flow, since the extension host is external to this repo (aws/aws-toolkit-vscode): open a schema 1.0 '.tc.json', confirm it renders via in-memory migration, confirm the consent prompt appears before migrating, and confirm an explicit Save writes schema 1.1. Scheduled: 2026-08-19 (maintainer to run). | 'Completed' (2026-09-02: maintainer manually verified the real IDE flow — a schema 1.0 '.tc.json' renders via in-memory migration, the consent prompt appears before the upgrade is persisted, and Save writes schema 1.1 only after Proceed.) |
| US-1-T7 | Consent-gate the IDE-injection path ('window.threatcomposer.setCurrentWorkspaceData' → 'setWorkspaceData' → 'parseImportedData' → 'importData'), which currently migrates schema 1.0 → 1.1 and applies with no prompt. Detect a pre-migration schema below current on the parsed-but-unmigrated payload, request consent via the shared 'MigrationConsentContext' ('WindowExporter' sits inside that provider), migrate + apply only on Proceed, and do not load on Cancel (silent in-memory migration is unsafe because the user could Save the upgraded model). Split out of US-1-T2; its manual end-to-end verification is US-1-T6. | 'Completed' (2026-09-02: implemented in 'WindowExporter'. Deviation from the task's "do not load on Cancel": the injected below-current model IS migrated in memory so the UI renders it, but its ORIGINAL form is stashed in 'MigrationConsentContext.pendingMigration' and 'getCurrentWorkspaceData' returns that original until consent — so a host autosave/Save round-trips the unmodified 1.0 file. Proceed clears the stash and dispatches a 'save' with the 1.1 form; Cancel leaves the original untouched. A parallel guard ('useMigrationConsentGuard') also gates the singleton Save button in 'WorkspaceSelector'. Automated coverage: the pure 'dataExchangeNeedsMigration' detector (unit-tested); the prompt/Proceed/Cancel UI flow is verified manually (US-1-T6). Per maintainer decision, no component render test was added — reshaping working code solely for unit-testability was judged cruft when the UI must be confirmed by running it.) |
| US-1-T8 | Manual verification (maintainer to run): export a workspace containing multiple Data Flow diagrams to Word ('.docx'), open it, and confirm every diagram appears in order under its own name, each with its introduction and image, and that the document formatting looks good. This is the visual/appearance complement to US-1-T5 — whose automated 'getDataflow' tests assert document structure but not fidelity — and it also exercises the US-2 Word export. | 'Completed' (2026-09-02: maintainer exported the migrated GenAIChatbot example plus two manually-added DFDs to '.docx'; all diagrams render correctly, in order, under their names. The check surfaced and we fixed a PRE-EXISTING latent bug where SVG diagram images never exported — see the 'Word/docx SVG export bug' note under US-2.) |

**Implementation deviations from this plan (as of 2026-08-27, verified against code):**

- **Per-diagram introductions replaced the shared description (Option A).** 'DataflowInfo' is now '{ diagrams? }' with no top-level 'dataflow.description'; each 'DataflowDiagram' is '{ id, name, image?, description? }'. Exporters and the report render each diagram's own name and introduction; there is no single shared 'dataflow.description' above the collection.
- **Custom diagram names + rename** were added; auto-renumbering of default names was intentionally dropped (gaps after delete are acceptable).
- **US-1-T2 on-load migration is complete; IDE injection split to US-1-T7 (verified against code):** the consent gate/modal covers the multi-workspace localStorage provider, and the singleton local-state/examples path now auto-migrates in-memory at the 'WorkspaceExamplesContext' boundary (read-only, no consent). This fixed a shipped regression where schema-1.0 bundled examples ('ThreatComposer.tc.json', 'GenAIChatbot.tc.json') rendered an empty Data Flow diagram under the new '.diagrams' UI. Now closed: the IDE-injection path is consent-gated (US-1-T7 complete) — 'WindowExporter' stashes the original and prompts before persisting an upgrade.
- **Dev-tooling fix (not in the original plan):** aliased '@juggle/resize-observer' to a requestAnimationFrame-deferred wrapper (craco) to stop Cloudscape's benign 'ResizeObserver loop completed with undelivered notifications' error in the CRA dev overlay.

### US-2 — A user generates reports and exports that include every data-flow diagram

**Status:** 'In Development' (2026-08-27: Markdown export, Word/docx export, and the on-screen report — which renders via 'convertToMarkdown' — already emit every diagram, each under its name with its own introduction. PDF/print derives from the on-screen report, so it follows but was not separately verified. Remaining: break out formal tasks and verify PDF/print.)

**Story:** As a Threat Composer user, my on-screen report and Markdown, Word, and printable/PDF exports include every data-flow diagram, in order, each under its diagram name, with the shared Data Flow description included once.

**Note:** Tasks will be broken out when US-1 is validated. Depends on US-1's 'dataflow.diagrams' model.

**Word/docx SVG export bug (found + fixed 2026-09-02 via US-1-T8):** SVG diagram images never appeared in '.docx' exports — they fell back to an "Image Unavailable" placeholder, and forcing past that hit a hard 'Buffer is not defined' crash. Two stacked pre-existing bugs in 'convertToDocx', both latent because SVGs failed at the first step so the later code never ran: (1) 'fetchImage' built the object-URL Blob without a MIME type, so the browser could not decode SVG (only raster formats are byte-sniffed) — fixed with 'new Blob([buf], { type: contentType })'; (2) 'getImageRun's SVG branch used Node's 'Buffer.from(...)', which is undefined in the browser (CRA/webpack 5 drops the Buffer polyfill) and also wrongly base64-decoded the whole data URL — fixed with a browser-native 'atob' decode that strips the data-URL prefix. SVG diagrams (e.g. the bundled examples' Architecture and Data Flow images, which are 'data:image/svg+xml') now embed correctly with a PNG fallback. NOT a regression from the multi-diagram work — the Architecture image, untouched by US-1, failed identically; SVG-in-Word simply never worked in this codebase before.

**TMT-import story testing gate (maintainer requirement):** Before the TMT-import story (the '.tm7' importer) is marked complete, add unit tests that exercise '.tm7' parsing/DFD rendering and 1.0 -> 1.1 migration against **actual '.tm7' sample DFD fixtures**, not synthetic data. This gate belongs to the import story, not the schema story (US-1).

### US-3 — A maintainer evolves the data schema with small, single-step migrations

**Status:** 'In Development'

**Story:** As a Threat Composer maintainer, I can add a schema migration as one small, explicit, single-step function, so that evolving the data model does not require bespoke structural detection or risk partial, one-off migrations.

**Business value:** Removes accumulating migration debt. The original design did not account for schema evolution or migration; each ad-hoc migration (US-1) perpetuates that gap. This foundation makes every future migration a small, testable step and retires structural sniffing. It is refactoring surfaced by — and paid for alongside — the migration work, not speculative gold-plating.

**Boundary:**

- In scope: an explicit per-workspace schema marker; a single-step migration registry ('vN' → 'vN+1') behind one 'migrateToCurrent' entry point shared by persistence-load, file-import, and IDE injection; validate-after-migrate; migrators that are pure, total, and deterministic; monotonic-integer (or semver) versioning to retire float versions like '1.1'; read-migrate-in-memory with consent-gated persistence for irreversible bumps; golden per-version fixtures plus a coverage test that every declared version resolves cleanly to current.
- Sequenced but deferred: collapsing the fragmented per-slice 'localStorage' (one key per context) into a single versioned workspace document/manifest. This is the highest-leverage structural change (it makes migrations atomic and detection trivial) but touches every context provider, so it is its own task after the registry exists.

**Acceptance criteria:**

- Detection reads the explicit marker; structural detection survives only as a transitional 'absent-marker ⇒ oldest-known-version' fallback.
- Adding a new schema version requires only a new coexisting version schema, one registered 'vN' → 'vN+1' migrator, and fixtures — no edits to detection logic or call sites.
- All entry points (persistence-load, file-import, IDE injection) migrate through the single shared 'migrateToCurrent'.
- Irreversible persistence of a migrated model stays consent-gated with a backup offer (no silent alteration of a user's stored model).

**Development tasks:**

| ID | Task | Status |
| --- | --- | --- |
| US-3-T1 | Introduce the single-step migration registry and one 'migrateToCurrent' entry point; route the existing '1.0' → '1.1' migrator (US-1-T1) through it; unit tests. Done: 'SCHEMA_MIGRATIONS' registry + 'migrateToCurrent' in 'utils/migrateDataExchange'; 'migrateDataExchange' (used by the import path) now delegates to it; 'SUPPORTED_SCHEMA_VERSIONS' derives from the registry; the field-level 'migrateDataflowInfo' is the single shared transform used by both the registry step and the on-load gate. Note: the on-load gate still migrates a per-slice dataflow blob via 'migrateDataflowInfo' (not a whole-document 'migrateToCurrent') until US-3-T5 collapses per-slice persistence. | 'Completed' |
| US-3-T2 | Add a per-workspace schema marker (on 'Workspace.metadata'), written only on the consent-gated migration; detection prefers the marker and falls back to structural 'absent ⇒ 1.0'. | 'Backlog' |
| US-3-T3 | Adopt monotonic-integer (or semver) versioning; keep a compatibility mapping for the existing '1.0'/'1.1' exchange-format values so older files still import. | 'Backlog' |
| US-3-T4 | Golden per-version fixtures plus a coverage test asserting every declared version migrates cleanly to current. | 'Backlog' |
| US-3-T5 | (Larger, sequence last) Collapse per-slice 'localStorage' persistence into a single versioned workspace document/manifest so migrations are atomic. | 'Backlog' |

### US-4 — A user imports a Microsoft TMT '.tm7' model into Threat Composer

**Status:** 'Backlog'

**Story:** As a Threat Composer user, I can import a Microsoft TMT '.tm7' file and get a new Threat Composer workspace containing every data-flow diagram (faithfully rendered) and every threat (correctly mapped), which I then review and edit with the normal TC tools before saving.

**Business value:** Delivers the headline capability of the feature — moving an existing TMT threat model into TC — reusing US-1's multi-DFD model and US-2's multi-diagram reports/exports.

**Boundary:**

- In scope: file-format validation and namespace-aware '.tm7' v4.3 parsing; DFD rendering (typed model -> SVG -> cropped PNG); threat conversion with status/priority/category (STRIDE) mapping and all fixed plus arbitrary 'custom:TMT *' metadata; the 'custom:*' threat-card and report UI; the 'Microsoft TMT Model Information' block on the Application description; transactional new-workspace creation (multi-workspace) or singleton replace-with-warning; real sanitized '.tm7' fixtures.
- No bespoke preview: the import creates the workspace and the user reviews and edits it in the normal TC views (rename/delete diagrams via US-1, edit descriptions and threats) before saving. There is no separate tabbed-Preview modal or migration draft.
- Out of scope: supporting-document extraction (US-5); anything listed under 'Out of Scope for the Initial Release'.

**Acceptance criteria:**

- A valid '.tm7' v4.3 model imports with every data-flow diagram faithfully rendered and every threat mapped with no data loss and no incorrect mapping (statement, status, priority, category/STRIDE, and all detail preserved as 'custom:TMT *'); nothing is silently dropped, truncated, inferred, or reclassified.
- Invalid input (malformed or DOCTYPE XML, wrong root/namespace, unsupported version, missing required structures, an oversized image, or a threat missing identity/statement) fails with an explicit error and imports nothing.
- A failed, oversized, or cancelled import never modifies or corrupts any existing workspace; a singleton/IDE model is replaced only after an explicit warning with a backup-export offer.
- After import the user adjusts the model with existing TC tools and saves it as a normal schema-'1.1' workspace.
- Automated tests exercise parsing/rendering/threat-mapping against real sanitized '.tm7' v4.3 fixtures (the maintainer test gate), plus mapping and edge-case unit tests; human side-by-side DFD fidelity review against TMT-generated reference images.

**Development tasks:** to be broken out when US-4 is started. Prerequisite: maintainer provides real sanitized '.tm7' v4.3 sample files.

### US-5 — A user brings a supporting document into a description section during import

**Status:** 'Backlog'

**Story:** As a Threat Composer user, I can attach one Word ('.docx'), text ('.txt'), or Markdown ('.md') document to the Application, Architecture, or Data Flow section when importing a '.tm7', and see its content imported as editable Markdown.

**Business value:** Lets a reviewer carry supporting narrative context into the imported model without retyping it.

**Boundary:**

- In scope: the '.docx'/'.txt'/'.md' extractor contract; Mammoth-in-a-Web-Worker for '.docx' (sanitize -> Turndown/GFM -> Markdown); one optional document per section, assigned in the import modal's file-selection step; the '#### Imported from <filename>' heading convention; extraction warnings and failures surfaced at import time.
- Out of scope: more than one document per section; embedded-image extraction; '.pdf'/'.xlsx' (see 'Out of Scope' and 'Deferred Enhancements').

**Acceptance criteria:**

- A user optionally assigns at most one supported document per section during import; its content is imported as editable Markdown under '#### Imported from <filename>', never silently truncated.
- A document that cannot be extracted blocks import until the user removes or replaces it; '.docx' embedded images are omitted with a warning.
- Extraction runs in a Worker with enforced input/output/time limits and is cancellable.

**Development tasks:** to be broken out when US-5 is started. Depends on US-4.

## Schema Migration Architecture (Target State)

This is the design we would build from scratch for clean, reliable versioned migrations. US-1 delivers user value now; US-3 refactors toward this target. New migration code should move toward these principles rather than perpetuate unversioned, in-place handling.

1. **One versioned envelope per document.** Persist a workspace as a single document carrying an explicit 'schemaVersion' at a known path, not as today's many unversioned per-context 'localStorage' slices. Version lives in exactly one place; detection is a field read, never structural sniffing; migration is one atomic read-modify-write instead of N racy per-slice writes.
2. **Single-step migration registry.** A registry of pure functions, each doing exactly one step 'vN' → 'vN+1', composed to walk any old version up to current. Never jump versions; single-step keeps each migration small, testable, and reviewable.
3. **Integer or semver versions, not floats.** Float versions like '1.1' are fragile to order and compare; use monotonic integers or semver so the migration loop's comparisons are unambiguous.
4. **Separate detection, migration, and validation.** Detection reads the marker; migration transforms 'vN' → 'vN+1'; validation asserts conformance to a version and rejects/quarantines rather than silently accepting. Every version's schema is a coexisting, never-overwritten artifact so older clients keep working.
5. **One migrator, all entry points.** Persistence-load, file-import, and IDE injection all call the same 'migrateToCurrent'. This removes today's asymmetry (export stamps a schema; persistence has none; import normalizes on its own path) and makes it impossible for an entry point to skip migration.
6. **Read-migrate-in-memory; persist only with consent.** On load, migrate in memory to render (non-destructive). Persist the migrated form only on explicit user consent — that is the irreversible step that makes a file unreadable to older versions — and offer a backup export first.
7. **Transactional and idempotent.** A failed migration leaves the original untouched (trivial with a single-document envelope; awkward with fragmented slices). Steps are idempotent where feasible, optionally stamping 'migratedFrom' / 'migratedAt' for observability.
8. **Testing as a contract.** Golden per-version fixtures (real, not synthetic) run through the full chain to current; import → export round-trip stability at the current version; a coverage test that every declared version resolves to current.

## Goals

The feature will provide a migration path from Microsoft TMT into a new TC workspace. The migration must prioritize the context a reviewer needs to understand the system, especially its data flow diagrams (DFDs), while preserving the existing TMT threat record.

The initial release will:

- Import a Microsoft TMT '.tm7' file entirely in the browser.
- Recreate each TMT DFD as a crisp PNG while preserving its semantic content and relative layout.
- Add general support for multiple named DFDs in a TC workspace.
- Import every TMT threat and its disposition.
- Optionally extract one supporting document into each existing TC description section: Application, Architecture, and Data Flow.
- In multi-workspace mode, create and populate a new workspace without modifying the active workspace if migration fails.
- In singleton modes, replace the singleton model only after an explicit overwrite warning and successful validation.
- Continue to store workspace data in browser 'localStorage'.

## Out of Scope for the Initial Release

- PDF import, including OCR.
- Excel '.xlsx' or legacy '.xls' import.
- Legacy Word '.doc' import.
- Supporting more than one document per TC description section.
- Repeatable or reorderable context-document fields in TC.
- Multiple Architecture diagrams.
- Diagram-to-threat linking, diagram-based threat filtering, or graphical threat highlighting.
- Converting TMT model-level assumptions into TC assumption entities.
- Generating TC mitigation or assumption entities from TMT content.
- Inferring TC threat-grammar fields from TMT threat text.
- Importing or reinterpreting TMT-specific model-validation results.
- Pixel-perfect reproduction of TMT's visual styling.
- Automated screenshot comparison as a CI correctness gate.
- Importing '.tm7' versions other than TMT model format '4.3' until representative fixtures are available.

## Source-System Findings

### Threat Composer

- TC currently imports '.tc.json' through the existing file-import modal.
- Imported data is sanitized, validated against the exchange schema, and distributed to workspace contexts.
- The current exchange format is schema '1.0'.
- Data Flow currently contains one Markdown description and one image.
- Application and Architecture each contain one Markdown description; Architecture also contains one image.
- Workspace state is persisted in per-workspace 'localStorage' keys.
- Existing import replaces the active workspace and is not transactional.
- TC entities use UUID strings for identity and numeric IDs for human-readable labels, sorting, report anchors, and cross-references. Entity links use UUIDs.
- Threat metadata already accepts arbitrary 'custom:*' entries, but the current threat UI and generated reports do not expose them.
- TC assumptions are individual, plain-text entities of at most 1,000 characters, with optional tags, metadata, and links to threats or mitigations.
- TC package manifests are generated by Projen. New dependencies must be declared in the appropriate file under 'projenrc/', followed by workspace synthesis.

### Microsoft TMT

- '.tm7' is .NET DataContractSerializer XML, not a binary or ZIP container.
- The root is 'ThreatModel' in the expected TMT model namespace.
- The supported model format version for the initial release is '4.3'.
- A model contains drawing surfaces, model metadata, notes, threat instances, validations, version information, and an embedded knowledge base.
- Drawing surfaces serialize geometry, labels, connector routes, shape types, element properties, GUIDs, and embedded stencil images.
- TMT's HTML report does not recreate diagrams from the '.tm7' by itself. The Windows WPF view generates 'SurfacePng' screenshots in memory immediately before report creation, and the report embeds those screenshots.
- PNG screenshots are not persisted in the '.tm7'; TC must render the serialized geometry itself.
- TMT uses 'Guid.NewGuid()', which produces RFC 4122 version 4 UUIDs in the same canonical 36-character text form used by TC.
- TMT threat instances contain a stable positive integer ID and a separate internal composite dictionary key.
- In '.tm7', resolved threat fields are stored in a per-instance 'Properties' dictionary. The embedded knowledge base provides type metadata and fallback title templates.
- TMT labels 'StateInformation' as 'Justification'. Real models use it for mitigations, risk acceptance, impact notes, and other rationale, so it must not be assumed to represent a selected mitigation.

## Agreed User Experience

### Entry Point and Flow

- Use TC's existing import UI structure.
- Label the new action **Import Microsoft TMT Model**.
- Do not add a separate landing-page migration experience or a multi-step wizard.
- Keep the file-selection view in the existing import modal.
- Leave existing '.tc.json' import behavior unchanged.
- The flow is:
  1. Select one required '.tm7' file.
  2. Optionally select and assign one supporting document to each of Application, Architecture, and Data Flow.
  3. Select Import to create the new workspace, then review the rendered model in the normal TC views, adjust it with the existing tools (rename/delete diagrams, edit descriptions and threats), and save.
- Blocking errors and non-blocking warnings surface at import time (see 'Error and Warning Policy'); there is no separate tabbed-Preview modal or migration draft.

### Workspace and Application Naming

- Default the workspace name to TMT 'ThreatModelName'.
- Fall back to the '.tm7' filename without its extension when 'ThreatModelName' is empty.
- Use the same default for the TC Application name.
- Allow the user to rename the workspace and Application independently after import using the normal TC controls.
- Make Microsoft TMT import available consistently in standard multi-workspace mode and singleton modes, including the browser and IDE extension hosts.
- In standard multi-workspace mode, Microsoft TMT import creates a new workspace and never replaces the active workspace.
- In singleton modes, Microsoft TMT import replaces the current singleton model after warning the user explicitly that its existing content will be overwritten.
- Retain the existing opportunity to export the current model as a backup before confirming a singleton overwrite.

### Supporting Documents

- Initial supported formats are '.docx', '.txt', and '.md'.
- A user may optionally assign at most one document to each existing TC description section:
  - Application
  - Architecture
  - Data Flow
- Extracted content is converted to Markdown and is editable after import in the normal description editors.
- Prefix extracted content in every destination with '#### Imported from <filename>', preserving the original filename. The heading remains editable with the extracted content after import.
- Documents are never silently truncated.
- A selected document that cannot be extracted blocks import until the user removes or replaces it.
- '.docx' extraction preserves semantic headings, paragraphs, lists, tables, links, and image alt text where available.
- Embedded '.docx' images are omitted and reported as import warnings.
- '.txt' is converted to escaped Markdown paragraphs.
- '.md' remains Markdown after validation and sanitization.

### Data Flow Diagrams

- Every TMT drawing surface is discovered and rendered; every non-empty surface becomes a named DFD in the imported workspace.
- Empty drawing surfaces are reported as an import warning but are not rendered or stored as DFD images.
- Every DFD must render successfully; a rendering failure (or an image exceeding the per-image limit) is a blocking error that stops the import.
- A valid TMT model with no non-empty drawing surfaces imports with a prominent warning.
- After import, the user removes any unwanted DFDs with the normal Data Flow tools (US-1); there is no pre-import selection step.

### Post-Import DFD Management

Multiple DFDs are a general TC capability, not a migration-only view. In the Data Flow section, users can:

- Select a named DFD to view at full available size.
- Add a DFD.
- Rename a DFD.
- Reorder DFDs using keyboard-accessible Move up and Move down icon actions.
- Replace a DFD image.
- Delete a DFD.

The first DFD is selected by default. The Data Flow section retains one shared Markdown description above the diagram collection. This initial enhancement applies only to Data Flow; Architecture retains its existing single image.

### Threat Import

- Import all TMT threat records, including mitigated and not-applicable threats.
- Preserve TMT's resolved threat title verbatim as the TC statement.
- Resolve a missing per-instance title using this strict fallback sequence:
  1. Use the embedded threat type's 'ShortTitle'.
  2. Resolve TMT's '{source.Name}', '{flow.Name}', and '{target.Name}' placeholders from the parsed DFD entities.
  3. Block import if the result is empty or contains unresolved placeholders.
- Do not infer TC threat source, prerequisites, action, impact, goal, or asset fields.
- Generate a new TC UUID v4 for each imported threat.
- Preserve the unique TMT integer threat ID as TC 'numericId'.
- Also retain the source number as 'custom:TMT Threat ID' for explicit traceability.
- If TMT IDs are missing or duplicated, allocate unused TC numeric IDs and show an import warning.
- Missing identity or statement content, or any other threat conversion failure, blocks import. Threats are never silently skipped.
- Missing optional threat metadata produces a warning rather than blocking import.

#### Status Mapping

| TMT state | TC status |
| --- | --- |
| 'Mitigated' | 'threatResolved' |
| 'NotApplicable' | 'threatResolvedNotUseful' |
| 'AutoGenerated' | 'threatIdentified' |
| 'Migrated' | 'threatIdentified' |
| 'NeedsInvestigation' | 'threatIdentified' |
| 'NeedsMitigation' | 'threatIdentified' |

The original TMT state is also preserved as custom metadata.

#### Metadata Mapping

- TMT priority maps to TC 'Priority' metadata.
- Always preserve the original TMT threat category as 'custom:TMT Category'.
- Map a TMT category to TC 'STRIDE' metadata only when the embedded category resolves unambiguously to 'S', 'T', 'R', 'I', 'D', or 'E'.
- Leave TC 'STRIDE' unset and show an import warning for custom or ambiguous categories.
- Preserve TMT-specific values as separate existing custom metadata entries:
  - 'custom:TMT Threat ID'
  - 'custom:TMT Description'
  - 'custom:TMT Interaction'
  - 'custom:TMT Diagram'
  - 'custom:TMT State'
  - 'custom:TMT Justification'
- Do not pack these values into Comments.
- Preserve every additional non-empty per-threat property as custom metadata:
  - Use the embedded knowledge base's display label when available.
  - Fall back to the serialized property name.
  - Store the entry as 'custom:TMT <label>' without interpreting its value.
  - If display labels collide, append the serialized property name to make each key stable and unambiguous.
- Show custom metadata on threat cards inside the existing Metadata section.
- Keep imported TMT metadata labels fixed and allow users to edit their values.
- Continue to preserve custom metadata through normal TC JSON import and export.

### TMT Model Information

Add a clearly labeled **Microsoft TMT Model Information** block to the Application description. Preserve, when present:

- Threat model name
- High-level system description
- Owner
- Reviewer
- Contributors
- Assumptions
- External dependencies
- Model notes, ordered by TMT note ID and retaining author and date

TMT's free-form assumptions remain in this block. Users may manually create individual TC assumption entities after migration if desired.

If an Application supporting document is selected, its extracted Markdown follows the TMT information under '#### Imported from <filename>'.

## TC Exchange Schema 1.1

### Data Flow Shape

Schema '1.1' replaces the single Data Flow 'image' with an ordered diagram collection:

```json
{
  "schema": 1.1,
  "dataflow": {
    "description": "...",
    "diagrams": [
      {
        "id": "d8c8aab1-5108-49c5-92a1-b214ba353477",
        "name": "Diagram 1",
        "image": "data:image/png;base64,..."
      }
    ]
  }
}
```

- Array order is display order.
- TMT-imported diagrams retain their drawing-surface GUID as 'id'.
- Manually added diagrams receive a new UUID v4.
- Each diagram has only 'id', 'name', and 'image' in the initial schema.
- The shared Data Flow description remains at 'dataflow.description'.

Code-grounded constraints (verified against TC source):

- 'DataflowInfoSchema' is currently '{ description, image }' and is declared '.strict()' in [dataflow.ts](threat-composer/packages/threat-composer/src/customTypes/dataflow.ts). Adding 'diagrams' requires an explicit schema change, and '.strict()' rejects any leftover legacy 'image' key.
- 'image' and 'description' are inherited from the shared 'BaseImageInfoSchema', which the Architecture section also uses through the shared 'BaseDiagramInfo' component. The 'diagrams' model must be Data-Flow-specific and additive so Architecture's existing single image is not regressed.

### Compatibility

- Updated TC always exports schema '1.1', regardless of DFD count.
- Updated TC accepts schema '1.0' and '1.1'.
- On schema '1.0' import, migrate 'dataflow.image' into a one-item 'dataflow.diagrams' array.
- Existing browser workspaces containing one Data Flow image receive the equivalent local-state migration.
- Models with no Data Flow image migrate to an empty diagram collection.
- Older TC releases are not expected to understand schema '1.1' multi-diagram exports.

Code-grounded implementation notes (verified against TC source):

- The schema version is a **number** ('SCHEMA_VERSION = 1.0'), enforced in three places that must all be updated to admit '1.1': the Zod constraint 'z.number().max(1)' in [dataExchange.ts](threat-composer/packages/threat-composer/src/customTypes/dataExchange.ts), '"maximum": 1' in [threat-composer-v1.schema.json](threat-composer/schemas/threat-composer-v1.schema.json), and the import guard 'parsedData.schema !== SCHEMA_VERSION' in [useExportImport/index.ts](threat-composer/packages/threat-composer/src/hooks/useExportImport/index.ts), which currently throws 'Unsupported Schema version'.
- Replace that hard-equality guard with an accept-list for '1.0' and '1.1'. There is no existing schema-version migration path today; version mismatches are rejected outright.
- Because the schemas are '.strict()', the '1.0' → '1.1' migrator must *transform* — move 'dataflow.image' into 'diagrams[0]' and remove the legacy 'image' key — not merely add a 'diagrams' field.
- Data Flow state has two providers in [DataflowContext](threat-composer/packages/threat-composer/src/contexts/DataflowContext/index.tsx): a singleton local-state provider and a per-workspace localStorage provider. The single-image → 'diagrams[0]' on-load migration must cover both.

## Technical Design

### Browser-Only Processing

All parsing, conversion, document extraction, rendering, and persistence occur in the browser. No service or external .NET converter is required, and source content is not uploaded.

### '.tm7' Parsing

- Read '.tm7' as text and reject 'DOCTYPE' declarations.
- Parse with the browser-native 'DOMParser'.
- Require well-formed XML.
- Require root 'ThreatModel' in the expected namespace.
- Require model version '4.3'.
- Require the drawing-surface and threat-instance structures needed for conversion.
- Perform namespace-aware, targeted extraction into a typed, narrow internal TMT model.
- Do not convert the entire XML tree or embedded knowledge base into a generic JavaScript object.
- Extract only model instances, required element-type metadata, required threat-type metadata, and values needed for rendering or conversion.
- Unknown or missing model versions fail with an explicit unsupported-format error.

### DFD Rendering

Use this pipeline:

```text
.tm7 drawing-surface XML
  -> typed internal DFD model
  -> SVG DOM
  -> browser rasterization
  -> cropped PNG data URL
```

- SVG is an intermediate representation only; TC stores the resulting PNG.
- Build SVG using DOM APIs and text nodes rather than interpolating untrusted XML into markup.
- Render at 2x the TMT coordinate dimensions for crisp high-DPI text and lines.
- Crop only unused outer whitespace.
- Do not automatically downscale below the fidelity target to meet size limits.
- Preserve every diagram name.
- Preserve elements, labels, flow direction, connector routes, trust boundaries, annotations, and relative placement.
- TC styling may differ from TMT styling when semantic and layout fidelity is preserved.
- Render custom elements when they use a known geometry and preserve embedded icons where available.
- Treat unknown geometry as a rendering error rather than silently substituting a generic shape.

### Image and Storage Limits

- Retain TC's existing maximum of 1,000,000 characters per image.
- An oversized crisp PNG is a blocking error that stops the import; the user reduces the source model in TMT and retries, or cancels.
- Retain 'localStorage'; do not move workspaces to IndexedDB in this project.
- Show the exact estimated incremental serialized size at import time.
- Do not claim that the migration will fit before writing. Browsers do not expose an authoritative remaining 'localStorage' capacity; 'navigator.storage.estimate()' covers broader origin storage and is not a reliable 'localStorage' preflight.
- Actual writes remain authoritative because browser quotas vary.

### Transactional Workspace Creation

The existing 'addWorkspace' followed by context-based 'importData' flow is insufficient because it registers and activates a workspace before all data is persisted.

Add a staged workspace-import operation:

1. Generate the new workspace UUID without registering or activating it.
2. Validate the schema '1.1' workspace payload.
3. Calculate and display the incremental serialized size without claiming available capacity.
4. Write all per-workspace keys using the generated UUID.
5. If every write succeeds, register and activate the new workspace.
6. On any failure, remove all keys written by the attempt and leave the active workspace unchanged.
7. Detect and report 'QuotaExceededError' explicitly.

If capacity is insufficient, block the import with an explicit error and leave the active workspace unchanged; the user reduces the source model in TMT and retries, or cancels.

Extract the per-workspace key serialization behind a small storage utility so staged import and existing context storage use the same key and value conventions.

Singleton modes use the same parser, validation, and conversion pipeline, but import replaces the singleton model rather than creating a workspace. The exact rollback mechanism for singleton replacement remains a separate design decision.

### Supporting-Document Extraction

Define one common extractor contract that returns Markdown plus warnings. Use one implementation per supported format.

```text
.docx -> Mammoth semantic HTML -> sanitize-html -> Turndown/GFM -> Markdown
.txt  -> decoded and escaped plain text -> Markdown paragraphs
.md   -> validate and sanitize -> Markdown
```

For '.docx':

- Use 'mammoth' in browser mode with 'ArrayBuffer' input.
- Disable external file access.
- Convert to semantic HTML rather than using Mammoth's deprecated Markdown output.
- Sanitize the generated HTML before further processing.
- Convert sanitized HTML with 'turndown' and its GFM plugin.
- Omit embedded images while retaining alt text where available and emit warnings.
- Treat Mammoth errors as extraction failures and surface its warnings as import warnings.

Add runtime dependencies through 'projenrc/ui-components.ts', then synthesize generated project files with Projen.

Run Mammoth conversion in a dedicated Web Worker for the initial release:

- Transfer the '.docx' 'ArrayBuffer' to the Worker.
- Enforce configurable input-size, output-size, and execution-time limits.
- Terminate the Worker on timeout or cancellation.
- Return semantic HTML and conversion warnings to the main thread.
- Sanitize the returned HTML and convert it to Markdown on the main thread.
- Complete an early Phase 0 spike to verify that Mammoth bundles and executes correctly in TC's Worker environment.

The '.tm7' parser and SVG renderer remain on the main thread because 'DOMParser' and the required DOM construction APIs are not available in Web Workers. Process one DFD at a time and yield between diagrams so progress updates and cancellation remain responsive.

### Input and Complexity Limits

Do not guess initial fixed limits before representative models are available. During Phase 0:

- Measure sanitized representative '.tm7' and '.docx' files.
- Establish documented, configurable limits for '.tm7' file size, '.docx' file size, DFD count, elements per DFD, threat count, and extracted Markdown length.
- Record the selected limits and rationale alongside acceptance-fixture metadata.
- Reject inputs exceeding a limit before the corresponding expensive processing step.
- Include boundary tests for every selected limit.

### Custom Threat Metadata UI and Reports

Code-grounded note (verified against TC source): the current [MetadataEditor](threat-composer/packages/threat-composer/src/components/threats/MetadataEditor/index.tsx) renders only the hardcoded 'Priority', 'STRIDE', and 'Comments' keys, and the Markdown threat table emits only those same keys. Arbitrary 'custom:*' entries are persisted through import and export but have no display or edit UI today, so the work below is net-new generic rendering, not a small extension.

- Extend the existing threat Metadata section to list all 'custom:*' metadata as labeled values.
- Strip the 'custom:' prefix from display labels.
- Keep labels fixed and make values editable.
- Support long-form values without forcing them into the existing 1,000-character Comments field.
- Render values safely as Markdown or plain text according to the existing TC content-safety conventions.

Tentative report layout:

- Keep the existing threat summary table compact.
- Add an **Additional Threat Metadata** section after the table.
- Group entries by TC threat number and render each 'custom:*' value under its label.
- Validate this presentation against a real imported model before treating the layout as final.

### TC Reports

Update the existing on-screen threat-model report and Markdown, Word, and printable/PDF exports:

- Include every DFD retained in the workspace.
- Preserve collection order.
- Render each DFD under its diagram name.
- Include the shared Data Flow description once.
- Include the tentative Additional Threat Metadata section described above.

This is separate from Microsoft TMT's HTML report, which is used only as a visual reference for DFD acceptance review.

## Error and Warning Policy

### Blocking Errors

- Malformed XML.
- A 'DOCTYPE' declaration.
- Unexpected root element or namespace.
- Missing or unsupported TMT version.
- Missing required model structures.
- Any non-empty DFD that cannot be rendered.
- Any DFD that exceeds the per-image limit.
- Any threat that cannot be converted without losing identity or statement content.
- Any assigned supporting document that cannot be extracted.
- Any schema '1.1' validation failure.
- Any workspace persistence failure, including 'QuotaExceededError'.

### Non-Blocking Warnings

- Missing optional TMT metadata.
- Missing or duplicate TMT numeric threat IDs that were reassigned.
- Custom or ambiguous TMT categories that could not be mapped to TC STRIDE metadata.
- Omitted embedded images in a Word document.
- Document-conversion warnings that do not prevent usable Markdown output.
- Empty drawing surfaces that were not imported as diagrams.
- Imported threats whose source drawing surface was empty and produced no diagram.
- TMT content with no direct TC equivalent that was preserved in custom metadata or the TMT information block.

No in-scope source content is silently omitted, truncated, inferred, or reclassified. TMT-specific model-validation results are an explicit product-level exclusion and are not imported.

## Delivery Phases

### Phase 0: Acceptance Fixtures and Baseline

- Create sanitized representative '.tm7' fixtures.
- Generate matching reference PNGs through Microsoft TMT's HTML report process.
- Include a small model for every supported geometry and a production-like multi-DFD model.
- Verify and record the baseline 'pdk build' and 'pdk test' results.
- Confirm fixture licensing and remove sensitive information before committing.
- Measure representative input sizes and model complexity, then select and document the initial configurable limits.
- Verify Mammoth '.docx' conversion in a dedicated Worker, including timeout, cancellation, and output-size enforcement.

### Phase 1: Schema 1.1 and General Multi-DFD Support

- Add the DFD entity and 'dataflow.diagrams' schema.
- Change the exchange version to '1.1'.
- Migrate schema '1.0' imports.
- Migrate existing local browser workspaces.
- Add named DFD selection and add/rename/reorder/replace/delete operations.
- Update TC reports and all export formats for multiple DFDs.
- Add schema, migration, context, UI, and report tests.

### Phase 2: '.tm7' Parser and DFD Renderer

- Add format validation and targeted XML parsing.
- Define the narrow internal TMT model.
- Parse drawing surfaces, elements, connectors, boundaries, annotations, and required knowledge-base lookups.
- Build namespace-safe SVG rendering.
- Rasterize at 2x and crop unused whitespace.
- Enforce per-diagram and per-image validation.
- Add structural renderer tests and browser PNG smoke checks.
- Perform human side-by-side review against TMT-generated reference PNGs.

### Phase 3: Threat Conversion and Custom Metadata

- Parse every threat instance and required threat-type lookup.
- Preserve numeric IDs and generate TC UUIDs.
- Implement status, priority, category/STRIDE, statement, fixed custom metadata, and arbitrary custom-property mappings.
- Add editable custom metadata values to threat cards.
- Add the tentative custom metadata report section.
- Add mapping, missing-field, duplicate-ID, and failure-policy tests.

### Phase 4: Supporting Documents and Import Action

- Add the '.docx', '.txt', and '.md' extractor contract and implementations.
- Add dependencies through Projen configuration.
- Extend the existing import UI with **Import Microsoft TMT Model**.
- Keep file selection in the existing import modal.
- Add optional one-document assignment for Application, Architecture, and Data Flow.
- Surface blocking errors and non-blocking warnings at import time.
- Validate that a failed or cancelled import does not change workspace state.

### Phase 5: Transactional Persistence and Integration

- Add shared per-workspace serialization utilities.
- Add staged workspace writing and rollback.
- Add storage preflight and 'QuotaExceededError' handling.
- On capacity failure, roll back cleanly and report an explicit error.
- Run focused tests after each task, then the full TC build and test suite.
- Complete human acceptance review on representative models and document results.

## Test Strategy

### Automated Tests

- Parser unit tests for valid, malformed, malicious, incomplete, and unsupported-version XML.
- Structural tests for every supported DFD element and connector type.
- SVG assertions for geometry, coordinates, labels, ordering, paths, markers, and boundaries.
- Browser tests confirming PNG generation, expected dimensions, nonblank output, and label presence.
- Threat-mapping tests for every state, priority, STRIDE category, metadata field, and ID edge case.
- Schema '1.0' to '1.1' import and local-state migration tests.
- Multi-DFD CRUD, ordering, selection, and export tests.
- Supporting-document success, warning, sanitization, and failure tests.
- Transactional persistence tests, including injected write failures and 'QuotaExceededError' rollback.
- Existing '.tc.json' import regression tests.

### Human Acceptance Review

Human review is required for visual fidelity. For each representative model:

1. Generate reference DFD PNGs using Microsoft TMT's report workflow.
2. Import the same '.tm7' into TC.
3. Compare each DFD side by side for elements, labels, routes, arrow direction, trust boundaries, annotations, relative placement, clipping, and readability.
4. Record discrepancies and resolve all semantic or readability failures.

Automated screenshot/pixel snapshots are not initial CI correctness gates because browser, OS, font, and antialiasing differences make them brittle. Structural tests are the primary automated renderer contract.

## Deferred Enhancements

- PDF text-layer extraction.
- OCR for scanned PDFs.
- '.xlsx' extraction with visible, non-empty sheets converted to Markdown tables.
- Multiple supporting documents per section.
- Repeatable named context fields.
- Multiple Architecture diagrams.
- Diagram-to-threat relationships and filtering.
- Optional SVG storage if TC later supports a safe vector-image model.
- IndexedDB or another higher-capacity workspace store if user demand justifies a storage migration.
- Additional '.tm7' model versions after fixtures and compatibility analysis are available.

## Remaining Design Questions

The following presentation detail remains open for later review:

- Final custom metadata presentation in threat cards and reports after testing with a real imported model.
- Transaction and rollback mechanics when replacing an existing model in singleton modes.

Exact numeric input-size, complexity, and Worker timeout limits will be selected from Phase 0 measurements rather than treated as unresolved architecture decisions.
