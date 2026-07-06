export default function Loading() {
  return <main className="route-loading" role="status" aria-live="polite" aria-label="Đang tải trang">
    <div className="route-loading__stars" aria-hidden="true" />
    <div className="solar-loader" aria-hidden="true">
      <span className="solar-loader__halo" />
      <span className="solar-loader__sun"><i /></span>
      <span className="solar-orbit solar-orbit--one">
        <i className="solar-planet solar-planet--mercury" />
        <i className="solar-planet solar-planet--earth" />
        <i className="solar-planet solar-planet--saturn" />
      </span>
      <span className="solar-orbit solar-orbit--two">
        <i className="solar-planet solar-planet--venus" />
        <i className="solar-planet solar-planet--mars" />
        <i className="solar-planet solar-planet--uranus" />
      </span>
      <span className="solar-orbit solar-orbit--three">
        <i className="solar-planet solar-planet--jupiter" />
        <i className="solar-planet solar-planet--neptune" />
      </span>
    </div>
    <div className="route-loading__copy">
      <b>Đang đồng bộ quỹ đạo sức khỏe</b>
      <span>Hệ thống đang chuẩn bị dữ liệu của bạn</span>
      <span className="route-loading__dots" aria-hidden="true"><i /><i /><i /></span>
    </div>
  </main>;
}
