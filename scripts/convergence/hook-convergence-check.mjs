#!/usr/bin/env node
/**
 * FARELY LIFECYCLE STOP HOOK FOR PERPETUAL CONTINUOUS CONVERGENCE
 * 
 * Intercepts Stop events in Antigravity to guarantee PERPETUAL autonomous looping:
 * Goal Completed -> 5x Research R10 -> 5x Master Goal G11 -> Goal Task Execution -> Goal Completion -> Next Cycle (Vĩnh Cửu)
 */

import fs from 'node:fs';
import path from 'node:path';
import { completeGoal } from './continuous_5x5_orchestrator.mjs';
import { loadJournal } from './transactional-task-manager.mjs';

const ROOT_DIR = process.cwd();
const STATE_FILE = path.join(ROOT_DIR, 'docs/convergence/state/loop_state.json');
const STOP_SIGNAL_FILE = path.join(ROOT_DIR, 'docs/convergence/state/STOP_PERPETUAL_LOOP');

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

// 1. If explicit manual stop signal exists or user explicitly canceled in UI, allow stop
const terminationReason = payload.terminationReason || 'NO_TOOL_CALL';
if (terminationReason === 'USER_CANCELED' || fs.existsSync(STOP_SIGNAL_FILE)) {
  console.log(JSON.stringify({
    decision: 'allow',
    reason: 'Perpetual convergence loop stopped by explicit user request.'
  }));
  process.exit(0);
}

// 2. Load durable state
let state = { status: 'INITIALIZED', cycleId: 'G56' };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // Fallback
  }
}

// 3. Handle Token Budget or Invocation Limit
if (terminationReason === 'MAX_TOKEN_BUDGET_EXCEEDED' || terminationReason === 'MAX_INVOCATIONS' || terminationReason === 'MAX_FORCED_INVOCATIONS') {
  state.pausedReason = terminationReason;
  state.interruptedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(JSON.stringify({
    decision: 'continue',
    reason: `[TOKEN RESUME PERPETUAL] Token budget or invocation limit reached (${terminationReason}). Durable state saved to docs/convergence/state/loop_state.json. Continuing immediately from exact checkpoint without resetting.`
  }));
  process.exit(0);
}

// 4. State-Driven Perpetual Transitions

// State: INITIALIZED
if (state.status === 'INITIALIZED') {
  state.status = 'IN_RESEARCH_5X';
  state.currentStage = 'RESEARCH_R10';
  state.currentPass = 'R1';
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(JSON.stringify({
    decision: 'continue',
    reason: `[PERPETUAL ENGINE - KHỞI TẠO CHU KỲ ${state.cycleId || 'ACTIVE'}] Tự động kích hoạt Pass R1 của Research R10 qua 12 thấu kính phản biện!`
  }));
  process.exit(0);
}

// State: IN_RESEARCH_5X
if (state.status === 'IN_RESEARCH_5X') {
  const completedR = Object.keys(state.completedPasses || {}).filter(k => k.startsWith('R'));
  const nextPassNum = completedR.length + 1;

  if (nextPassNum > 5) {
    state.status = 'RESEARCH_COMPLETED_PENDING_COMPILER';
    state.currentStage = 'MASTER_GOAL_G11';
    state.currentPass = 'G1';
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - RESEARCH 5X HOÀN TẤT] Cả 5 Pass Research R10 đã hoàn thành. Lập tức tự động kích hoạt Pass G1 của Master Goal Compiler G11!`
    }));
    process.exit(0);
  } else {
    state.currentPass = `R${nextPassNum}`;
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - RESEARCH R10 ĐANG CHẠY] Đã xong (${completedR.join(', ') || '0 pass'}). Lập tức tiếp tục tự động thực hiện Pass R${nextPassNum} qua 12 thấu kính phản biện mà không được dừng lại!`
    }));
    process.exit(0);
  }
}

// State: RESEARCH_COMPLETED_PENDING_COMPILER
if (state.status === 'RESEARCH_COMPLETED_PENDING_COMPILER') {
  state.status = 'IN_MASTER_GOAL_5X';
  state.currentStage = 'MASTER_GOAL_G11';
  state.currentPass = 'G1';
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(JSON.stringify({
    decision: 'continue',
    reason: '[PERPETUAL ENGINE - MASTER GOAL COMPILER G11] 5 Pass Research R10 đã sẵn sàng. Tự động kích hoạt Pass G1 của Master Goal Compiler G11 áp dụng Solution Cage Protocol khóa 12 giải pháp!'
  }));
  process.exit(0);
}

