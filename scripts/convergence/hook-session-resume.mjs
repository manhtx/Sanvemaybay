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
import { sanitizeAndRecoverTask } from './transactional-task-manager.mjs';
import { loadLensCheckpoints } from './continuous_5x5_orchestrator.mjs';

const ROOT_DIR = process.cwd();
const STATE_FILE = path.join(ROOT_DIR, 'docs/convergence/state/loop_state.json');

let state = { status: 'IDLE' };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // Fallback
  }
}

let injectMessage = null;

if (state.status === 'INITIALIZED') {
  injectMessage = `[HỆ THỐNG KÍCH HOẠT HỘI TỤ TỰ ĐỘNG - TOKEN RESUME]
Chu trình Hội tụ 5x5 đã được khởi tạo cho chu kỳ [${state.cycleId || 'G52'}].
- Trạng thái Checkpoint: Sẵn sàng thực hiện Pass R1 của Research R10.
- Chỉ thị bắt buộc: Lập tức kích hoạt Chu trình Hội tụ 5x5: Chạy Pass R1 của Research R10 qua toàn bộ 12 thấu kính phản biện!`;
} else if (state.status === 'EXECUTING_GOAL') {
  const recoveryResult = sanitizeAndRecoverTask();
  let recoveryPrefix = '';
  if (recoveryResult.status === 'RECOVERED_TO_CLEAN_SLATE') {
    recoveryPrefix = `\n[TỰ ĐỘNG KHÔI PHỤC FILE LỖI DO CẠN TOKEN]\n${recoveryResult.reason}\nCác file đã rollback về snapshot sạch: ${recoveryResult.restored_files.join(', ')}.\n`;
  }
  const activeTask = state.active_task || recoveryResult.task_id || 'the next pending task';
  injectMessage = `[HỆ THỐNG PHỤC HỒI TỰ ĐỘNG - TOKEN RESUME]
Phát hiện Goal [${state.cycleId || 'ACTIVE'}] chưa hoàn tất và bị tạm dừng do hết token/ngắt kết nối.${recoveryPrefix}
- Trạng thái Checkpoint: Nhiệm vụ đang dang dở: ${activeTask}.
- Chỉ thị bắt buộc: KHÔNG ĐƯỢC CHẠY LẠI TỪ ĐẦU. Đọc LATEST_MASTER_GOAL_PROMPT.md và tiếp tục thực thi ngay lập tức nhiệm vụ ${activeTask}.`;
} else if (state.status === 'GOAL_COMPLETED') {
  injectMessage = `[HỆ THỐNG KÍCH HOẠT HỘI TỤ TỰ ĐỘNG - TOKEN RESUME]
Goal trước [${state.cycleId || 'COMPLETED'}] đã hoàn thành và verified Git remote.
- Chỉ thị bắt buộc: Lập tức kích hoạt Chu trình Hội tụ 5x5: Chạy 5 Pass Research R10 qua 12 thấu kính, sau đó chạy 5 Pass Master Goal Compiler G11 để tạo Goal kế tiếp.`;
} else if (state.status === 'IN_RESEARCH_5X') {
  const completedR = Object.keys(state.completedPasses || {}).filter(k => k.startsWith('R'));
  const nextR = `R${completedR.length + 1}`;
  const passNum = completedR.length + 1;
  const partials = loadLensCheckpoints('RESEARCH_R10', passNum);
  const savedLenses = Object.keys(partials);
  let partialNote = '';
  if (savedLenses.length > 0) {
    partialNote = `\n- Phát hiện Checkpoint Thấu Kính: Đã lưu ${savedLenses.length}/12 thấu kính (${savedLenses.join(', ')}). Tiếp tục viết các thấu kính còn lại mà không phải viết lại từ đầu!`;
  }
  injectMessage = `[HỆ THỐNG PHỤC HỒI RESEARCH 5X - TOKEN RESUME]
Chu trình Research R10 đang thực hiện dở dang (${completedR.join(', ') || 'Chưa pass nào'} đã lưu trên đĩa).${partialNote}
- Chỉ thị bắt buộc: Tiếp tục thực thi ngay Pass ${nextR} qua toàn bộ 12 thấu kính, không chạy lại các pass đã lưu.`;
} else if (state.status === 'RESEARCH_COMPLETED_PENDING_COMPILER') {
  injectMessage = `[HỆ THỐNG PHỤC HỒI MASTER GOAL 5X - TOKEN RESUME]
Toàn bộ 5 Pass Research R10 đã hoàn tất và đạt chuẩn PoE.
- Chỉ thị bắt buộc: Lập tức kích hoạt 5 Pass Master Goal Compiler G11 bắt đầu từ Pass G1, áp dụng Solution Cage Protocol khóa cứng 100% giải pháp!`;
} else if (state.status === 'IN_MASTER_GOAL_5X') {
  const completedG = Object.keys(state.completedPasses || {}).filter(k => k.startsWith('G'));
  const nextG = `G${completedG.length + 1}`;
  const passNum = completedG.length + 1;
  const partials = loadLensCheckpoints('MASTER_GOAL_G11', passNum);
  const savedLenses = Object.keys(partials);
  let partialNote = '';
  if (savedLenses.length > 0) {
    partialNote = `\n- Phát hiện Checkpoint Thấu Kính: Đã lưu ${savedLenses.length}/12 thấu kính (${savedLenses.join(', ')}). Tiếp tục viết các thấu kính còn lại mà không phải viết lại từ đầu!`;
  }
  injectMessage = `[HỆ THỐNG PHỤC HỒI MASTER GOAL 5X - TOKEN RESUME]
Chu trình Master Goal G11 đang thực hiện dở dang (${completedG.join(', ') || 'Chưa pass nào'} đã lưu trên đĩa).${partialNote}
- Chỉ thị bắt buộc: Tiếp tục thực thi ngay Pass ${nextG} qua toàn bộ 12 thấu kính.`;
} else if (state.status === 'MASTER_GOAL_PROMPT_READY') {
  injectMessage = `[HỆ THỐNG KÍCH HOẠT THỰC THI GOAL MỚI - TOKEN RESUME]
Bản Master Goal Prompt G5 đã sẵn sàng tại docs/convergence/g11/LATEST_MASTER_GOAL_PROMPT.md.
- Chỉ thị bắt buộc: Bơm toàn văn G5 vào chat canvas và tự động tiến hành thực thi Goal mới.`;
} else if (state.status === 'BLOCKED_BY_LINTER') {
  injectMessage = `[HỆ THỐNG CẢNH BÁO LỖI LINTER - TOKEN RESUME]
Chu trình hội tụ đang bị dừng do Pass vi phạm linter chống trốn tránh/ngụy biện (BLOCKED_BY_LINTER).
- Chỉ thị bắt buộc: Mở docs/convergence/state/loop_state.json, xem danh sách issues, sửa lỗi vi phạm và chạy lại savePass!`;
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
