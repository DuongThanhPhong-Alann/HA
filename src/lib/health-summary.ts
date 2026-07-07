import type { BloodPressureCategory, BloodPressureSeverity } from "@/lib/blood-pressure";
import { categoryLabels, classifyBloodPressure, MEDICAL_DISCLAIMER } from "@/lib/blood-pressure";
import type { Measurement } from "@/types/database";
import type { AppLocale } from "@/lib/i18n";

const riskOrder: BloodPressureCategory[] = [
  "NORMAL",
  "ELEVATED",
  "LOW",
  "HYPERTENSION_STAGE_1",
  "HYPERTENSION_STAGE_2",
  "HYPERTENSIVE_CRISIS",
];

type Metric = "systolic" | "diastolic" | "pulse";

export type PeriodHealthSummary = {
  count: number;
  averages: Record<Metric, number>;
  ranges: Record<Metric, { min: number; max: number }>;
  variability: Record<Metric, number>;
  highRiskCount: number;
  worstCategory: BloodPressureCategory;
  severity: BloodPressureSeverity;
  title: string;
  assessment: string;
  trend: "up" | "down" | "stable" | "insufficient";
  disclaimer: string;
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const deviation = (values: number[]) => {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

export function summarizeMeasurements(records: Measurement[], locale: AppLocale = "vi"): PeriodHealthSummary | null {
  if (!records.length) return null;

  const ordered = [...records].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
  );
  const values = (metric: Metric) => ordered.map((record) => record[metric]);
  const averages = {
    systolic: Math.round(mean(values("systolic"))),
    diastolic: Math.round(mean(values("diastolic"))),
    pulse: Math.round(mean(values("pulse"))),
  };
  const ranges = Object.fromEntries(
    (["systolic", "diastolic", "pulse"] as Metric[]).map((metric) => [
      metric,
      { min: Math.min(...values(metric)), max: Math.max(...values(metric)) },
    ]),
  ) as PeriodHealthSummary["ranges"];
  const variability = Object.fromEntries(
    (["systolic", "diastolic", "pulse"] as Metric[]).map((metric) => [
      metric,
      Math.round(deviation(values(metric)) * 10) / 10,
    ]),
  ) as PeriodHealthSummary["variability"];

  const worstCategory = ordered.reduce<BloodPressureCategory>(
    (worst, record) => riskOrder.indexOf(record.category) > riskOrder.indexOf(worst) ? record.category : worst,
    "NORMAL",
  );
  const averageClassification = classifyBloodPressure(averages.systolic, averages.diastolic, averages.pulse);
  const finalCategory = riskOrder.indexOf(worstCategory) > riskOrder.indexOf(averageClassification.category)
    ? worstCategory
    : averageClassification.category;
  const finalClassification = ordered.find((record) => record.category === finalCategory);

  let trend: PeriodHealthSummary["trend"] = "insufficient";
  if (ordered.length >= 4) {
    const midpoint = Math.floor(ordered.length / 2);
    const first = mean(ordered.slice(0, midpoint).map((record) => record.systolic));
    const second = mean(ordered.slice(midpoint).map((record) => record.systolic));
    trend = second - first > 5 ? "up" : first - second > 5 ? "down" : "stable";
  }

  const trendText = trend === "up"
    ? "Huyết áp tâm thu trung bình đang có xu hướng tăng."
    : trend === "down"
      ? "Huyết áp tâm thu trung bình đang có xu hướng giảm."
      : trend === "stable"
        ? "Chỉ số trung bình tương đối ổn định giữa hai nửa kỳ."
        : "Cần ít nhất 4 lần đo để đánh giá xu hướng.";
  const variabilityText = variability.systolic >= 15 || variability.diastolic >= 10
    ? "Độ dao động chỉ số khá lớn; nên đo vào thời điểm cố định và trao đổi với bác sĩ nếu tiếp diễn."
    : "Độ dao động giữa các lần đo chưa ở mức nổi bật trong kỳ này.";
  const englishTrendText = trend === "up"
    ? "Mean systolic blood pressure shows an upward trend."
    : trend === "down"
      ? "Mean systolic blood pressure shows a downward trend."
      : trend === "stable"
        ? "Mean readings are relatively stable between the two halves of this period."
        : "At least four readings are required for trend assessment.";
  const englishVariabilityText = variability.systolic >= 15 || variability.diastolic >= 10
    ? "Blood pressure variability is substantial; measure at consistent times and consult a clinician if this persists."
    : "No substantial visit-to-visit variability is evident during this period.";

  return {
    count: ordered.length,
    averages,
    ranges,
    variability,
    highRiskCount: ordered.filter((record) => ["danger", "emergency"].includes(record.severity)).length,
    worstCategory: finalCategory,
    severity: finalClassification?.severity ?? averageClassification.severity,
    title: categoryLabels[finalCategory],
    assessment: locale === "en" ? `${englishTrendText} ${englishVariabilityText}` : `${trendText} ${variabilityText}`,
    trend,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}
