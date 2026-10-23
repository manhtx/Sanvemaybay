#!/usr/bin/env node
/**
 * FARELY SESSION-RESUME HOOK FOR AUTOMATIC CONVERGENCE & RECOVERY
 * 
 * Fires on SessionStart and PreInvocation to guarantee zero work is lost when:
 * 1. Tokens/quota run out during a Goal -> Resumes exact unfinished task.
 * 2. Tokens/quota run out during 5x5 Research/Compiler -> Resumes exact pending pass.
 * 3. Goal completed before pause -> Triggers 5x5 Research R10 + Master Goal G11.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const STATE_FILE = path.join(ROOT_DIR, 'docs/convergence/state/loop_state.json');
const LATEST_PROMPT_FILE = path.join(ROOT_DIR, 'docs/convergence/g11/LATEST_MASTER_GOAL_PROMPT.md');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
}

let state = { status: 'IDLE' };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // Fallback
  }
}

let injectMessage = null;

if (state.status === 'EXECUTING_GOAL') {
  const activeTask = state.active_task || 'the next pending task';
  injectMessage = `[HỆ THỐNG PHỤC HỒI TỰ ĐỘNG - TOKEN RESUME]
Phát hiện Goal [${state.cycleId || 'ACTIVE'}] chưa hoàn tất và bị tạm dừng do hết token/ngắt kết nối.
- Trạng thái Checkpoint: Nhiệm vụ đang dang dở: ${activeTask}.
- Chỉ thị bắt buộc: KHÔNG ĐƯỢC CHẠY LẠI TỪ ĐẦU. Đọc LATEST_MASTER_GOAL_PROMPT.md và tiếp tục thực thi ngay lập tức nhiệm vụ ${activeTask}.`;
} else if (state.status === 'GOAL_COMPLETED') {
  injectMessage = `[HỆ THỐNG KÍCH HOẠT HỘI TỤ TỰ ĐỘNG - TOKEN RESUME]
Goal trước [${state.cycleId || 'COMPLETED'}] đã hoàn thành và verified Git remote.
- Chỉ thị bắt buộc: Lập tức kích hoạt Chu trình Hội tụ 5x5: Chạy 5 Pass Research R10 qua 12 thấu kính, sau đó chạy 5 Pass Master Goal Compiler G11 để tạo Goal kế tiếp.`;
} else if (state.status === 'IN_RESEARCH_5X') {
  const completedR = Object.keys(state.completedPasses || {}).filter(k => k.startsWith('R'));
  const nextR = `R${completedR.length + 1}`;
  injectMessage = `[HỆ THỐNG PHỤC HỒI RESEARCH 5X - TOKEN RESUME]
Chu trình Research R10 đang thực hiện dở dang (${completedR.join(', ') || 'Chưa pass nào'} đã lưu trên đĩa).
- Chỉ thị bắt buộc: Tiếp tục thực thi ngay Pass ${nextR} qua toàn bộ 12 thấu kính, không chạy lại các pass đã lưu.`;
} else if (state.status === 'IN_MASTER_GOAL_5X') {
  const completedG = Object.keys(state.completedPasses || {}).filter(k => k.startsWith('G'));
  const nextG = `G${completedG.length + 1}`;
  injectMessage = `[HỆ THỐNG PHỤC HỒI MASTER GOAL 5X - TOKEN RESUME]
Chu trình Master Goal G11 đang thực hiện dở dang (${completedG.join(', ') || 'Chưa pass nào'} đã lưu trên đĩa).
- Chỉ thị bắt buộc: Tiếp tục thực thi ngay Pass ${nextG} qua toàn bộ 12 thấu kính.`;
} else if (state.status === 'MASTER_GOAL_PROMPT_READY') {
  injectMessage = `[HỆ THỐNG KÍCH HOẠT THỰC THI GOAL MỚI - TOKEN RESUME]
Bản Master Goal Prompt G5 đã sẵn sàng tại docs/convergence/g11/LATEST_MASTER_GOAL_PROMPT.md.
- Chỉ thị bắt buộc: Bơm toàn văn G5 vào chat canvas và tự động tiến hành thực thi Goal mới.`;
}

if (injectMessage) {
  console.log(JSON.stringify({
    injectSteps: [
      {
        ephemeralMessage: injectMessage
      }
    ]
  }));
} else {
  console.log(JSON.stringify({ injectSteps: [] }));
}
process.exit(0);
