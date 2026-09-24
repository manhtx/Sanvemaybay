export function evidenceGatedDealLabel(score: number, confidencePercent: number): string {
  const boundedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const boundedConfidence = Math.max(0, Math.min(100, Number(confidencePercent) || 0));
  if (boundedConfidence < 50) return boundedScore >= 60 ? "Giá đáng chú ý" : "Giá quan sát";
  if (boundedScore >= 90 && boundedConfidence >= 75) return "Deal cực nóng";
  if (boundedScore >= 80 && boundedConfidence >= 65) return "Deal rất ngon";
  if (boundedScore >= 70) return "Deal ngon";
  if (boundedScore >= 60) return "Giá đáng chú ý";
  return "Giá quan sát";
}
