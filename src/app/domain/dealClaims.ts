const LABELS = [
  "Giá quan sát",      // 0
  "Giá đáng chú ý",    // 1
  "Deal ngon",         // 2
  "Deal rất ngon",     // 3
  "Deal cực nóng",     // 4
] as const;

const LABEL_INDEX_TABLE = new Uint8Array(101 * 101);
for (let s = 0; s <= 100; s++) {
  for (let c = 0; c <= 100; c++) {
    let labelIdx = 0;
    if (c < 50) {
      labelIdx = s >= 60 ? 1 : 0;
    } else if (s >= 90 && c >= 75) {
      labelIdx = 4;
    } else if (s >= 80 && c >= 65) {
      labelIdx = 3;
    } else if (s >= 70) {
      labelIdx = 2;
    } else if (s >= 60) {
      labelIdx = 1;
    } else {
      labelIdx = 0;
    }
    LABEL_INDEX_TABLE[s * 101 + c] = labelIdx;
  }
}

export function evidenceGatedDealLabel(score: number, confidencePercent: number): string {
  if (
    Number.isInteger(score) &&
    Number.isInteger(confidencePercent) &&
    score >= 0 &&
    score <= 100 &&
    confidencePercent >= 0 &&
    confidencePercent <= 100
  ) {
    return LABELS[LABEL_INDEX_TABLE[score * 101 + confidencePercent]];
  }

  const boundedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const boundedConfidence = Math.max(0, Math.min(100, Number(confidencePercent) || 0));
  if (boundedConfidence < 50) return boundedScore >= 60 ? "Giá đáng chú ý" : "Giá quan sát";
  if (boundedScore >= 90 && boundedConfidence >= 75) return "Deal cực nóng";
  if (boundedScore >= 80 && boundedConfidence >= 65) return "Deal rất ngon";
  if (boundedScore >= 70) return "Deal ngon";
  if (boundedScore >= 60) return "Giá đáng chú ý";
  return "Giá quan sát";
}
