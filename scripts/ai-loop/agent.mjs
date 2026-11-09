import { completeWithRetry } from './provider.mjs';
import { projectPath, readText, run } from './runtime.mjs';

const TOOL_PROTOCOL = `
You are the autonomous implementation agent. You have full authority over the project.
Return exactly one JSON object, no markdown, with this shape:
{"summary":"...","actions":[{"type":"read|search|run|write|patch|git","path":"...","command":"...","content":"..."}],"claims":[{"claim":"...","status":"verified|rejected|unknown","evidence":"..."}],"next":"continue|research|stop"}

Rules:
- Treat every previous conclusion as an untrusted hypothesis.
- Inspect current files and runtime before changing anything.
- Use actions to do work; do not merely describe work.
- Paths are relative to the repository root.
- Never use paths outside the repository.
- Never claim verified without command, source, screenshot, or runtime evidence.
- A passing baseline is not a reason to stop; continue looking for improvements.
- Do not ask the user for approval. Recover, revise, or continue.
`;

export async function executeAgent(messages, options = {}) {
  const mode = options.mode || 'implementation';
  const protocol = mode === 'research'
    ? `${TOOL_PROTOCOL}\nResearch mode is read-only. Do not write, patch, commit, or push. Use read/search and safe inspection commands only.`
    : TOOL_PROTOCOL;
  let history = [...messages, { role: 'system', content: protocol }];
  const maxTurns = options.maxTurns || 24;
  const results = [];
  for (let turn = 0; turn < maxTurns; turn += 1) {
    let action;
    try {
      const response = await completeWithRetry(history, options);
      action = parseJson(response.content);
    } catch (error) {
      history.push({ role: 'user', content: `Your last response failed the machine protocol: ${error.message}. Return one valid JSON object and continue.` });
      continue;
    }
    results.push(action);
    const outputs = [];
    for (const item of action.actions || []) {
      try {
        outputs.push(await executeAction(item, mode));
      } catch (error) {
        outputs.push({ ok: false, action: item, error: error.message });
      }
    }
    results[results.length - 1] = { ...action, toolOutputs: outputs };
    if (action.next === 'stop') return { results, stopped: true };
    history = [
      ...history,
      { role: 'assistant', content: JSON.stringify(action) },
      { role: 'user', content: `Action results:\n${JSON.stringify(outputs, null, 2)}\nContinue independently.` },
    ];
  }
  return { results, stopped: false };
}

function parseJson(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced || content.trim();
  try { return JSON.parse(candidate); } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}\n${content.slice(0, 2000)}`);
  }
}

async function executeAction(action, mode = 'implementation') {
  if (!action || typeof action !== 'object') throw new Error('Invalid action');
  if (mode === 'research' && ['write', 'patch', 'git'].includes(action.type)) {
    throw new Error(`Research mode rejects mutating action: ${action.type}`);
  }
  if (mode === 'research' && action.type === 'run') {
    const allowed = new Set(['rg', 'find', 'ls', 'pwd', 'sed', 'cat', 'curl', 'git', 'node', 'python', 'python3']);
    const command = action.command || action.path;
    if (!allowed.has(command)) throw new Error(`Research mode rejects command: ${command}`);
    if (command === 'git' && !['status', 'log', 'show', 'diff', 'branch', 'remote'].includes(action.args?.[0])) {
      throw new Error(`Research mode rejects git subcommand: ${action.args?.[0]}`);
    }
  }
  if (action.type === 'read') return { type: action.type, path: action.path, content: (await readText(projectPath(action.path))).slice(0, 50000) };
  if (action.type === 'search') return await run('rg', ['-n', '--hidden', '-g', '!.git', '-g', '!node_modules', action.pattern || action.path || ''], { timeoutMs: 120000 });
  if (action.type === 'run') {
    const command = action.command || action.path;
    if (!command) throw new Error('run action requires command');
    return await run(command, action.args || [], { timeoutMs: action.timeoutMs || 900000 });
  }
  if (action.type === 'write') {
    const { writeText } = await import('./runtime.mjs');
    await writeText(projectPath(action.path), action.content || '');
    return { type: action.type, path: action.path, ok: true };
  }
  if (action.type === 'patch') {
    const { writeText } = await import('./runtime.mjs');
    const current = await readText(projectPath(action.path));
    if (!action.find || !current.includes(action.find)) return { type: action.type, path: action.path, ok: false, error: 'find text missing' };
    await writeText(projectPath(action.path), current.replace(action.find, () => (action.replace || '')));
    return { type: action.type, path: action.path, ok: true };
  }
  if (action.type === 'git') return await run('git', action.args || [], { timeoutMs: 180000 });
  throw new Error(`Unsupported action: ${action.type}`);
}
