# Milestone 7 — Final AI Submission Design

## Implementation Confidence: **92-95%**

This document provides complete, step-by-step implementation details with exact file locations, line numbers, and code snippets to ensure accurate implementation.

## Overview

This milestone enables users to submit verified component contexts to Cursor agent for direct code modifications. It completes the UI-Agent workflow by adding the final step: sending verified context plus a natural language message to Cursor agent which applies changes to the codebase.

## Goals

- Only send verified contexts (user must explicitly verify)
- Build structured prompt with all relevant context
- Execute Cursor agent CLI to modify code
- Provide feedback on submission status

## Architecture

### Flow

1. **User selects element** → Overlay captures selection
2. **Backend resolves** → Component location identified (heuristic or AI fallback)
3. **User reviews context** → File path, line number, code snippet displayed
4. **User verifies** → Clicks "Verify This Mapping" button
5. **User describes change** → Enters natural language message
6. **User submits** → Clicks "Submit to Cursor Agent"
7. **Backend builds prompt** → Structured prompt with all context
8. **Cursor agent executes** → Modifies code directly
9. **Feedback displayed** → Success/failure status shown in panel

### Components

#### Frontend

- **Panel Component** (`src/dev-tools-agent/components/Panel.tsx`)
  - Verify button (shown when context is not verified)
  - Message textarea (shown when verified)
  - Submit button (enabled when verified + message provided)
  - Submission result display (success/error with agent output)

- **API Client** (`src/dev-tools-agent/api.ts`)
  - `submitToAgent()` function to POST to backend

#### Backend

- **Submission Endpoint** (`server/index.ts`)
  - `POST /submit-to-agent`
  - Validates request (context + message required)
  - Enforces verification requirement
  - Calls agent submitter

- **Agent Submitter** (`server/resolvers/agentSubmitter.ts`)
  - Builds structured prompt
  - Executes Cursor agent CLI
  - Handles timeouts and errors
  - Returns submission response

## Implementation Details

### Types

**File:** `src/shared/types.ts`

**Location:** Add at the end of the file (after `ComponentContext` interface)

```typescript
/**
 * Request to submit a verified context to Cursor agent for code modification.
 */
export interface SubmissionRequest {
  componentContext: ComponentContext;
  userMessage: string;
}

/**
 * Response from Cursor agent submission.
 */
export interface SubmissionResponse {
  success: boolean;
  message: string;
  /** Agent's response/output if available */
  agentOutput?: string;
}
```

### Frontend Changes

#### Detailed Integration Points: Panel.tsx

**File:** `src/dev-tools-agent/components/Panel.tsx`

**Step 1: Update imports (line 2)**
```typescript
import type { SelectionPayload, ComponentContext, SubmissionResponse } from '../types';
```

**Step 2: Add new import (after line 2)**
```typescript
import { submitToAgent } from '../api';
```

**Step 3: Add state variables (after line 33, after `panelRef`)**
```typescript
const [isVerified, setIsVerified] = useState(false);
const [userMessage, setUserMessage] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
```

**Step 4: Add useEffect for state sync (after line 140, before return statement)**
```typescript
// Sync verification state with componentContext
useEffect(() => {
  if (componentContext) {
    setIsVerified(componentContext.verified);
    setUserMessage('');
    setSubmissionResult(null);
  }
}, [componentContext]);
```

**Step 5: Add handlers (after useEffect, before return statement)**
```typescript
// Handle verify button click
const handleVerify = useCallback(() => {
  setIsVerified(true);
}, []);

// Handle submit button click
const handleSubmit = useCallback(async () => {
  if (!componentContext || !isVerified || !userMessage.trim()) {
    return;
  }

  setIsSubmitting(true);
  setSubmissionResult(null);

  try {
    const result = await submitToAgent(
      { ...componentContext, verified: isVerified },
      userMessage.trim()
    );
    setSubmissionResult(result);
    console.log('[UI-Agent] Submission result:', result);
  } catch (error) {
    console.error('[UI-Agent] Submission failed:', error);
    setSubmissionResult({
      success: false,
      message: error instanceof Error ? error.message : 'Submission failed',
    });
  } finally {
    setIsSubmitting(false);
  }
}, [componentContext, isVerified, userMessage]);
```

