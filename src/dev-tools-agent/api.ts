import type { SelectionPayload, ComponentContext, SubmissionResponse } from './types';

const BACKEND_URL = 'http://localhost:4000';

export async function resolveSelection(
  payload: SelectionPayload,
  baseUrl = BACKEND_URL,
  useAgentFallback = false
): Promise<ComponentContext> {
  const res = await fetch(`${baseUrl}/resolve-selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      useAgentFallback,
    }),
  });
  if (!res.ok) {
    throw new Error(`resolve-selection failed: ${res.status}`);
  }
  const json = await res.json();
  return json.componentContext as ComponentContext;
}

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

