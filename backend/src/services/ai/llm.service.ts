import { HTTPSTATUS } from '../../config/http.config';
import { trackAiCall } from '../admin-metrics.service';

export interface LlmResult {
  success: boolean;
  content: string;
  provider: string;
  error?: string;
}

const PROVIDER = (process.env.AI_PROVIDER || 'none').toLowerCase();
const MAX_TASKS = parseInt(process.env.AI_MAX_TASKS || '40', 10);
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '12000', 10);

interface ModelConfig { key?: string; model?: string; }

function getProviderConfig(): { provider: string; config: ModelConfig } {
  switch (PROVIDER) {
    case 'openai':
      return { provider: 'openai', config: { key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' } };
    case 'anthropic':
      return { provider: 'anthropic', config: { key: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest' } };
    case 'openrouter':
      return { provider: 'openrouter', config: { key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini' } };
    case 'groq':
      return { provider: 'groq', config: { key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile' } };
    default:
      return { provider: 'none', config: {} };
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
  });
}

export async function generateLlmSummary(query: string, parsed: any, tasks: any[]): Promise<LlmResult> {
  const { provider, config } = getProviderConfig();
  if (provider === 'none' || !config.key) {
    return { success: false, provider, content: '', error: 'Provider not configured' };
  }

  const trimmedTasks = tasks.slice(0, MAX_TASKS).map(t => ({
    id: t._id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    project: t.project?.name,
    assignedTo: t.assignedTo?.name
  }));

  const systemInstruction = `You are a concise task analyst. Provide a short natural language summary answering the user's question about tasks. Include counts, highlight overdue or urgent items, and suggest one actionable next step if helpful. Keep under 120 words.`;

  const userPrompt = JSON.stringify({ query, parsed, tasks: trimmedTasks }, null, 2);

  const startTime = Date.now();
  let result: LlmResult;

  try {
    switch (provider) {
      case 'openai':
        result = await callOpenAI(systemInstruction, userPrompt, config);
        break;
      case 'anthropic':
        result = await callAnthropic(systemInstruction, userPrompt, config);
        break;
      case 'openrouter':
        result = await callOpenRouter(systemInstruction, userPrompt, config);
        break;
      case 'groq':
        result = await callGroq(systemInstruction, userPrompt, config);
        break;
      default:
        result = { success: false, provider, content: '', error: 'Unknown provider' };
    }
  } catch (e: any) {
    result = { success: false, provider, content: '', error: e?.message || 'LLM error' };
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Track the AI call in admin metrics
  trackAiCall({
    user: 'ai-user',
    workspace: 'workspace',
    ms: duration,
    provider: provider,
    success: result.success,
    fallback: false,
    timeout: duration > TIMEOUT_MS
  });

  return result;
}

async function callOpenAI(system: string, user: string, cfg: ModelConfig): Promise<LlmResult> {
  const res = await withTimeout(fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.2 })
  }), TIMEOUT_MS, 'openai');
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content?.trim() || '';
  return { success: true, provider: 'openai', content };
}

async function callAnthropic(system: string, user: string, cfg: ModelConfig): Promise<LlmResult> {
  const res = await withTimeout(fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.key || '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: cfg.model, max_tokens: 400, system, messages: [{ role: 'user', content: user }] })
  }), TIMEOUT_MS, 'anthropic');
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const json: any = await res.json();
  const content = json.content?.[0]?.text?.trim() || '';
  return { success: true, provider: 'anthropic', content };
}

async function callOpenRouter(system: string, user: string, cfg: ModelConfig): Promise<LlmResult> {
  const res = await withTimeout(fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.key}`,
      'HTTP-Referer': 'https://your-app.example',
      'X-Title': 'Timeline Task Assistant'
    },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.2 })
  }), TIMEOUT_MS, 'openrouter');
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content?.trim() || '';
  return { success: true, provider: 'openrouter', content };
}

async function callGroq(system: string, user: string, cfg: ModelConfig): Promise<LlmResult> {
  const res = await withTimeout(fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.15 })
  }), TIMEOUT_MS, 'groq');
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content?.trim() || '';
  return { success: true, provider: 'groq', content };
}