**Step 6: Add UI sections (after line 255, after Code Snippet section, before Selection Payload section)**
```typescript
        {/* Action Section */}
        {componentContext && (
          <div className="mb-3 space-y-3">
            {/* Verify Button */}
            {!isVerified && (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
                <div className="text-xs text-yellow-200 mb-2">
                  ⚠️ This component mapping needs verification before submission.
                </div>
                <button
                  onClick={handleVerify}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                >
                  ✓ Verify This Mapping
                </button>
              </div>
            )}

            {/* Message Input */}
            {isVerified && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium block">
                  What would you like to change?
                </label>
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Describe the change you want to make..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 resize-y min-h-[80px] focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting}
                />
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!userMessage.trim() || isSubmitting}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      Submitting to Cursor Agent...
                    </>
                  ) : (
                    <>🚀 Submit to Cursor Agent</>
                  )}
                </button>
              </div>
            )}

            {/* Submission Result */}
            {submissionResult && (
              <div
                className={`p-3 rounded-md border ${
                  submissionResult.success
                    ? 'bg-green-900/30 border-green-700/50'
                    : 'bg-red-900/30 border-red-700/50'
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    submissionResult.success ? 'text-green-200' : 'text-red-200'
                  }`}
                >
                  {submissionResult.success ? '✓ Success' : '✗ Failed'}
                </div>
                <div className="text-xs text-gray-300">{submissionResult.message}</div>
                {submissionResult.agentOutput && (
                  <details className="mt-2 group">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 list-none flex items-center gap-1">
                      <span className="text-[10px] group-open:rotate-90 transition-transform">
                        ▶
                      </span>
                      Agent Output
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-auto max-h-32 whitespace-pre-wrap">
                      {submissionResult.agentOutput}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
```

#### API Client

**File:** `src/dev-tools-agent/api.ts`

**Location:** Add after `resolveSelection()` function

