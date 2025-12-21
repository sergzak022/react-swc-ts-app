import express from 'express';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import type { SelectionPayload, ComponentContext } from '../src/shared/types';
import { resolveSelection } from './resolvers';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/resolve-selection', async (req, res) => {
  const payload: Partial<SelectionPayload> = req.body ?? {};
  const useAgentFallback = req.body.useAgentFallback ?? false;

  // Build base response
  const componentContext: ComponentContext = {
    id: randomUUID(),
    source: 'heuristic',
    confidence: 'low',
    filePath: '',
    selectorSummary: payload.selector ?? '',
    domSummary: (payload.textSnippet ?? '').slice(0, 100),
    needsVerification: true,
    verified: false,
  };

  // Run resolver chain
  try {
    const result = await resolveSelection(payload as SelectionPayload, {
      cwd: process.cwd(),
      useAgentFallback,
    });

    componentContext.source = result.source || 'heuristic';
    componentContext.confidence = result.confidence;
    componentContext.verified = result.verified;
    componentContext.filePath = result.filePath;
    componentContext.lineNumber = result.lineNumber;
    componentContext.needsVerification = !result.verified;
    componentContext.codeSnippet = result.codeSnippet;
  } catch (error) {
    console.error('[ui-agent] Resolution failed:', error);
  }

  res.json({ componentContext });
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`[ui-agent] backend listening on ${port}`);
});
