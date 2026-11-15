import { PricePoint } from "../data/deals";

export interface PriceAnalytics {
  lowest: number;
  highest: number;
  average: number;
  median: number;
  volatilityPercent: number;
  currentPercentile: number | undefined;
  cheapestWeekday: number | undefined;
}

export function buildPriceAnalytics(points: PricePoint[], currentPrice?: number): PriceAnalytics | undefined {
  const n = points.length;
  if (!n) return undefined;
  const valid: { price: number; dateObj: Date }[] = [];
  for (let i = 0; i < n; i++) {
    const pt = points[i];
    const price = pt.price;
    if (price > 0 && Number.isFinite(price)) {
      const d = new Date(pt.date);
      if (Number.isFinite(d.getTime())) {
        valid.push({ price, dateObj: d });
      }
    }
  }
  const len = valid.length;
  if (!len) return undefined;
  valid.sort((a, b) => a.price - b.price);

  let sum = 0;
  const values = new Array<number>(len);
  for (let i = 0; i < len; i++) {
    const v = valid[i].price;
    values[i] = v;
    sum += v;
  }
  const average = sum / len;
  const middle = Math.floor(len / 2);
  const median = len % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;

  let varianceSum = 0;
  for (let i = 0; i < len; i++) {
    varianceSum += (values[i] - average) ** 2;
  }
  const standardDeviation = Math.sqrt(varianceSum / len);

  const weekdaySums = new Float64Array(7);
  const weekdayCounts = new Uint32Array(7);
  let distinctWeekdays = 0;

  for (let i = 0; i < len; i++) {
    const weekday = valid[i].dateObj.getDay();
    if (weekdayCounts[weekday] === 0) distinctWeekdays++;
    weekdaySums[weekday] += valid[i].price;
    weekdayCounts[weekday]++;
  }

  // Defensible sample rule: require at least 14 observations across at least 4 weekdays with >= 2 observations per weekday.
  // Otherwise, return undefined to prevent false weekday claims (Negative Control C).
  let cheapestWeekday: number | undefined = undefined;
  if (len >= 14 && distinctWeekdays >= 4) {
    let qualifiedCount = 0;
    let minAvg = Infinity;
    let bestDay: number | undefined = undefined;
    for (let day = 0; day < 7; day++) {
      const cnt = weekdayCounts[day];
      if (cnt >= 2) {
        qualifiedCount++;
        const avg = weekdaySums[day] / cnt;
        if (avg < minAvg) {
          minAvg = avg;
          bestDay = day;
        }
      }
    }
    if (qualifiedCount >= 4) {
      cheapestWeekday = bestDay;
    }
  }

  let currentPercentile: number | undefined = undefined;
  if (currentPrice != null && Number.isFinite(currentPrice)) {
    let countLe = 0;
    for (let i = 0; i < len; i++) {
      if (values[i] <= currentPrice) countLe++;
      else break;
    }
    currentPercentile = Math.round((countLe / len) * 100);
  }

  return {
    lowest: values[0],
    highest: values[len - 1],
    average,
    median,
    volatilityPercent: average ? (standardDeviation / average) * 100 : 0,
    currentPercentile,
    cheapestWeekday,
  };
}