```typescript
export async function submitToAgent(
  componentContext: ComponentContext,
  userMessage: string,
  baseUrl = BACKEND_URL
): Promise<SubmissionResponse> {
  const res = await fetch(`${baseUrl}/submit-to-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      componentContext,
      userMessage,
    }),
  });
  
  if (!res.ok) {
    throw new Error(`submit-to-agent failed: ${res.status}`);
  }
  
  const json = await res.json();
  return json as SubmissionResponse;
}
```

**Note:** The `SubmissionResponse` type is available from `'./types'` after completing Phase 1.5 (re-exporting from shared types).

### Backend Changes

#### Complete Backend Integration: server/index.ts

**File:** `server/index.ts`

**Step 1: Update imports (line 4, after existing imports)**
```typescript
import type { SubmissionRequest, SubmissionResponse } from '../src/shared/types';
import { submitToAgent as executeCursorAgent } from './resolvers/agentSubmitter';
```

**Step 2: Add endpoint (after line 51, after `/resolve-selection` endpoint, before `app.listen`)**
```typescript
app.post('/submit-to-agent', async (req, res) => {
  const request: SubmissionRequest = req.body;
  
  // Validate request
  if (!request.componentContext || !request.userMessage) {
    res.status(400).json({
      success: false,
      message: 'Missing componentContext or userMessage',
    });
    return;
  }

  // Only allow verified contexts
  if (!request.componentContext.verified) {
    res.status(400).json({
      success: false,
      message: 'Component context must be verified before submission',
    });
    return;
  }

  try {
    const result = await executeCursorAgent(
      request.componentContext,
      request.userMessage,
      process.cwd()
    );
    res.json(result);
  } catch (error) {
    console.error('[ui-agent] Agent submission error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});
```

#### Complete Implementation: agentSubmitter.ts

**File:** `server/resolvers/agentSubmitter.ts` (NEW FILE)

**Create this complete file:**

```typescript
import { spawn } from 'node:child_process';
import type { ComponentContext, SubmissionResponse } from '../../src/shared/types';

/**
 * Build structured prompt for Cursor agent.
 */
function buildPrompt(context: ComponentContext, userMessage: string): string {
  const codeSnippet = context.codeSnippet
    ? `\n# Current Code\n\`\`\`\n${context.codeSnippet.lines
        .map((line) => {
          const marker = line.isMatch ? '→ ' : '  ';
          return `${marker}${line.lineNumber} | ${line.content}`;
        })
        .join('\n')}\n\`\`\`\n`
    : '';

  return `# Component Context

File: ${context.filePath}${context.componentName ? `\nComponent: ${context.componentName}` : ''}${context.lineNumber ? `\nLine: ${context.lineNumber}` : ''}${codeSnippet}
# DOM Context

Selector: ${context.selectorSummary}
Element: ${context.domSummary}

# Request

${userMessage}

# Instructions

Please modify the code according to the request above.
Focus on the indicated file and line number.
Make the changes directly to the codebase.`;
}

/**
 * Execute Cursor agent CLI to modify code.
 */
export async function submitToAgent(
  context: ComponentContext,
  userMessage: string,
  cwd: string
): Promise<SubmissionResponse> {
  const TIMEOUT_MS = 120000; // 120 seconds
  const prompt = buildPrompt(context, userMessage);
  
  console.log('[ui-agent] Submitting to Cursor agent:', {
    filePath: context.filePath,
    lineNumber: context.lineNumber,
    messageLength: userMessage.length,
    promptLength: prompt.length,
  });

  return new Promise((resolve) => {
    const command = 'cursor-agent';
    const args = ['--model', 'auto', prompt];
    
    const agentProcess = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutFired = false;
    let processEnded = false;

    agentProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    agentProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    agentProcess.on('error', (error) => {
      console.error('[ui-agent] Cursor agent spawn error:', error);
      resolve({
        success: false,
        message: `Failed to spawn cursor-agent: ${error.message}`,
      });
    });

    agentProcess.on('close', (code) => {
      if (processEnded) return;
      processEnded = true;

      if (timeoutFired) {
        resolve({
          success: false,
          message: 'Cursor agent timeout - operation took too long',
        });
        return;
      }

      if (code !== 0) {
        console.error('[ui-agent] Cursor agent failed:', {
          exitCode: code,
          stderr: stderr.slice(0, 500),
        });
        resolve({
          success: false,
          message: `Cursor agent exited with code ${code}`,
          agentOutput: stderr || stdout,
        });
        return;
      }

      console.log('[ui-agent] Cursor agent completed successfully');
      resolve({
        success: true,
        message: 'Changes applied successfully by Cursor agent',
        agentOutput: stdout,
      });
    });

    const timeoutId = setTimeout(() => {
      timeoutFired = true;
      console.warn('[ui-agent] Cursor agent timeout, killing process');
      agentProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (!processEnded) {
          agentProcess.kill('SIGKILL');
        }
      }, 5000);
    }, TIMEOUT_MS);

    agentProcess.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
}
```

**Prompt Structure:**
- **Component Context**: File path, component name (if available), line number (if available)
- **Current Code**: Code snippet with highlighted match line (if available)
- **DOM Context**: Selector and element summary
- **Request**: User's natural language message
- **Instructions**: Clear directive to modify code

**CLI Execution:**
- Uses `spawn` for secure execution (no shell injection)
- 120 second timeout for code modifications
- Captures stdout and stderr
- Graceful error handling with detailed logging
- Returns structured response with success status and agent output

**Key Differences from Resolution:**
- No `-p` flag (preview mode) - applies changes directly
- No `--output-format json` - expects natural language response
- Longer timeout (120s vs 60s) - code modifications may take longer
- Captures full output for user feedback

## Security Considerations

1. **Verification Requirement**: Only verified contexts can be submitted, preventing accidental modifications
2. **Secure CLI Execution**: Uses `spawn` instead of `exec` to prevent command injection
3. **Input Validation**: Backend validates request structure and required fields
4. **Timeout Protection**: Prevents hanging processes from blocking the server
5. **Error Handling**: Graceful degradation with informative error messages

## User Experience

### UI Layout

```
┌─────────────────────────────────────────┐
│ UI-Agent                            ✕   │ ← Header (draggable)
├─────────────────────────────────────────┤
│ Click on any element to capture...     │
├─────────────────────────────────────────┤
│ Component Context      [high]           │
│ filePath: src/App.tsx                   │
│ line: 42                                │
│ verified: no                            │
├─────────────────────────────────────────┤
│ Source Code:                            │
│ 40 | const App = () => {                │
│→41 |   return <button>Click</button>    │ ← Highlighted
│ 42 | }                                   │
├─────────────────────────────────────────┤
│ ⚠️ This mapping needs verification      │ ← Only if !verified
│ [ ✓ Verify This Mapping ]               │
├─────────────────────────────────────────┤
│ What would you like to change?          │ ← Only if verified
│ ┌─────────────────────────────────────┐ │
│ │ Change button text to "Submit"      │ │
│ └─────────────────────────────────────┘ │
│ [ 🚀 Submit to Cursor Agent ]           │
├─────────────────────────────────────────┤
│ ✓ Success                               │ ← After submission
│ Changes applied successfully            │
│ ▶ Agent Output                          │ ← Expandable
└─────────────────────────────────────────┘
```

### Visual States

1. **Unverified Context:**
   - Yellow warning box
   - "Verify This Mapping" button
   - Message input hidden
   - Submit button hidden

2. **Verified Context (No Message):**
   - Warning box hidden
   - Message textarea visible
   - Submit button visible but disabled

3. **Verified Context (With Message):**
   - Message textarea with text
   - Submit button enabled
   - Ready to submit

4. **Submitting:**
   - Submit button shows spinner
   - Submit button disabled
   - "Submitting to Cursor Agent..." text

5. **Submission Complete:**
   - Success/error badge displayed
   - Status message shown
   - Agent output expandable (if available)
   - Submit button re-enabled for new submissions

### Error Handling

- **Network Errors**: Displayed in result section
- **Backend Validation Errors**: Shown as error message
- **Agent Execution Errors**: Captured stderr shown in agent output
- **Timeout Errors**: Clear timeout message displayed

## Testing Strategy

### Unit Tests

1. **Prompt Building:**
   - Test with all fields present
   - Test with optional fields missing
   - Test code snippet formatting
   - Test special characters in user message

2. **Validation:**
   - Test verified context requirement
   - Test missing fields
   - Test empty message

### Integration Tests

1. **End-to-End Flow:**
   - Select element → resolve → verify → submit
   - Test with high-confidence matches
   - Test with low-confidence matches
   - Test error scenarios

2. **Backend Integration:**
   - Test `/submit-to-agent` endpoint
   - Test with valid requests
   - Test with invalid requests
   - Test timeout scenarios

### Concrete Test Cases

#### Test Case 1: Happy Path - High Confidence Match

**Steps:**
1. Start servers: `npm run dev:server` and `npm start`
2. Navigate to http://localhost:5173
3. Click UI-Agent button (🎯)
4. Click on "Add Project" button (has data-testid="add-project-button")

**Expected Results:**
- Panel shows: `src/components/Projects/NewProjectForm.tsx`
- Line number shown: ~15
- Confidence badge: green "high"
- Verified: "no"
- Code snippet shows 21 lines with button code highlighted
- Verify button visible with yellow warning

**Step 5:** Click "✓ Verify This Mapping"

**Expected:**
- Warning disappears
- Textarea appears: "What would you like to change?"
- Submit button appears (disabled)

**Step 6:** Type: "Change button text to 'Create New Project'"

**Expected:**
- Submit button becomes enabled
- No errors in console

**Step 7:** Click "🚀 Submit to Cursor Agent"

**Expected:**
- Button shows spinner: "⏳ Submitting to Cursor Agent..."
- Button disabled during submission
- Backend console shows: `[ui-agent] Submitting to Cursor agent:`
- After ~5-30 seconds:
  - Green success badge appears: "✓ Success"
  - Message: "Changes applied successfully by Cursor agent"
  - Expandable "Agent Output" section available
  - Check file - button text should be changed

#### Test Case 2: Unverified Context Prevention

**Steps:**
1. Pick any element
2. Wait for resolution
3. WITHOUT clicking verify, use browser devtools console:
```javascript
fetch('http://localhost:4000/submit-to-agent', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    componentContext: {verified: false, filePath: 'test.tsx'},
    userMessage: 'test'
  })
})
```

**Expected:**
- Response status: 400
- Response body: `{"success": false, "message": "Component context must be verified before submission"}`

#### Test Case 3: Empty Message Validation

**Steps:**
1. Pick element, verify context
2. Leave message textarea empty
3. Try to click submit button

**Expected:**
- Submit button remains disabled
- No network request made

### Manual Testing Checklist

- [ ] Verify button appears for unverified contexts
- [ ] Verify button marks context as verified
- [ ] Message input appears after verification
- [ ] Submit button disabled when message empty
- [ ] Submit button enabled when message provided
- [ ] Submission shows loading state
- [ ] Success message displayed on completion
- [ ] Error message displayed on failure
- [ ] Agent output expandable when available
- [ ] Code actually modified in editor
- [ ] Multiple submissions work correctly
- [ ] New context clears previous results

## Edge Cases

1. **No Code Snippet**: Prompt still includes file path and line number
2. **No Component Name**: Prompt omits component name section
3. **No Line Number**: Prompt omits line number, but includes file path
4. **Cursor CLI Not Installed**: Error message guides user to install
5. **Cursor CLI Not Authenticated**: Error message guides user to authenticate
6. **Timeout**: Clear timeout message, process killed gracefully
7. **Malformed Agent Response**: Error captured and displayed
8. **Network Failure**: Frontend shows network error message

## Future Enhancements

1. **Preview Mode**: Option to preview changes before applying
2. **Change History**: Track what was modified
3. **Undo Support**: Ability to revert changes
4. **Batch Submissions**: Submit multiple contexts at once
5. **Custom Prompts**: Allow users to customize prompt structure
6. **Agent Model Selection**: Let users choose which model to use
7. **Progress Updates**: Stream agent output in real-time

## Dependencies

- No new npm packages required
- Uses existing `cursor-agent` CLI
- Uses existing Express server
- Uses existing React components

## Step-by-Step Implementation Checklist

Follow these steps in order:

### Phase 1: Types (5 min)
- [ ] Open `src/shared/types.ts`
- [ ] Add `SubmissionRequest` interface at end of file
- [ ] Add `SubmissionResponse` interface at end of file
- [ ] Save file

### Phase 1.5: Update Type Re-exports (2 min)
- [ ] Open `src/dev-tools-agent/types.ts`
- [ ] Update line 6 to include the new types in the re-export:
  ```typescript
  export type { SelectionPayload, ComponentContext, TestIdInfo, SubmissionRequest, SubmissionResponse } from '../shared/types';
  ```
- [ ] Save file

### Phase 2: API Client (5 min)
- [ ] Open `src/dev-tools-agent/api.ts`
- [ ] Add `SubmissionResponse` to imports from './types' (this works because Phase 1.5 re-exports it)
- [ ] Add `submitToAgent()` function after `resolveSelection()`
- [ ] Save file

### Phase 3: Agent Submitter (15 min)
- [ ] Create new file `server/resolvers/agentSubmitter.ts`
- [ ] Add imports (spawn, types)
- [ ] Implement `buildPrompt()` function
- [ ] Implement `submitToAgent()` function
- [ ] Save file

### Phase 4: Backend Endpoint (10 min)
- [ ] Open `server/index.ts`
- [ ] Add imports for SubmissionRequest, SubmissionResponse, submitToAgent
- [ ] Add `/submit-to-agent` POST endpoint after `/resolve-selection`
- [ ] Save file
- [ ] Restart backend: `npm run dev:server`

### Phase 5: Panel Component (20 min)
- [ ] Open `src/dev-tools-agent/components/Panel.tsx`
- [ ] Add `SubmissionResponse` to type imports
- [ ] Import `submitToAgent` from '../api'
- [ ] Add 4 new state variables after line 33
- [ ] Add useEffect for state sync after line 140
- [ ] Add `handleVerify` callback after line 140
- [ ] Add `handleSubmit` callback after `handleVerify`
- [ ] Add Action Section UI after line 255
- [ ] Save file

### Phase 6: Testing (15 min)
- [ ] Refresh browser
- [ ] Test Case 1: Happy path with high-confidence element
- [ ] Test Case 2: Backend validation with curl
- [ ] Test Case 3: Empty message validation
- [ ] Verify code changes in editor

### Phase 7: Documentation (5 min)
- [ ] Update `docs/DEV_UI_AGENT_PROGRESS.md` with Milestone 7 section
- [ ] Mark milestone as Complete

## Troubleshooting Guide

### Error: "Module not found: agentSubmitter"
**Cause:** File not created or wrong path
**Solution:** Verify `server/resolvers/agentSubmitter.ts` exists

### Error: "Property 'isVerified' does not exist"
**Cause:** State variables not added to Panel.tsx
**Solution:** Add all 4 state variables after line 33

### Error: "submitToAgent is not a function"
**Cause:** Import missing or incorrect
**Solution:** Add `import { submitToAgent } from '../api';` to Panel.tsx

### Error: Cannot POST /submit-to-agent (404)
**Cause:** Backend endpoint not added or server not restarted
**Solution:** 
1. Verify endpoint added to server/index.ts
2. Restart server: Ctrl+C, then `npm run dev:server`

### Error: "Component context must be verified" (400)
**Cause:** Trying to submit without verification
**Solution:** This is correct behavior - user must click verify button first

### Error: "Failed to spawn cursor-agent"
**Cause:** Cursor CLI not installed or not in PATH
**Solution:** 
1. Install: `curl https://cursor.com/install -fsS | bash`
2. Authenticate: `cursor-agent login`
3. Verify: `cursor-agent --version`

## Files to Create/Modify

### New Files
- `server/resolvers/agentSubmitter.ts` - Agent submission logic (complete file provided above)

### Modified Files
- `src/shared/types.ts` - Add `SubmissionRequest`, `SubmissionResponse` (at end of file)
- `src/dev-tools-agent/types.ts` - Re-export new types from shared/types (line 6)
- `src/dev-tools-agent/api.ts` - Add `submitToAgent()` function (after resolveSelection)
- `src/dev-tools-agent/components/Panel.tsx` - Add verification UI, message input, submit button, result display (exact locations specified above)
- `server/index.ts` - Add `/submit-to-agent` endpoint (after /resolve-selection)
- `docs/DEV_UI_AGENT_PROGRESS.md` - Update with Milestone 7 completion

## Success Criteria

- [ ] Users can verify component mappings
- [ ] Users can enter natural language change requests
- [ ] Only verified contexts can be submitted
- [ ] Structured prompts include all relevant context
- [ ] Cursor agent successfully modifies code
- [ ] Success/failure feedback is clear
- [ ] Agent output is displayed when available
- [ ] Error handling is robust
- [ ] UI is intuitive and responsive

