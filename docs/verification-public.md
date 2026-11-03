# Xác minh bản mở rộng Folio

Kiểm tra bằng Chrome DevTools MCP trên Microsoft Edge. Cả trang khách, đăng nhập và không gian độc giả đã được quan sát qua screenshot; phần quản trị được kiểm tra lại các luồng mới.

## Giao diện

| Viewport | Kết quả |
| --- | --- |
| Desktop 1440×900 | Trang chủ với kệ ThreeUI 3D thật, đăng nhập hai cột, danh mục, chi tiết sách và màn lập phiếu tại quầy. |
| Tablet 768×1024 | Hero hai cột, danh sách sách hai cột, điều hướng thu gọn; không tràn ngang toàn trang. |
| Mobile 390×844, mobile + touch emulation | Menu đóng mở, nội dung một cột, form có vùng cuộn, danh mục hai cột, thẻ độc giả và các tab cá nhân; viewport tỉ lệ 1:1. |

Đã xác nhận ở mobile `innerWidth = scrollWidth = 390`, `visualViewport.scale = 1` trên trang chủ, đăng ký, tài khoản và danh mục. Tìm không dấu “nha gia kim” trả về đúng một đầu sách.

## Luồng đăng nhập và độc giả

- Đăng nhập sai hiển thị lỗi email/mật khẩu; đăng nhập demo đúng đi đến đúng vai trò.
- Đăng ký qua UI trên mobile: kiểm tra thông tin, nhập lại mật khẩu và chấp nhận quy định; tạo hồ sơ độc giả, thẻ và phiên đăng nhập.
- Tài khoản độc giả mở URL quản trị sẽ thấy thông báo giới hạn quyền và không render sidebar quản trị.
- Độc giả thêm sách vào danh sách và gửi yêu cầu giữ sách; yêu cầu xuất hiện trong tài khoản với mã, hạn nhận và trạng thái.
- Quản trị thấy yêu cầu, đánh dấu sách sẵn sàng và mở trang bàn giao đã điền đúng độc giả/bản sao.
- Xác nhận bàn giao chuyển yêu cầu sang `fulfilled`, gắn đúng mã phiếu và không tự đánh dấu là đã trả.
- Đăng xuất ở cả độc giả và quản trị quay về trang khách.

## Mượn trực tiếp tại quầy

- Tạo người mượn chỉ với họ tên và số điện thoại, để trống email, không đăng ký tài khoản trực tuyến.
- Chọn hai bản khác nhau của cùng đầu sách; kiểm tra lại rồi lập phiếu.
- Hồ sơ và phiếu được lưu trong cùng một cập nhật; lỗi phiếu không tạo hồ sơ rác.
- Phiếu in A4 có đúng tên người mượn, hai dòng bản sao, ngày mượn, hạn trả và vùng ký. Đã bắt lệnh in trong phiên QA để kiểm tra tài liệu mà không mở hộp thoại in hệ điều hành.

## Excel

- Bắt file trực tiếp từ nút xuất báo cáo, không tạo file thử trong Downloads.
- MIME `.xlsx` đúng và chữ ký ZIP `[80,75,3,4]`; không phải CSV được đổi đuôi.
- Mở lại bằng Artifact Tool và kiểm tra XML: đủ 5 trang tính, 5 Excel Table có bộ lọc, hàng tiêu đề cố định, ngày lưu bằng số/date format, tiền lưu bằng số.
- Đã render và quan sát cả 5 trang: Tổng quan, Phiếu mượn, Sách hoàn trả, Kho sách, Tiền phạt.
- Đối chiếu tổng phiếu, số sách mượn/trả và tiền phạt với dữ liệu trong ứng dụng. Chưa mở bằng Microsoft Excel desktop trong phiên QA.

## ThreeUI

Đã sử dụng mã thật từ repo chính thức MengTo/threeui. Lỗi delta âm ở RAF đầu tiên làm tọa độ sách tăng bất thường đã được sửa bằng chặn delta 0–0,05 giây. Kệ sách render đúng trên ANGLE/Intel UHD 620; chế độ trang trí render theo nhu cầu, có giới hạn DPR và fallback cho reduced motion hoặc software WebGL. Nguồn và giấy phép ghi tại `docs/threeui.md`.

## Kết quả mã nguồn

- Production build TypeScript/Vite thành công.
- 16 kiểm thử thành công: 14 nghiệp vụ mượn/giữ/bàn giao và 2 regression test ThreeUI timing.
- Không có console error/warning ở các lần tải lại và kiểm tra cuối.
- Đã dọn đúng các hồ sơ, tài khoản, phiếu và yêu cầu được tạo riêng cho QA theo mã định danh; giữ lại dữ liệu khác và hai tài khoản demo.

## Phạm vi hiện tại

Đây là bản UI có thao tác và lưu dữ liệu trên trình duyệt. Xác thực, role, giữ tồn kho và lưu trữ nhiều người dùng phải được thực hiện lại ở backend bằng giao dịch và kiểm tra quyền. Chưa có email khôi phục mật khẩu hoặc đồng bộ giữa thiết bị.
