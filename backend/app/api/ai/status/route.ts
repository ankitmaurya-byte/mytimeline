// Lightweight AI provider status endpoint consumed by the dashboard
// Returns basic configuration visibility ONLY (no secrets) so the UI
// can show provider + model + whether a key is present.
// 200 always (feature discovery) unless an unexpected exception occurs.

interface ProviderStatus {
  provider: string;            // resolved provider id (none if unset)
  enabled: boolean;            // true if a non-"none" provider with key
  configured: boolean;         // key present
  model?: string;              // primary model (if any)
  models?: string[];           // potential models list (informational)
  rateLimit?: {                // static hints (NOT live usage)
    maxTasks: number;
    timeoutMs: number;
  };
  env: {                       // visibility flags only – never return keys
    OPENAI: boolean;
    ANTHROPIC: boolean;
    OPENROUTER: boolean;
    GROQ: boolean;
  };
  timestamp: string;
}

function resolveProvider(): { provider: string; key?: string; model?: string; models: string[] } {
  const raw = (process.env.AI_PROVIDER || 'none').toLowerCase();
  switch (raw) {
    case 'openai':
      return { provider: 'openai', key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4o-mini-translate'] };
    case 'anthropic':
      return { provider: 'anthropic', key: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest', models: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest'] };
    case 'openrouter':
      return { provider: 'openrouter', key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', models: ['openai/gpt-4o-mini', 'meta-llama/llama-3.1-70b-instruct', 'anthropic/claude-3.5-sonnet'] };
    case 'groq':
      return { provider: 'groq', key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile', models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b'] };
    default:
      return { provider: 'none', models: [] };
  }
}

export const OPTIONS = () => new Response(null, { status: 204 });

export const GET = async () => {
  try {
    const { provider, key, model, models } = resolveProvider();
    const status: ProviderStatus = {
      provider,
      enabled: !!key && provider !== 'none',
      configured: !!key,
      model,
      models: models.slice(0, 12),
      rateLimit: {
        maxTasks: parseInt(process.env.AI_MAX_TASKS || '40', 10),
        timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '12000', 10)
      },
      env: {
        OPENAI: !!process.env.OPENAI_API_KEY,
        ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
        OPENROUTER: !!process.env.OPENROUTER_API_KEY,
        GROQ: !!process.env.GROQ_API_KEY
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(status, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ provider: 'error', error: e?.message || 'internal' }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
