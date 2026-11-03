# Xác minh đợt cải thiện Folio

Ngày kiểm tra: 02–03/11/2026. Đợt này được thực hiện sau báo cáo độc lập tại [independent-review.md](independent-review.md). Reviewer không sửa mã ứng dụng; những lỗi reviewer tìm thêm được trả lại agent triển khai để sửa và kiểm tra lại.

## Công cụ và tính độc lập

- Baseline đã được reviewer quan sát bằng Chrome DevTools MCP trên Edge.
- Trong vòng sau, Chrome DevTools MCP bị treo ở `navigate` và `list_pages`; đã dừng lệnh, không coi đó là kiểm tra thành công.
- Dùng Playwright với **Microsoft Edge**, browser context biệt lập và screenshot thật. Mobile có `isMobile`, `hasTouch` và DPR 1. Không dùng dữ liệu phiên người dùng đang mở; browser/context kiểm thử đều đóng sau khi chạy.
- Root kiểm tra chức năng; reviewer tự chụp lại ba viewport, kiểm tra tương tác và đánh giá độc lập. Các process Edge chạy tuần tự sau khi gặp hiện tượng GPU không phản hồi; vòng cuối dùng `--disable-gpu` và reduced motion. Kệ ThreeUI đi qua fallback trong các context đó; kết quả hardware WebGL ở giai đoạn trước được lưu trong `verification-public.md`.

## Build và quy tắc nghiệp vụ

`pnpm build` thành công. `pnpm test`: **20/20** bài qua, gồm request search/hạn giữ, mượn–trả từng phần, phạt theo từng ngày/bản, giới hạn tổng đang mượn/giữ, walk-in, bàn giao đúng bản một lần, bảo vệ bản sao đang giữ, ghi nhận thu tiền không trùng, điều kiện gia hạn và timing ThreeUI.

Build vẫn có cảnh báo kích thước chunk của renderer ThreeUI và ExcelJS. Hai phần nặng được tải động khi cần, chưa được coi là tối ưu hoàn toàn.

## Luồng đã xác minh bằng giao diện

| Luồng | Bằng chứng |
| --- | --- |
| Guest basket reload | Thêm Hoàng tử bé, mở danh sách giữ, reload vẫn còn sách. |
| Guest saved | Lưu và mở được trang sách đã lưu không cần login. Bỏ lưu sau khi chuyển vào tài khoản, logout/login không tự thêm lại. |
| Catalogue | Tìm/lọc khôi phục từ URL, xóa query đúng, phân trang; search request theo tên sách. |
| Offline → online | Quản trị cấp link từ hồ sơ DG-0002; kích hoạt bằng email/mật khẩu, số độc giả không tăng, readerId và toàn bộ quan hệ loan giữ nguyên. |
| Cấp lại/kích hoạt một lần | Reviewer tự xác nhận link cũ bị vô hiệu sau cấp lại; link mới mở trong cùng tab hoạt động; dùng lại link đã kích hoạt bị từ chối. Lỗi giữ token cũ trong state đã được sửa bằng key theo token ở router. |
| Password | Đổi bằng mật khẩu hiện tại, kiểm tra xác nhận mật khẩu mới và thông báo kết quả. |
| Reader | Các tab sách, yêu cầu, lưu, khoản phạt, nhắc việc và tài khoản hoạt động. |
| Payment | Thu chuyển khoản với mã tham chiếu; lưu `paidAt`, `paymentMethod`, `paymentReference`, `collectedBy`, `receiptId`. Phiếu in chứa đúng mã giao dịch. |
| Report | Nút UI tạo XLSX thật, mở lại bằng ExcelJS, sáu sheet; sổ thu có ngày kiểu Date và tiền kiểu number. |
| Request export | Tạo yêu cầu Cây cam ngọt, lọc theo tên sách tại quản trị, tải đúng `yeu-cau-giu-sach.xlsx`; cột đầu là Mã yêu cầu và dòng dữ liệu đúng sách đang lọc. |

Hai script chạy tương tác (`product-qa.mjs`, `financial-qa.mjs`) có tổng 12 kịch bản qua và không có page error. Reviewer cũng chạy script financial và bộ kiểm tra riêng; kết quả riêng của reviewer được ghi trong báo cáo độc lập. Script và tệp dữ liệu QA nằm trong `.packages`/`artifacts`, được gitignore.

## Excel

Đã kiểm tra tệp tải từ UI, không chỉ gọi hàm exporter trong mã. Dùng Artifact Tool mở lại và render Tổng quan/Sổ thu tiền; quan sát ảnh render. Workbook có sáu native tables, header đóng băng và ngày/tiền đúng kiểu. Các khoản cũ không có ngày thu không được cộng vào số thực thu theo kỳ.

Microsoft Excel desktop chưa được mở trong đợt kiểm tra này. Không khẳng định đã kiểm tra mọi ứng dụng đọc XLSX.

## Responsive và giới hạn

Reviewer đã quan sát Home, Catalogue, Login, Member, Nhắc việc, Khoản phạt, form đổi mật khẩu, dialog thu tiền và dialog cấp link ở 1440×900, 768×1024 và 390×844 touch. Không có overflow toàn trang hoặc page error trong các màn kiểm tra. Nút lưu/thêm sách 44×44px. Catalogue đưa đầu sách đầu lên khoảng y456 desktop và y487 mobile, thay vì y689/y642 ở vòng đầu.

Vòng Member Compact kiểm tra lại riêng ba viewport sau khi thu gọn greeting/thống kê và đưa thẻ mobile vào nút mở/đóng. Ở mobile mặc định, sách và hạn trả đầu tiên nằm trong màn hình đầu (đáy nhãn hạn trả khoảng y794, dưới chiều cao viewport 844). Phần thẻ vẫn mở được đầy đủ khi cần.

Reviewer phát hiện trạng thái mở thẻ bị dồn ngang do `display:flex`; đã sửa về `display:block` và chụp lại riêng mobile mở/đóng. Brand, tên, mã thẻ và hạn thẻ hiển thị đúng. Các vấn đề mới tìm trong vòng kiểm tra được giữ lại trong báo cáo để đối chiếu, không xóa lịch sử phát hiện.

Hồi quy màu bìa: reviewer đổi màu thật qua form quản trị sang `#342f35` rồi `#91b5c6`, quan sát bìa public và reload. Màu được giữ; chữ tự chọn tương phản lần lượt 13,09 và 6,01. Đã xem lại Home ở ba viewport sau thay đổi, không overflow/page error. Ảnh mới nhất: `artifacts/reviewer-latest-{desktop,tablet,mobile}-home.png`.

Những phần chưa đạt vận hành thật được ghi trong [product-scope.md](product-scope.md): backend/DB transaction, auth và token phía server, email/SMS, audit/đối soát, triển khai và kiểm thử hệ thống. QA UI không chứng minh các phần đó.