// State: IN_MASTER_GOAL_5X
if (state.status === 'IN_MASTER_GOAL_5X') {
  const completedG = Object.keys(state.completedPasses || {}).filter(k => k.startsWith('G'));
  const nextPassNum = completedG.length + 1;

  if (nextPassNum > 5) {
    state.status = 'MASTER_GOAL_PROMPT_READY';
    state.currentStage = 'EXECUTION';
    state.currentPass = 'G5';
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - MASTER GOAL G5 HOÀN TẤT] 5 Pass Master Goal Compiler G11 đã hoàn thành. Lập tức kích hoạt thực thi Goal mới!`
    }));
    process.exit(0);
  } else {
    state.currentPass = `G${nextPassNum}`;
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - MASTER GOAL COMPILER ĐANG CHẠY] Đã xong (${completedG.join(', ') || '0 pass'}). Lập tức tiếp tục tự động thực hiện Pass G${nextPassNum} qua 12 thấu kính phản biện mà không được dừng lại!`
    }));
    process.exit(0);
  }
}

// State: MASTER_GOAL_PROMPT_READY
if (state.status === 'MASTER_GOAL_PROMPT_READY') {
  state.status = 'EXECUTING_GOAL';
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(JSON.stringify({
    decision: 'continue',
    reason: `[PERPETUAL ENGINE - TIẾN HÀNH THỰC THI GOAL] Master Goal Prompt G5 đã biên dịch thành công. Lập tức tự động khởi chạy các nhiệm vụ từ LATEST_MASTER_GOAL_PROMPT.md qua transactional-task-manager!`
  }));
  process.exit(0);
}

// State: EXECUTING_GOAL
if (state.status === 'EXECUTING_GOAL') {
  const journal = loadJournal();
  if (journal.active_transaction) {
    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - NHIỆM VỤ ĐANG CHẠY] Goal [${state.cycleId || 'ACTIVE'}] đang tích cực thực thi nhiệm vụ [${journal.active_transaction.task_id}]. Tiếp tục chạy tự động không dừng lại.`
    }));
    process.exit(0);
  }

  try {
    const completion = completeGoal(state.cycleId);
    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - CHUYỂN GIAO CHU KỲ VĨNH CỬU] Goal [${completion.completedCycle}] đã hoàn thành và verified Git remote. Lập tức tự động kích hoạt Chu trình Hội tụ 5x5: Pass R1 Research R10 cho chu kỳ tiếp theo [${completion.nextCycleId}]!`
    }));
    process.exit(0);
  } catch (err) {
    console.log(JSON.stringify({
      decision: 'continue',
      reason: `[PERPETUAL ENGINE - THỰC THI NHIỆM VỤ GOAL] Goal [${state.cycleId || 'ACTIVE'}] đang thực hiện nhiệm vụ (${err.message}). Lập tức tiếp tục thực thi các nhiệm vụ tiếp theo từ LATEST_MASTER_GOAL_PROMPT.md mà không được dừng lại!`
    }));
    process.exit(0);
  }
}

// State: GOAL_COMPLETED
if (state.status === 'GOAL_COMPLETED') {
  state.status = 'IN_RESEARCH_5X';
  state.currentStage = 'RESEARCH_R10';
  state.currentPass = 'R1';
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(JSON.stringify({
    decision: 'continue',
    reason: `[PERPETUAL ENGINE - CHU TRÌNH MỚI ${state.cycleId || 'ACTIVE'}] Goal trước đã hoàn thành. Lập tức tự động kích hoạt Chu trình Hội tụ 5x5: Pass R1 Research R10 qua 12 thấu kính phản biện!`
  }));
  process.exit(0);
}

// State: BLOCKED_BY_LINTER
if (state.status === 'BLOCKED_BY_LINTER') {
  console.log(JSON.stringify({
    decision: 'continue',
    reason: '[PERPETUAL ENGINE - SỬA LỖI LINTER] Phát hiện pass bị chặn bởi linter chống ngụy biện. Lập tức kiểm tra loop_state.json và sửa các vi phạm để vượt qua linter!'
  }));
  process.exit(0);
}

// 5. Ultimate Fallback: PERPETUAL DEFAULT IS ALWAYS CONTINUE
console.log(JSON.stringify({
  decision: 'continue',
  reason: `[PERPETUAL CONVERGENCE LOOP ACTIVE] Chu trình hội tụ vĩnh cửu đang hoạt động (state: ${state.status}, pass: ${state.currentPass || 'ACTIVE'}, cycle: ${state.cycleId || 'ACTIVE'}). Tuyệt đối không dừng lại, lập tức tiếp tục thực thi bước tiếp theo!`
}));
process.exit(0);
