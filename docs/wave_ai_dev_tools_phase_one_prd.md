# Wave AI Dev Tools — Phase 1 PRD

## Status
Draft — Phase 1 (Hypothesis Validation)

---

## 1) Purpose & Hypothesis

### Hypothesis
A chat-driven developer tool that combines:

1. **UX Control Plane** (chat + safe iteration primitives: run/undo/redo/diffs/apply + workspace switching + preview refresh)
2. **Workflow Execution Plane** (Wave workflow executor + orchestrator + artifacts + delegation to Cursor/Claude/Codex CLI)

…enables faster and more confident end-to-end development than using Cursor IDE alone — even if UX polish is incomplete (page refreshes, minimal UI).

### Phase-1 goal
Validate the hypothesis with the smallest feature set that can support real work.

---

## 2) Product Framing: Two Planes

### 2.1 UX Control Plane (Experience Layer)
**Purpose:** Make AI-driven development safe, fast, low-friction.

**Includes:**
- Chat UI (primary control surface)
- Inline context tokens in the message body (e.g., `[[Button.tsx:42]]`)
- Minimal chat switching (tabs/list)
- Run / Undo / Redo / Diff / Apply controls
- Preview refresh when code state changes (via iframe reload or full page reload)

**Answers:** “Is it pleasant and safe enough that I want to use it?”

### 2.2 Workflow Execution Plane (Core Value & Differentiation)
**Purpose:** Turn natural language intent into structured changes using Wave workflows.

**Includes:**
- Deterministic Orchestrator v0 (state machine; no “autonomous agent soup”)
- Workflows (PM, Eng Lead, UI, Business, Integration, Page) executed as steps
- Artifact generation in-repo (`prd.md`, `tdd.md`, `plan.md`, progress docs)
- Delegation to code-modifying agents via CLI tools (Cursor agent CLI or equivalents)

**Answers:** “Does it reliably produce good software output and preserve structure?”

---

## 3) Target User (Phase 1)
- Single developer working locally
- Comfortable running dev servers
- Wants faster iteration and less fear of AI changes

**Not in Phase 1:**
- Multi-user collaboration
- Remote/staging attach
- PM/QA/Design users directly using the tool

---

## 4) Scope (Phase 1)

### 4.1 In scope (Must-have)
- Local Dev Tools web UI (shell)
- App preview (iframe preferred; full refresh acceptable)
- Chat sessions
- **Lazy workspace creation**: branch/worktree created only on first code-changing run in a new chat
- Dev server restart only when necessary (see section 6)
- Context attachment via UI element resolver (already implemented)
- Orchestrator v0 (deterministic step selection)
- Agent runner delegation (Cursor/Claude/Codex CLI)
- One run = one commit
- Undo / Redo semantics
- Diffs:
  - diff vs base branch
  - diff per commit
- Apply changes to base branch
- Artifact storage per chat: one PRD/TDD/Plan max (optional/lazy)

### 4.2 Out of scope (Hard)
- Proxy injection / bridge script injection into arbitrary apps
- Framework-specific plugins or React DevTools introspection
- Browser-based IDE/editor
- Multi-user chat/collaboration
- Remote/staging environment attachment
- Full design system catalog UI
- Strict test enforcement (tests can be suggested in plan only)

---

## 5) Common Jobs-To-Be-Done (JTBD)

### JTBD-1 (Fix)
When I see a UI or behavior issue in the running app, I want to click the relevant element(s), describe the fix in plain language, and have the agent apply scoped changes that I can undo safely, so I can iterate quickly without fear.

### JTBD-2 (Build / Prototype-first)
When I want to build new functionality, I want the system to help me arrive at a runnable prototype quickly (without requiring PRD/TDD first), and later formalize the work into PRD/TDD/plan when I decide it’s worth hardening.

### JTBD-3 (Trust via time travel)
When an agent makes changes I don’t like, I want to undo them cleanly and try a different approach, so AI exploration is safe.

---

## 6) Core UX Use Cases (UCs) & Acceptance Criteria

### UC-1: Start tool and see app
**Flow:**
1. User runs a single command to start Dev Tools for a repo.
2. Dev Tools UI opens.
3. App is visible and usable in a preview pane (iframe preferred).

**Acceptance:**
- No code changes required in the app under development.
- If repo config missing, Dev Tools asks for dev command and writes `.wave-devtools.json`.
- App loads successfully.

**Example CLI:**
- Single line: `wave-devtools start --repo /path/to/repo`

---

### UC-2: Create a new chat (no workspace yet)
**Flow:**
1. User clicks “New Chat”.
2. New chat appears instantly.

**Rules:**
- Do not create a branch/worktree yet.
- Do not restart dev server.

**Acceptance:**
- Chat appears instantly.
- Preview does not reload.

---

### UC-3: First Run in a new chat creates workspace (lazy isolation)
**Flow:**
1. User writes a message and clicks Run.
2. If this run will modify code, the system creates a branch/worktree for that chat.
3. Dev server restarts into the new workspace (only at this moment).
4. Agent applies changes and one commit is created.

**Acceptance:**
- First code-changing run creates:
  - branch/worktree
  - a commit
- Chat becomes **dirty**.
- Preview updates to reflect changes.

---

### UC-4: Switch chats efficiently (restart only when needed)
**Definitions:**
- Clean chat: no tool commits / no workspace yet
- Dirty chat: has tool commits and a worktree

**Rules on switch:**
- Switch to clean chat:
  - If currently in base view already: no restart
  - If currently in dirty workspace: restart to base so preview matches selected clean chat
