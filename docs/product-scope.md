# Phạm vi sản phẩm và đường nối backend

Folio hiện là frontend tương tác cho một thư viện/chi nhánh, ba đối tượng: khách, độc giả và quản trị viên. Dữ liệu trên trình duyệt phục vụ trình diễn. Đánh giá độc lập nằm trong [independent-review.md](independent-review.md); đây là mô tả phạm vi triển khai, không thay thế kết luận của reviewer.

## Những luồng đã khép kín ở mức UI

| Luồng | Hành vi |
| --- | --- |
| Khách khám phá | Tìm tên/tác giả/ISBN, lọc thể loại/khả dụng, sắp xếp, phân trang; bộ lọc ở URL; chi tiết sách, lưu và xem lại sách không cần đăng nhập. |
| Giữ sách trực tuyến | Danh sách tồn tại sau reload; đăng nhập rồi gửi; chọn đúng bản, giữ hai ngày; thư viện chuẩn bị, bàn giao thành phiếu; hủy/từ chối/hết hạn giải phóng bản. |
| Mượn trực tiếp | Chọn thẻ có sẵn hoặc tạo người mới bằng tên/điện thoại, email tùy chọn; chọn nhiều bản cùng đầu sách, duyệt phiếu, bàn giao và in A4. |
| Độc giả tại quầy lên online | Quản trị xác minh tại quầy, cấp liên kết một lần/72 giờ; độc giả chọn email/mật khẩu; dùng lại mã thẻ và toàn bộ lịch sử. Cấp lại thay liên kết cũ. |
| Độc giả tự phục vụ | Xem đang mượn/lịch sử, gia hạn theo quy định, quản lý yêu cầu, lưu sách, xem khoản phạt/phiếu thu và nhắc việc; đổi mật khẩu bằng mật khẩu hiện tại. |
| Trả và thu phạt | Trả từng phần, đánh dấu bản cần bảo trì, chụp số tiền tại ngày trả; thu toàn bộ một lần bằng tiền mặt hoặc chuyển khoản đã đối soát, lưu mã phiếu thu/ngày/phương thức/tham chiếu/người thu; in phiếu thu. |
| Quản trị và báo cáo | Sách/bản sao, độc giả, phiếu, yêu cầu online, tiền phạt, quy định và sao lưu; Excel đúng tập dữ liệu đang lọc; báo cáo sáu sheet gồm sổ thu theo ngày thanh toán. |

Bản sao đang mượn hoặc giữ được khóa thay đổi tình trạng. Xóa đầu sách có lịch sử mượn hoặc đang giữ bị chặn. Gia hạn kiểm tra cả thẻ, nợ, số lần và ngày quá hạn. Các quy tắc này vẫn phải chạy lại ở backend.

## Điều kiện để vận hành với người dùng thật

1. **API, database và giao dịch:** chuyển repository/actions sang async; schema/migration thật, khóa/unique constraint trên copy và tài khoản, transaction khi giữ–bàn giao–trả–thu tiền. Hai người thao tác cùng bản sách phải chỉ có một người thành công; dùng idempotency để tránh phiếu trùng khi gửi lại.
2. **Xác thực và vòng đời tài khoản:** quyền được xác minh trên server, session/cookie, chính sách mật khẩu, khôi phục bằng email/token, rate limit, xác minh email và liên kết thẻ sau kiểm tra danh tính. Link kích hoạt hiện chỉ dùng trên trình duyệt đang chứa dữ liệu demo; không phải dịch vụ gửi link đa thiết bị.
3. **Theo dõi và đối soát:** audit bất biến phía server, số phiếu thu duy nhất, chính sách điều chỉnh/hoàn tiền có phê duyệt, sao lưu/khôi phục đã thử. Các khoản mẫu đã thu trước khi có `paidAt` được ghi là chưa rõ ngày; không bịa ngày hoặc cộng vào doanh thu theo kỳ.
4. **Thông báo thật:** lịch xử lý hết hạn giữ sách và nhắc trả, email/SMS theo lựa chọn người dùng, trạng thái gửi/thất bại. Tab nhắc việc hiện lấy từ dữ liệu hiện có; chưa gửi thông báo ra ngoài.
5. **Triển khai và kiểm thử hệ thống:** HTTPS/cấu hình môi trường, giám sát lỗi, kiểm thử API/DB đồng thời, khả năng phục hồi và kiểm thử trợ năng/thao tác bàn phím trên toàn bộ luồng. Chưa thể kết luận những phần này từ một bản UI.

Chưa triển khai ở phạm vi một chi nhánh: hàng đợi sách hết bản, liên thư viện/điều chuyển chi nhánh, mua sắm–nhà cung cấp, nhập danh mục hàng loạt/MARC, RFID/máy tự mượn, nộp phạt trực tuyến hoặc thanh toán từng phần. Chỉ mở rộng khi tiêu chí đồ án yêu cầu; các mục đó không được trình bày như tính năng đã có.

## Tham chiếu nghiệp vụ

Đã đối chiếu các nhóm mượn/trả/gia hạn/giữ sách và hồ sơ độc giả–khoản thu với tài liệu chính thức [Koha: Circulation](https://koha-community.org/manual/22.05/en/html/circulation.html) và [Koha: Patrons](https://koha-community.org/manual/23.05/en/html/patrons.html). Đây là nguồn tham chiếu phạm vi nghiệp vụ; Folio không tuyên bố đạt toàn bộ khả năng của Koha.

## Các seam cần nối

- `repository.ts`: đọc/ghi library snapshot demo → API query/mutation.
- `auth.tsx`: auth/link/password demo → dịch vụ xác thực, session và token trên server.
- `domain.ts`, `circulation.ts`: quy tắc dùng cho UI và kiểm thử → kiểm tra lại trong transaction backend.
- `requestQueries.ts`, `ReaderActivity.tsx`: tập dữ liệu hiển thị → query/filter server khi số lượng tăng.
- `exports.ts`, `print.ts`: tệp XLSX/phiếu in từ dữ liệu đã có quyền truy cập; backend phải áp quyền và cung cấp số liệu nhất quán.

Các API dự kiến: `/auth/session`, `/auth/password`, `/readers/:id/activation-links`, `/auth/activate`, `/books`, `/copies`, `/readers`, `/holds`, `/holds/:id/handover`, `/loans`, `/loans/:id/returns`, `/loans/:id/renewals`, `/fines/:id/payments`, `/reports`, `/settings`. Đây là giao ước tích hợp dự kiến, chưa phải API đã chạy.
