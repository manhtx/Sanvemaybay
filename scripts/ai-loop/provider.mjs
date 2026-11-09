import { readFile } from 'node:fs/promises';

export function providerConfig(env = process.env) {
  return {
    baseUrl: (env.AI_BASE_URL || 'http://localhost:11434/v1').replace(/\/$/, ''),
    apiKey: env.AI_API_KEY || 'local',
    model: requiredFrom(env, 'AI_MODEL', 'local-model'),
    temperature: Number(env.AI_TEMPERATURE || 0.2),
    timeoutMs: Number(env.AI_TIMEOUT_MS || 600000),
  };
}

function requiredFrom(env, name, fallback) {
  return env[name] || fallback;
}

export async function complete(messages, options = {}) {
  if (process.env.AI_MOCK === '1') return { content: mockResponse(messages), raw: { mock: true } };
  const config = { ...providerConfig(), ...options };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        messages,
      }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`AI provider ${response.status}: ${body.slice(0, 2000)}`);
    const json = JSON.parse(body);
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider returned no message content');
    return { content, raw: json };
  } finally {
    clearTimeout(timeout);
  }
}

export async function completeWithRetry(messages, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await complete(messages, options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

function mockResponse(messages) {
  const joined = messages.map((message) => message.content || '').join('\n');
  if (joined.includes('implementation-protocol') || joined.includes('Implement, test')) {
    return JSON.stringify({
      summary: 'Mock implementation completed without mutating the project.',
      actions: [{ type: 'run', command: 'node', args: ['--version'] }],
      claims: [{ claim: 'Runtime can execute an action', status: 'verified', evidence: 'node --version' }],
      next: 'research',
    });
  }
  return JSON.stringify({
    summary: 'Mock independent research completed.',
    actions: [{ type: 'read', path: 'AGENTS.md' }],
    claims: [{ claim: 'The current repository instructions are readable', status: 'verified', evidence: 'AGENTS.md read action' }],
    next: 'research',
  });
}

export async function completeFromFile(systemFile, userMessage, options = {}) {
  const system = await readFile(systemFile, 'utf8');
  return complete([
    { role: 'system', content: system },
    { role: 'user', content: userMessage },
  ], options);
}
