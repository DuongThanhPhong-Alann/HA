export type BloodPressureCategory = "LOW" | "NORMAL" | "ELEVATED" | "HYPERTENSION_STAGE_1" | "HYPERTENSION_STAGE_2" | "HYPERTENSIVE_CRISIS";
export type BloodPressureSeverity = "info" | "success" | "warning" | "danger" | "emergency";
export const MEDICAL_DISCLAIMER = "Thông tin chỉ mang tính tham khảo. Nếu có triệu chứng bất thường, hãy liên hệ bác sĩ hoặc cơ sở y tế.";

const results: Record<BloodPressureCategory, { severity: BloodPressureSeverity; title: string; message: string }> = {
  LOW: { severity: "warning", title: "Huyết áp thấp", message: "Chỉ số của bạn đang thấp hơn mức thường gặp. Nếu bạn đang chóng mặt, buồn nôn, mệt, hoa mắt hoặc muốn ngất, hãy nghỉ ngơi và cân nhắc liên hệ cơ sở y tế." },
  NORMAL: { severity: "success", title: "Huyết áp bình thường", message: "Chỉ số hiện tại nằm trong vùng bình thường. Hãy tiếp tục theo dõi định kỳ và duy trì lối sống lành mạnh." },
  ELEVATED: { severity: "warning", title: "Huyết áp hơi cao", message: "Huyết áp tâm thu đang hơi cao. Bạn nên nghỉ ngơi, hạn chế căng thẳng, giảm muối và tiếp tục theo dõi." },
  HYPERTENSION_STAGE_1: { severity: "warning", title: "Tăng huyết áp mức 1", message: "Chỉ số đang ở vùng tăng huyết áp mức 1. Nên theo dõi nhiều lần trong các ngày khác nhau và tham khảo ý kiến bác sĩ nếu tình trạng lặp lại." },
  HYPERTENSION_STAGE_2: { severity: "danger", title: "Tăng huyết áp mức 2", message: "Chỉ số đang cao. Bạn nên nghỉ ngơi, đo lại sau vài phút, ghi nhận kết quả và liên hệ bác sĩ nếu chỉ số vẫn cao hoặc thường xuyên lặp lại." },
  HYPERTENSIVE_CRISIS: { severity: "emergency", title: "Cảnh báo huyết áp rất cao", message: "Chỉ số đang ở mức rất cao. Hãy ngồi nghỉ, đo lại sau vài phút. Nếu vẫn cao hoặc có đau ngực, khó thở, yếu/tê tay chân, nhìn mờ, đau đầu dữ dội, khó nói hoặc choáng váng, hãy liên hệ cấp cứu/cơ sở y tế ngay." },
};

export function classifyBloodPressure(systolic: number, diastolic: number, pulse: number) {
  if (!Number.isInteger(systolic) || !Number.isInteger(diastolic) || !Number.isInteger(pulse) || systolic < 40 || systolic > 260 || diastolic < 30 || diastolic > 180 || pulse < 30 || pulse > 220 || systolic <= diastolic) throw new Error("Chỉ số không hợp lệ. Vui lòng kiểm tra lại số trên máy đo.");
  let category: BloodPressureCategory;
  if (systolic >= 180 || diastolic >= 120) category = "HYPERTENSIVE_CRISIS";
  else if (systolic >= 140 || diastolic >= 90) category = "HYPERTENSION_STAGE_2";
  else if (systolic >= 130 || diastolic >= 80) category = "HYPERTENSION_STAGE_1";
  else if (systolic >= 120) category = "ELEVATED";
  else if (systolic < 90 || diastolic < 60) category = "LOW";
  else category = "NORMAL";
  return { category, ...results[category], message: `${results[category].message} ${MEDICAL_DISCLAIMER}` };
}

export const categoryLabels: Record<BloodPressureCategory, string> = Object.fromEntries(Object.entries(results).map(([key, value]) => [key, value.title])) as Record<BloodPressureCategory, string>;
