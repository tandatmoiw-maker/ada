# Folio — Một nơi để đọc

Ứng dụng UI tiếng Việt cho khách, độc giả và quản trị viên, xây bằng React + TypeScript + Vite. **Chưa có backend và cơ sở dữ liệu thật**; các thao tác, tài khoản demo và phiên đăng nhập đang được lưu trên thiết bị.

## Điểm bắt đầu và tài khoản demo

- Trang chủ mặc định: `http://127.0.0.1:5173/#home`.
- Khách xem kho sách, tìm kiếm, đọc chi tiết và lưu sách trên thiết bị mà không cần đăng ký.
- Trang `#login` có hai nút điền nhanh tài khoản mẫu. Cần bấm **Đăng nhập** để vào ứng dụng.

| Vai trò | Email | Mật khẩu mẫu |
| --- | --- | --- |
| Độc giả | docgia@folio.vn | Docgia@2026 |
| Quản trị viên | admin@folio.vn | Folio@2026 |

Đăng ký độc giả có tạo hồ sơ, kiểm tra trùng thông tin và lưu mật khẩu dưới dạng PBKDF2 với salt. Đây vẫn là mô phỏng frontend: backend tương lai phải đảm nhiệm xác thực và phân quyền thật, không tin vào role hoặc dữ liệu do trình duyệt gửi lên. Khôi phục mật khẩu hiện chỉ hiển thị hướng dẫn liên hệ, chưa gửi email.

## Chạy trên máy

```powershell
pnpm install
pnpm dev
```

Mở địa chỉ Vite in ra, mặc định `http://127.0.0.1:5173`.

```powershell
pnpm build
pnpm test
```

## Chức năng UI

- Trang khách: nhận diện catalogue xanh mực, hệ bìa SVG riêng, kệ sách ThreeUI thật; tìm kiếm/lọc/sắp xếp/phân trang có URL, chi tiết sách, sách đã lưu cho khách, danh sách giữ sách tồn tại sau reload, hướng dẫn và liên hệ.
- Không gian độc giả: thẻ thư viện, sách đang mượn/lịch sử, gia hạn, sách đã lưu, yêu cầu giữ sách và hủy yêu cầu, thông tin tài khoản, đổi mật khẩu, khoản phạt/phiếu thu và nhắc việc.
- Yêu cầu online giữ đúng bản sách hai ngày. Quản trị chuẩn bị sách, rồi bàn giao tại quầy để chuyển thành phiếu mượn; gửi yêu cầu không tự ghi nhận là đã nhận sách.
- Lập phiếu tại quầy: người đã có thẻ hoặc người mới chỉ có họ tên/số điện thoại; email không bắt buộc, không tạo tài khoản đăng nhập. Chọn nhiều bản cùng đầu sách, kiểm tra phiếu trước khi bàn giao.
- In phiếu A4 gồm người mượn, mã bản sao, hạn trả và vùng ký xác nhận.

- Tổng quan với số liệu và biểu đồ từ dữ liệu hiện tại.
- Danh mục sách: tìm kiếm không dấu, lọc, phân trang, thêm/sửa/xóa đầu sách chưa có lịch sử; thêm và quản lý từng bản sao.
- Độc giả: tạo/cập nhật thẻ, khóa/mở thẻ, quản lý hạn thẻ, xem lịch sử; cấp liên kết kích hoạt một lần/72 giờ cho thẻ tại quầy để dùng lại hồ sơ online.
- Mượn–trả: tạo phiếu hai bước, chọn sách còn bản, trả từng phần, gia hạn, nhận sách cần bảo trì.
- Quá hạn và tiền phạt: tính theo từng cuốn/ngày tại thời điểm trả; thu tiền mặt/chuyển khoản đã đối soát, lưu ngày thu, mã phiếu thu, tham chiếu, người thu và in phiếu thu. Bản ghi mẫu cũ thiếu ngày thu được ghi rõ.
- Xuất Excel `.xlsx` từ danh mục, độc giả, phiếu, yêu cầu online và tiền phạt; nút khóa trong lúc tạo tệp. Báo cáo đầy đủ gồm 6 trang: Tổng quan, Phiếu mượn, Sách hoàn trả, Kho sách, Tiền phạt và Sổ thu tiền. Sổ thu theo ngày thanh toán thực tế. Có bảng lọc, hàng tiêu đề cố định, ngày và tiền ở đúng kiểu dữ liệu.
- Cài đặt quy định; sao lưu toàn bộ dữ liệu JSON.
- Tìm nhanh bằng Ctrl+K; điều hướng theo URL hash; dialog hỗ trợ Escape và giữ focus.

Dữ liệu mẫu được tạo theo ngày hiện tại và lưu vào `localStorage` sau thao tác đầu tiên. Không dùng dữ liệu thật/nhạy cảm trong bản UI này. Có thể sao lưu dữ liệu hiện tại tại Cài đặt thư viện. Hồ sơ độc giả và tài khoản có liên kết; không nên xóa một phần dữ liệu khi đang sử dụng.

## Nối backend

`src/domain.ts` và `src/circulation.ts` định nghĩa thực thể/quy tắc, giữ bản sao và bàn giao. `src/repository.ts` cô lập đọc/ghi dữ liệu mẫu; `src/auth.tsx` cô lập đăng nhập demo. `src/store.tsx` quản lý cập nhật và thông báo; khi tích hợp API cần chuyển adapter và hành động sang async, bổ sung xử lý xung đột và kiểm tra quyền phía server.

Kệ sách được vendor từ repo chính thức `MengTo/threeui`, không phải chỉ tham khảo ảnh. Mã nguồn, cải tiến timing, chế độ render theo nhu cầu và các nhánh fallback được ghi trong `docs/threeui.md`. Giấy phép ở `public/threeui/`. ThreeUI và ExcelJS chỉ tải phần nặng khi cần.

Backend phải kiểm tra lại toàn bộ quy tắc và giao dịch nguyên tử khi giữ bản sao. Frontend không thay thế xác thực, phân quyền, kiểm tra hợp lệ phía server hay audit log. Số tiền phạt được chụp tại thời điểm nhận trả; quy định mới không sửa các khoản phạt đã ghi nhận.

Đề xuất nhóm API: `/books`, `/copies`, `/readers`, `/loans`, `/loans/:id/returns`, `/loans/:id/renewals`, `/fines/:id/payments`, `/reports`, `/settings`. Định danh và dữ liệu mẫu không phải migration database.

Phạm vi và hệ thống thiết kế: `docs/design.md`. Thuật ngữ: `CONTEXT.md`. Kết quả kiểm tra bản mở rộng: `docs/verification-public.md`. Kiểm tra quản trị giai đoạn đầu: `docs/verification.md`.

Đánh giá độc lập và phạm vi thương mại: [docs/independent-review.md](docs/independent-review.md), [docs/product-scope.md](docs/product-scope.md). Kiểm tra đợt cải thiện: [docs/verification-refinement.md](docs/verification-refinement.md).
