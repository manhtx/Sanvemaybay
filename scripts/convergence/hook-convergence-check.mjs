#!/usr/bin/env node
/**
 * FARELY LIFECYCLE STOP HOOK FOR CONTINUOUS 5x5 CONVERGENCE
 * 
 * Intercepts Stop events in Antigravity to guarantee continuous autonomous looping:
 * Goal Completed -> 5x Research R10 -> 5x Master Goal G11 -> Chat Delivery -> Goal Execution
 */

import fs from 'node:fs';
import path from 'node:path';
import { completeGoal } from './continuous_5x5_orchestrator.mjs';
import { loadJournal } from './transactional-task-manager.mjs';

const ROOT_DIR = process.cwd();
const STATE_FILE = path.join(ROOT_DIR, 'docs/convergence/state/loop_state.json');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
}

const inputStr = readStdin();
let payload = {};
try {
  payload = JSON.parse(inputStr);
} catch {
  // Empty or invalid payload
}

let state = { status: 'IDLE' };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // Fallback
  }
}

// Check termination reason
const terminationReason = payload.terminationReason || 'NO_TOOL_CALL';

if (terminationReason === 'MAX_TOKEN_BUDGET_EXCEEDED' || terminationReason === 'MAX_INVOCATIONS') {
  state.pausedReason = terminationReason;
  state.interruptedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(JSON.stringify({
    decision: 'continue',
    reason: `Token budget or invocation limit reached (${terminationReason}). Durable state saved to docs/convergence/state/loop_state.json. If quota is available, resume from exact checkpoint immediately; otherwise pause for quota refresh.`
  }));
  process.exit(0);
}

if (terminationReason === 'NO_TOOL_CALL') {
  if (state.status === 'INITIALIZED') {
    state.status = 'IN_RESEARCH_5X';
    state.currentStage = 'RESEARCH_R10';
    state.currentPass = 'R1';
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: 'Chu trình hội tụ 5x5 vừa được khởi tạo. Tự động kích hoạt Pass R1 của Research R10 qua 12 thấu kính phản biện!'
    }));
    process.exit(0);
  }

  if (state.status === 'RESEARCH_COMPLETED_PENDING_COMPILER') {
    state.status = 'IN_MASTER_GOAL_5X';
    state.currentStage = 'MASTER_GOAL_G11';
    state.currentPass = 'G1';
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: '5 Pass Research R10 đã hoàn tất. Tự động kích hoạt Pass G1 của Master Goal Compiler G11 áp dụng Solution Cage Protocol!'
    }));
    process.exit(0);
  }

  if (state.status === 'GOAL_COMPLETED') {
    state.status = 'IN_RESEARCH_5X';
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: 'Goal execution completed. Automatically triggering the 5x5 Recursive Convergence Engine: 5-Pass Research R10 followed by 5-Pass Master Goal Compiler G11 under Gemini 3.8 Flash (High) deep reasoning.'
    }));
    process.exit(0);
  }

  if (state.status === 'MASTER_GOAL_PROMPT_READY') {
    state.status = 'EXECUTING_GOAL';
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: 'Master Goal Prompt G5 has been compiled and injected into chat. Automatically advancing execution of the new Master Goal tasks.'
    }));
    process.exit(0);
  }

  if (state.status === 'EXECUTING_GOAL') {
    const journal = loadJournal();
    if (journal.active_transaction) {
      console.log(JSON.stringify({
        decision: 'continue',
        reason: `Goal [${state.cycleId || 'ACTIVE'}] is actively executing task [${journal.active_transaction.task_id}]. Continue autonomous execution without stopping.`
      }));
      process.exit(0);
    }

    try {
      const completion = completeGoal(state.cycleId);
      console.log(JSON.stringify({
        decision: 'continue',
        reason: `[TỰ ĐỘNG CHUYỂN GIAO CHU KỲ] Goal [${completion.completedCycle}] đã hoàn thành và verified Git remote. Lập tức tự động kích hoạt Chu trình Hội tụ 5x5: Pass R1 Research R10 cho chu kỳ [${completion.nextCycleId}]!`
      }));
      process.exit(0);
    } catch (err) {
      console.log(JSON.stringify({
        decision: 'continue',
        reason: `[TỰ ĐỘNG THỰC THI GOAL] Goal [${state.cycleId || 'ACTIVE'}] đang trong quá trình thực thi nhiệm vụ (${err.message}). Lập tức tiếp tục thực thi các nhiệm vụ tiếp theo từ LATEST_MASTER_GOAL_PROMPT.md qua transactional-task-manager mà không được dừng lại!`
      }));
      process.exit(0);
    }
  }
}

// Default: allow normal stop
console.log(JSON.stringify({
  decision: 'allow'
}));
process.exit(0);
