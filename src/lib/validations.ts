import { z } from "zod";
export const bloodPressureSchema = z.object({
  systolic: z.coerce.number().int().min(40, "Tối thiểu 40").max(260, "Tối đa 260"),
  diastolic: z.coerce.number().int().min(30, "Tối thiểu 30").max(180, "Tối đa 180"),
  pulse: z.coerce.number().int().min(30, "Tối thiểu 30").max(220, "Tối đa 220"),
  measured_at: z.string().min(1, "Vui lòng chọn thời gian đo"), note: z.string().max(500, "Tối đa 500 ký tự").optional(),
}).refine((d) => d.systolic > d.diastolic, { message: "Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.", path: ["systolic"] });
export const loginSchema = z.object({ email: z.email("Email không hợp lệ"), password: z.string().min(6, "Tối thiểu 6 ký tự") });
export const strongPasswordSchema = z.string()
  .min(12, "Mật khẩu phải có ít nhất 12 ký tự")
  .max(128, "Mật khẩu không được vượt quá 128 ký tự")
  .regex(/[a-z]/, "Mật khẩu phải có chữ thường")
  .regex(/[A-Z]/, "Mật khẩu phải có chữ hoa")
  .regex(/[0-9]/, "Mật khẩu phải có chữ số")
  .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ký tự đặc biệt");
export const registerSchema = loginSchema.extend({ fullName: z.string().min(2, "Vui lòng nhập họ tên"), phone: z.string().min(9, "Số điện thoại không hợp lệ").max(15), password: strongPasswordSchema, confirmPassword: z.string() }).refine((d) => d.password === d.confirmPassword, { message: "Mật khẩu không khớp", path: ["confirmPassword"] });
