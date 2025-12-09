import type { SelectionPayload, ComponentContext } from './types';

const BACKEND_URL = 'http://localhost:4000';

export async function resolveSelection(
  payload: SelectionPayload,
  baseUrl = BACKEND_URL
): Promise<ComponentContext> {
  const res = await fetch(`${baseUrl}/resolve-selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`resolve-selection failed: ${res.status}`);
  }
  const json = await res.json();
  return json.componentContext as ComponentContext;
}

