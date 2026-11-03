# Kiểm tra UI — 01/11/2026

## Môi trường

Microsoft Edge 156, điều khiển bằng Chrome DevTools MCP. Dev server Vite tại http://127.0.0.1:5173. UI tiếng Việt, chế độ sáng.

## Viewport đã quan sát bằng screenshot

| Thiết bị | Viewport | Kết quả |
| --- | --- | --- |
| Desktop | 1440×900 | Sidebar đầy đủ; bảng, tổng quan, form và báo cáo đã được quan sát. Không overflow toàn trang. |
| Tablet | 768×1024 | Điều hướng dạng icon có accessible label; số liệu xếp hai cột; biểu đồ và nhắc việc xuống dòng hợp lý. |
| Mobile | 390×844, mobile + touch emulation | Tỉ lệ viewport 1:1; menu dạng drawer; form một cột; bảng cuộn ngang riêng trong vùng có nhãn. |

Đã kiểm tra chiều ngang của cả bảy màn hình trên mobile: tổng quan, sách, độc giả, mượn trả, tiền phạt, báo cáo và cài đặt; `innerWidth = clientWidth = scrollWidth = 390`, `visualViewport.scale = 1`.

Ảnh kiểm tra lưu trong `artifacts/desktop-1440.webp`, `artifacts/tablet-768.webp`, `artifacts/mobile-390.jpg`. Ảnh gốc cũng được quan sát trực tiếp từ MCP; các bản lưu dùng nén WebP/JPEG.

## Luồng đã thao tác qua giao diện

- Mở menu mobile và chuyển tới danh mục; kiểm tra form thêm đầu sách trên màn hình điện thoại.
- Thêm đầu sách hai bản, tìm kiếm không dấu, sửa tên và xóa sau xác nhận. Đã kiểm tra trạng thái lưu trong localStorage.
- Tạo thẻ độc giả mới; kiểm tra màn chọn độc giả tự vô hiệu hóa thẻ hết hạn, đã khóa, có phạt chưa thu hoặc phiếu quá hạn.
- Tạo phiếu hai cuốn, gia hạn thêm bảy ngày; nhận trả từng cuốn. Phiếu vẫn hoạt động sau lần trả đầu và hoàn tất sau lần trả cuối.
- Trả cuốn cuối với tình trạng cần sửa chữa; bản sao chuyển sang `repair`.
- Trả hai sách trễ hai ngày với mức 2.000 ₫/cuốn/ngày; ghi nhận đúng 8.000 ₫. Xác nhận thu, kiểm tra cờ thanh toán.
- Đổi báo cáo sang bảy ngày; xuất CSV và kiểm tra dữ liệu cùng BOM UTF-8 `[239,187,191]`. Bắt nội dung tải trong bộ nhớ để không tạo file thử trong thư mục Downloads của người dùng.
- Lưu quy định mượn tối đa, tải lại trang và kiểm tra dữ liệu vẫn còn.
- Mở tìm nhanh bằng Ctrl+K, tìm tên sách không dấu, đóng bằng Escape.
- Từ tổng quan, mở đúng danh sách năm phiếu quá hạn; kiểm tra deep link bộ lọc sắp đến hạn và empty state.

Dữ liệu được tạo trong các thao tác QA đã được dọn; không gian làm việc được khôi phục bộ mẫu ban đầu.

## Lỗi đã phát hiện và sửa

- Mobile tự thu nhỏ trang: nhãn ẩn trong ô bảng được định vị tuyệt đối theo trang, vượt khỏi vùng cuộn. Thêm containing block cho `.table-scroll`; chụp lại và xác nhận tỉ lệ 1:1.
- Nút chỉ có icon ở tablet/mobile thiếu accessible name: bổ sung aria-label và title.
- Chữ phụ/trạng thái quá nhạt: tăng tương phản và điều chỉnh cỡ chữ.
- Thẻ tổng quan chưa mở đúng bộ lọc: nối filter qua URL và đồng bộ điều hướng.

## Kiểm tra mã nguồn

- TypeScript strict và Vite production build: thành công.
- 8 kiểm thử nghiệp vụ: thành công; gồm tồn kho/bản sao, trả từng phần, tính phạt riêng từng lần trả, bảo trì, hạn thẻ/nợ phạt/giới hạn mượn, gia hạn, bảo toàn lịch sử và dữ liệu đầu vào.
- Không ghi nhận console error/warning trong các phiên kiểm tra cuối.

## Giới hạn của giai đoạn này

Đây là frontend sử dụng dữ liệu mẫu được lưu trong trình duyệt. Chưa triển khai backend, đăng nhập/phân quyền thực, cơ sở dữ liệu, đồng bộ nhiều máy hay các giao dịch đồng thời. Lớp repository và tài liệu kết nối API đã được tách riêng.
