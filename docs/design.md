# Phạm vi đã thống nhất

- Giai đoạn hiện tại: UI tiếng Việt cho khách, độc giả và quản trị viên tại một chi nhánh; React + TypeScript.
- Dự án cuối cùng có backend và cơ sở dữ liệu thật; giai đoạn này dùng dữ liệu mẫu tương tác, lưu trên trình duyệt để trình diễn.
- Màn hình: tổng quan, đầu sách/bản sao, độc giả, mượn–trả, tiền phạt, báo cáo, cài đặt.
- Hướng thiết kế đã chọn: sáng, tối giản, phần mềm doanh nghiệp.
- Đã bổ sung cổng độc giả và trang khách theo yêu cầu tiếp theo: đăng nhập/đăng ký, khám phá sách tự do, thẻ thư viện, giữ sách online và lịch sử mượn.
- Trang công khai dùng nhận diện catalogue thư viện đương đại: trắng/xanh mực #2148ED, sans Be Vietnam Pro, chữ mạnh, lưới biên tập và bìa SVG nguyên gốc có motif theo nội dung. Kệ sách 3D thật từ ThreeUI nằm trong góc kệ bên dưới; mobile ưu tiên tìm sách. Phần quản trị giữ thiết kế doanh nghiệp sáng.

## Hệ thống thị giác

Màu: nền #F7F8FA; bề mặt #FFFFFF; chữ #252A32; phụ #68717D; nhấn cam #D95D2C; trạng thái tốt #237A58. Cam giúp nhận diện thao tác chính; màu trạng thái luôn đi cùng chữ.

Chữ: Be Vietnam Pro cho nội dung tiếng Việt, dự phòng Segoe UI và sans-serif. Cỡ chữ nghiệp vụ 13–14px, nội dung 14–16px, tiêu đề 28px; số liệu dùng tabular numerals.

Phần công khai: khung tối đa 1312px, catalogue dùng header tìm kiếm gọn, lưới 4/2 cột; vùng chạm lưu/thêm 44px. Bìa là thiết kế minh họa riêng cho demo, không phải ảnh bìa nhà xuất bản.

Phần quản trị: sidebar 224px, thanh công cụ 76px, lưới nội dung cách 24px. Nội dung canh trái. Biểu đồ lưu thông và danh sách phiếu mượn là trọng tâm; ưu tiên nghiệp vụ tại quầy. Tablet dùng thanh điều hướng gọn; mobile dùng menu đóng mở, các bảng nghiệp vụ cuộn riêng trong vùng được gắn nhãn.

## Mô hình tương tác

- Thêm/sửa đầu sách và độc giả bằng form có nhãn và kiểm tra dữ liệu.
- Lập phiếu tại quầy trong trang riêng: chọn thẻ hoặc nhập người mới không có tài khoản; chọn từng bản/số lượng, hạn trả; kiểm tra rồi xác nhận bàn giao. Cho phép mượn nhiều bản cùng một đầu sách.
- Giữ sách online là nghiệp vụ riêng: giữ bản hai ngày, thư viện chuẩn bị và chỉ lập phiếu khi nhận sách. Hủy hoặc từ chối giải phóng bản đang giữ.
- Trả một phần hoặc toàn bộ sách; tính tiền phạt theo ngày của từng bản trả trễ; tăng tồn khả dụng.
- Gia hạn tuân theo cài đặt; không gia hạn phiếu quá hạn, đã trả hay vượt số lần quy định.
- Thu tiền phạt, tìm kiếm, lọc, phân trang, xem chi tiết, in phiếu A4 và xuất Excel `.xlsx` có định dạng.
- Dialog quản lý focus, Escape để đóng, thông báo kết quả qua vùng live.

## Nguồn và bản sắc

- Kệ sách ThreeUI: https://github.com/MengTo/threeui — mã vendor và giấy phép nằm trong repo, ghi chi tiết ở `docs/threeui.md`.
- Icon Lucide theo giấy phép ISC, lưu trong `public/lucide-LICENSE.txt`.
- Chữ Be Vietnam Pro từ Google Fonts; dự phòng Segoe UI/sans-serif.

Nhận diện catalogue và các bìa SVG là thiết kế riêng của Folio. Bìa dùng motif theo tác phẩm/chủ đề (sa mạc, rừng, hành tinh, cây cam), không phải bìa của nhà xuất bản. Ba lớp CSS catalogue, refinement và member compact ghi lại hệ thống thị giác hiện tại; phần quản trị dùng hệ thống doanh nghiệp riêng.

## Kiểm tra

Giai đoạn đầu dùng Edge qua Chrome DevTools MCP tại 1440×900, 768×1024, 390×844. Đợt cải thiện hiện tại, MCP bị treo nên đã dùng Edge qua Playwright, cùng ba viewport và mobile/touch emulation, screenshot thật và kiểm tra tương tác độc lập. Kết quả cụ thể, giới hạn công cụ và lỗi đã sửa nằm trong `docs/verification-refinement.md` và báo cáo reviewer `docs/independent-review.md`.