- Switch to dirty chat:
  - Restart dev server into that chat’s worktree

**Acceptance:**
- Preview always matches the selected chat’s code state.
- No restart unless filesystem state must change.

---

### UC-5: Insert UI context tokens in message body
**Flow:**
1. User selects a UI element (how selection happens is implementation detail; resolver input must be obtainable).
2. Resolver returns `{file, line}` (and confidence).
3. UI inserts an inline token into the composer at cursor:
   - `[[Button.tsx:42]]`

**Acceptance:**
- Token inserts at cursor position.
- User can type around tokens naturally.
- Message payload includes a `ctxMap` mapping token IDs to `{file, line, confidence}`.

---

### UC-6: Run workflow via chat (one run = one commit)
**Flow:**
1. User chooses mode: Fix or Build.
2. User writes request (with optional tokens).
3. User clicks Run.
4. Orchestrator selects exactly one step and executes it.
5. Agent modifies files via CLI.
6. System commits changes.

**Acceptance:**
- File changes are made in the correct workspace.
- Exactly one commit per run.
- Minimal run status is shown: Running → Done/Failed.

---

### UC-7: Undo / Redo / Apply (trust primitives)

#### Undo
**Behavior:**
- Rewind workspace to state before last run (time-travel; no “revert commit card”).
- Remove last run artifact from UI (as if it never happened).
- Refresh preview.

**Acceptance:**
- Changes disappear from filesystem.
- Preview reflects old state.

#### Redo
**Behavior:**
- Restores last undone message as a draft (does not change code).
- User must click Run.
- If draft unchanged and workspace at expected base commit:
  - replay the old commit
- Else:
  - perform a new run

**Acceptance:**
- Redo never changes code until Run.
- Unchanged requests can be replayed deterministically.

#### Apply
**Behavior:**
- Merge the chat branch/workspace state into the base branch.

**Acceptance:**
- Base branch receives the full set of chat changes.
- If conflicts occur, surface them clearly (minimal UX acceptable).

---

## 7) Artifacts (One set per chat, lazy)

Each chat stores artifacts in repo:

- `.wave/sessions/<chatId>/state.json`
- `.wave/sessions/<chatId>/messages.jsonl`
- `.wave/sessions/<chatId>/prd.md` (optional)
- `.wave/sessions/<chatId>/tdd.md` (optional)
- `.wave/sessions/<chatId>/plan.md` (optional)
- `.wave/sessions/<chatId>/progress/*.md` (optional)

**Rules:**
- At most one PRD/TDD/plan per chat.
- Artifacts are created only when requested or required by orchestration.
- Other chats can reference any artifact by file path token.

---

## 8) Workflow Execution Plane — Orchestrator v0

### 8.1 Design principle
Orchestrator v0 is a deterministic state machine:
- LLMs generate content (docs/plans), not control flow.
- Routing is decided by explicit rules using mode + state.json + artifact existence.

### 8.2 Step types (enum)
- `UI_FIX`
- `PROTOTYPE_UI`
- `GENERATE_PRD`
- `GENERATE_TDD`
- `GENERATE_PLAN`
- `EXEC_PLAN_STEP`

### 8.3 Deterministic routing rules

**If mode == Fix**
- Step = `UI_FIX`

**If mode == Build**
- If `state.skipDocsForNow == true`:
  - If no prototype marker yet → `PROTOTYPE_UI`
  - Else if user asks to formalize → `GENERATE_PRD`
  - Else → `PROTOTYPE_UI`
- Else (doc-first):
  - If `prd.md` missing → `GENERATE_PRD`
  - Else if `tdd.md` missing → `GENERATE_TDD`
  - Else if `plan.md` missing → `GENERATE_PLAN`
  - Else → `EXEC_PLAN_STEP`

### 8.4 Prototype-first workflow requirement
Default user experience should allow:
- build a runnable UI prototype immediately
- later generate PRD/TDD/plan referencing existing implementation

---

## 9) Artifact responsibilities

### PRD (`prd.md`)
Must include:
- Goals
- UX flows / use cases
- Acceptance criteria
- Out of scope

### TDD (`tdd.md`)
Must include:
- Architecture
- Mapping of UX flows → components/APIs/git semantics
- Risks and mitigations
- Test plan outline

### Plan (`plan.md`)
Must include:
- Incremental milestones in dependency order
- Midway verification points
- Tests per milestone (at least smoke tests)

---

## 10) State & Messages Storage (debuggable execution memory)

### state.json (single source of truth)
Must store at least:
- `dirty` (boolean)
- `modePreference` and `skipDocsForNow`
- artifact paths
- run history: commit + requestHash + stepType + status
- `lastPath` (optional in Phase-1)

### messages.jsonl (append-only)
Must store structured events for:
- user messages (mode, text, ctxMap)
- run start/end (status, commit, requestHash)
- undo/redo events

---

## 11) Diff Requirements

### Diff vs base branch
Must be available any time a chat is dirty.

### Diff per commit
Must be available for each run commit.

**Acceptance:**
- User can inspect “what changed overall” and “what changed in this run”.

---

## 12) Phase-1 Success Criteria

Phase-1 is successful if:
- The tool is faster than Cursor IDE for at least one real workflow (fix or prototype-first build).
- Undo/redo makes experimentation feel safe.
- Context tokens save measurable time vs manual file hunting.
- Orchestrator v0 produces predictable progress (even if minimal).

If these aren’t true, stop and adjust before adding scope.

---

## 13) Guiding Rule
If a feature does not help validate the Phase-1 hypothesis, it is not part of Phase 1.
