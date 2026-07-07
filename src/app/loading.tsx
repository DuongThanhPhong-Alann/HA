import { HeartPulse, Leaf } from "lucide-react";

export default function Loading() {
  return <main className="route-loading wellness-loading" role="status" aria-live="polite" aria-label="Đang tải trang">
    <div className="wellness-loading__light" aria-hidden="true" />
    <div className="wellness-loader" aria-hidden="true">
      <span className="wellness-loader__ring wellness-loader__ring--one" />
      <span className="wellness-loader__ring wellness-loader__ring--two" />
      <span className="wellness-loader__leaf wellness-loader__leaf--one"><Leaf /></span>
      <span className="wellness-loader__leaf wellness-loader__leaf--two"><Leaf /></span>
      <span className="wellness-loader__core"><HeartPulse /><i /></span>
      <svg viewBox="0 0 220 55" preserveAspectRatio="none"><path d="M0 31 H42 L52 31 L60 20 L70 42 L83 4 L98 48 L111 31 H153 L163 31 L171 20 L181 42 L194 4 L209 48 L220 31" /></svg>
    </div>
    <div className="route-loading__copy">
      <b>Đang chuẩn bị không gian sức khỏe</b>
      <span>Dữ liệu của bạn đang được đồng bộ an toàn</span>
      <span className="route-loading__dots" aria-hidden="true"><i /><i /><i /></span>
    </div>
  </main>;
}
