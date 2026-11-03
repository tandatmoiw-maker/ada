# Đánh giá độc lập Folio

**Trạng thái sau sửa:** đã tái đánh giá độc lập và đóng F01–F09 trong phạm vi UI đã thống nhất. Xem [kết luận sau sửa](#kết-luận-sau-sửa) ở cuối tài liệu. Các nhận xét baseline được giữ nguyên để đối chiếu; không phải toàn bộ là lỗi còn tồn tại.

Người đánh giá: agent `independent_product_review`, tách khỏi agent triển khai. Baseline ngày 02/11/2026; các vòng tái đánh giá kéo dài 02–03/11/2026. Đây là đánh giá bản UI trước đợt cải thiện hiện tại; số dòng bên dưới là vị trí ở bản đã đọc. Những sửa đổi tiếp theo sẽ được kiểm tra trong phần tái đánh giá, không sửa lại nhận xét ban đầu để làm đẹp kết quả.

## Kết luận

**Bản hiện tại có nền tảng nghiệp vụ đủ để phát triển thành đồ án thư viện, nhưng chưa đủ chắc và chưa đủ đặc sắc để coi là bản trình diễn cuối cùng. Chưa phải sản phẩm có thể vận hành thương mại.** Đăng nhập, phân vai giao diện, quản lý sách/bản sao, độc giả, mượn tại quầy, giữ sách online, trả từng phần, gia hạn và Excel đều đã có. Vì vậy vấn đề chính không phải thiếu thật nhiều menu. Vấn đề là một số hành trình chưa khép kín, tính nhất quán của bản sao còn hở, và thiết kế công khai có bố cục/màu/chữ quá quen thuộc.

Nhận xét “giống Anthropic” có cơ sở về cảm giác thị giác: nền giấy kem, chữ serif lớn nhẹ, xanh rêu đậm, màu đất nhỏ, khoảng trắng rộng, lời giới thiệu trừu tượng. Đây là nhận xét về tổ hợp thiết kế nhìn thấy, **không phải kết luận sao chép**. Việc dùng mã ThreeUI thật không tự tạo bản sắc nếu phần còn lại vẫn dùng cùng một mẫu landing page.

## Cách kiểm tra và giới hạn

- Đã đọc mã `PublicExperience.tsx`, `components.tsx`, `public.css`, `auth.tsx`, `domain.ts`, `circulation.ts`, `CounterDesk.tsx`, `LoanRequests.tsx`, `pages.tsx`, `modals.tsx`, `repository.ts`, `exports.ts` cùng README và tài liệu phạm vi.
- Đã quan sát screenshot hiện có: `artifacts/public-desktop-1440.webp`, `public-tablet-768.webp`, `public-mobile-390.webp`, `desktop-1440.webp`, `mobile-390.jpg`.
- Đã mở trang chạy thật bằng Chrome DevTools MCP trong **Microsoft Edge 156**. Dùng browser context biệt lập tên `independent-review`; không ghi vào kho dữ liệu của người dùng.
- Đã quan sát screenshot desktop 1440×900, tablet 768×1024, mobile 390×844 với mobile/touch emulation. Kiểm tra thêm catalogue và màn yêu cầu đăng nhập trên điện thoại. Không thấy tràn ngang ở các trang đã kiểm tra; điều đó không chứng minh mọi dialog đều ổn.
- Đã tái hiện qua thao tác thực: thêm một cuốn vào danh sách giữ sách, thấy số lượng 1, reload và số lượng trở về 0. Đã lưu một cuốn dưới vai trò khách rồi vào trang tài khoản: vẫn chỉ có màn yêu cầu đăng nhập, không có trang tập hợp sách đã lưu của khách.
- Không tự nhận đã kiểm thử mọi nghiệp vụ bằng browser. Các lỗi integrity bên dưới được tìm từ mã. Khi bắt đầu thử bằng hàm thuần, agent triển khai đã sửa chặn xóa sách đang giữ; kết quả thử mới đã báo lỗi đúng. Cần kiểm tra lại toàn bộ sau khi triển khai xong.

## Các phát hiện cần sửa

### P1 — Lỗi ảnh hưởng luồng hoặc dữ liệu

| Mã | Phát hiện và bằng chứng | Hệ quả | Yêu cầu sửa |
| --- | --- | --- | --- |
| F01 | `src/PublicExperience.tsx:36`: giỏ giữ sách chỉ dùng `useState([])`. Edge: thêm Hoàng tử bé → header 1 cuốn → reload → 0 cuốn. | Người dùng mất lựa chọn khi tải lại; ngắt hành trình khám phá–đăng nhập–giữ sách. | Lưu giỏ có kiểm tra schema, phục hồi khi tải lại, bỏ ID sách đã xóa; làm rõ giỏ của khách và tài khoản. |
| F02 | `src/PublicExperience.tsx:23–29`, `51`, `107–118`: khách lưu bookmark được nhưng danh sách saved chỉ nằm sau `MemberSpace`, màn khách bị yêu cầu đăng nhập. | Lời hứa “lưu sách trên thiết bị không cần tài khoản” thiếu đường quay lại xem. | Có route sách đã lưu cho khách và lối truy cập nhìn thấy từ header/menu; không ép đăng nhập để xem lựa chọn đã lưu. |
| F03 | Baseline `src/domain.ts:69–72`: xóa sách chỉ kiểm tra lịch sử loan. Baseline `src/modals.tsx:57–59`: copy busy chỉ lấy từ loan, không tính active request. | Có thể xóa đầu sách đang giữ hoặc đổi copy đang giữ sang bảo trì/mất; request mất dữ liệu hoặc không bàn giao được. | Quy tắc ở domain phải chặn xóa/đổi tình trạng đang giữ. UI phân biệt có sẵn, đang giữ, đang mượn. Kiểm thử cả pending/ready, hết hạn và hủy. Agent triển khai đã bắt đầu sửa chặn xóa trong lúc review; chưa đóng F03 trước re-review. |
| F04 | `src/pages.tsx:66`: nút Xuất Excel luôn ánh xạ `filtered` loan, kể cả khi tab hiện tại là requests. | Người dùng đang xem yêu cầu giữ sách nhưng xuất file phiếu mượn trống/sai loại dữ liệu. | Xuất đúng bảng requests đang lọc, tên file/cột đúng nghiệp vụ; số kết quả cũng dựa trên cùng tập lọc. |
| F05 | `src/auth.tsx:47`: đăng ký bằng thông tin của người đã có hồ sơ offline bị từ chối với hướng dẫn liên kết tại quầy. Không tìm thấy thao tác liên kết tài khoản ở quản trị. | Người có thẻ thật không thể chuyển sang dùng online qua UI hiện có. Quầy không làm được việc được hướng dẫn. | Bổ sung hành trình liên kết do quản trị xác nhận, hoặc thể hiện một yêu cầu liên kết có trạng thái xử lý. Không tự liên kết chỉ bằng việc biết số điện thoại. |
| F06 | `src/domain.ts:7`, `73`: Fine chỉ có `paid:boolean`; thao tác thu không lưu ngày thu, phương thức, người thu hay mã giao dịch. `src/exports.ts:67` đã dùng nhãn thận trọng để tránh giả làm doanh thu trong kỳ. | Có thể demo xác nhận thu, nhưng khó giải trình “ai thu lúc nào”; không báo cáo thu tiền theo ngày thanh toán thực. | Ghi nhận thanh toán như một sự kiện có thời gian, phương thức, người thu và mã; tránh thu trùng. Phần backend phải bảo đảm nguyên tử. |

### P1 — Chất lượng trình bày ảnh hưởng trực tiếp đồ án

**F07 — Thiếu một hệ nhận diện có chủ ý.** `src/public.css:3`, `src/PublicExperience.tsx:74–78`. Trang đầu là mẫu hai cột headline + khung đồ họa, sau đó dải lợi ích, lưới bốn sách, ba category và khối mời tham gia. Tổ hợp cream/Lora/forest và câu chữ “một thế giới / một khoảng lặng / một góc nhìn” khiến nó giống nhiều landing page tạo tự động. Thiết kế cần dựa trên đặc trưng thư viện: catalogue, thẻ mượn, mã phân loại, tuyển tập của thủ thư, thứ tự kệ, tình trạng sách và thao tác tìm kiếm rõ ngay đầu trang. Có thể chọn một hướng như thư viện văn hóa đương đại, chữ sans mạnh, xanh cobalt, lưới biên tập; đây là hướng đề xuất, không phải bắt buộc dùng đúng màu.

**F08 — Sách thiếu bản sắc dù là nội dung chính.** `src/components.tsx:12`: mọi sách dùng cùng cấu trúc bìa tên tác giả–tên sách–gạch ngang–chữ f; đổi mỗi màu. Trong screenshot, Nhà giả kim, Rừng Na Uy, Hoàng tử bé, Cây cam ngọt cùng một hình thức bìa. Điều này làm catalogue giống dữ liệu giả. Cần nhiều hệ bìa riêng có motif, bố cục và màu phù hợp từng cuốn, hoặc ảnh bìa hợp lệ với fallback tốt. Đừng dùng các hình ảnh không liên quan chỉ để trang “đẹp”.

**F09 — Nội dung/thao tác quan trọng quá nhỏ trên điện thoại.** Edge đo được nút lưu 28×28px, nút thêm 26×26px; nhiều label trong `public.css` là 9–11px. Trên home mobile, mục sách đầu tiên bắt đầu khoảng y=1014px: cả màn hình đầu dành cho câu giới thiệu và 3D. Scene có nhiều khoảng tường phía trên và sách pastel rất nhạt ở một số góc máy. Cần tăng vùng chạm, cỡ chữ và tương phản, đưa tìm kiếm hoặc sách nổi bật vào sớm hơn, đồng thời giới hạn chiều cao 3D trên điện thoại. ThreeUI nên hỗ trợ khám phá chứ không chiếm hết vị trí của việc chọn sách.

### P2 — Khoảng trống cần lên kế hoạch

- **Vòng đời tài khoản:** profile chỉ đọc và yêu cầu liên hệ quầy (`PublicExperience.tsx:118`); chưa đổi mật khẩu, cập nhật thông tin liên hệ, khôi phục qua email, xác minh email. Có thể hoàn thiện giao diện và validation ngay, nhưng gửi email/reset token phải chờ backend.
- **Khám phá sách:** description chỉ có vài chuỗi hard-code theo ID và fallback chung (`PublicExperience.tsx:13–19`, `95`); admin chưa chỉnh mô tả/bìa/ngôn ngữ/vị trí kệ. Sản phẩm thực cần metadata quản lý được để catalogue đáng tin.
- **Thông báo:** độc giả phải tự mở tab requests/loans để phát hiện thay đổi; chưa có inbox thống nhất cho sẵn sàng nhận, sắp đến hạn, quá hạn, hết hạn giữ. Email/push có thể để giai đoạn API.
- **Kho sách/lưu thông nâng cao:** chưa có yêu cầu chờ sách đã hết, lịch sử điều chỉnh bản sao, kiểm kê, nhập lô, mã vạch thực, luồng báo mất và bồi thường. Không cần nhồi tất cả vào bản đồ án nếu đề cương không yêu cầu; phải ghi phạm vi rõ.
- **Báo cáo:** đã có XLSX thực, đây là điểm tốt. Cần khoảng ngày tùy chọn, xuất đúng dataset ở mọi tab, trạng thái đang tạo file và thông báo thất bại rõ. Chưa có paidAt nên chưa thể gọi các số liệu là báo cáo dòng tiền theo kỳ.
- **Độ bền mã:** nhiều component/trang nằm trên các dòng JSX rất dài; thay đổi dễ gây sửa nhầm. `repository.ts:8` chỉ validate dữ liệu lưu rất nông. Cần chia theo feature và schema khi nối API. Đây không phải lý do trì hoãn cải thiện UI.

## Đã có gì và còn thiếu gì để gọi là đầy đủ

| Nhóm | Đủ để trình diễn hiện tại | Còn thiếu có giá trị cho đồ án | Bắt buộc nếu vận hành thật |
| --- | --- | --- | --- |
| Khách | Tìm/lọc, chi tiết, guide/contact, thêm vào danh sách giữ | Trang sách lưu cho khách, phục hồi giỏ, dữ liệu sách phong phú | Nội dung quản lý từ server, khả dụng chính xác |
| Độc giả | Đăng ký/đăng nhập demo, thẻ, mượn/lịch sử, gia hạn, request/hủy | Liên kết thẻ offline, profile/password, thông báo và chi tiết khoản phạt | Xác thực server, reset token, bảo vệ dữ liệu riêng, session/revocation |
| Quầy | Người mới không email, nhiều bản cùng đầu sách, review, bàn giao request, in phiếu | Trạng thái held nhất quán, lịch sử thao tác/thu tiền, xử lý lỗi rõ | Transaction giữ–mượn–trả, chống bàn giao/thu trùng, nhiều nhân viên đồng thời |
| Kho/độc giả | CRUD và bản sao, khóa thẻ/hạn thẻ, tìm/lọc | Mô tả/bìa/vị trí kệ, bảo toàn lịch sử request | Ràng buộc database, phân quyền tác vụ, import/migration an toàn |
| Báo cáo | XLSX có nhiều sheet và kiểu ngày/số | Xuất request đúng bộ lọc, ngày thanh toán thực, khoảng ngày tùy chọn | Query server, đối soát, audit và backup/restore được kiểm thử |

**P0 khi xét triển khai thương mại:** xác thực/phân quyền và dữ liệu đang nằm trên trình duyệt; chưa có database/giao dịch đồng thời/backup server. Đây là giới hạn đã được thống nhất của giai đoạn UI, không phải yêu cầu agent phải tự xây backend trong đợt sửa giao diện. Không nên dùng lời “đã đủ thương mại” cho bản frontend. Đồ án có thể đạt chất lượng tốt nếu demo các luồng chính khép kín, có chứng cứ test và tài liệu API/schema rõ cho giai đoạn tiếp theo.

## Năm gói cải tiến nên làm ngay

1. **Định hình lại cổng công khai:** nhận diện khác biệt, catalogue/tìm kiếm là trọng tâm, bìa sách đa dạng, ThreeUI được bố trí có chủ đích; kiểm tra ảnh thật ba viewport.
2. **Khép kín hành trình khách:** giỏ phục hồi, trang sách đã lưu, đường điều hướng rõ; tăng vùng chạm trên mobile và có phản hồi thao tác.
3. **Bảo vệ nghiệp vụ bản sao và xuất dữ liệu:** ràng buộc held copy trong domain/UI, chặn xóa lịch sử, xuất requests đúng bộ lọc; regression tests có giá trị.
4. **Hoàn thiện tài khoản và hồ sơ:** profile/password, quá trình liên kết hồ sơ tại quầy có xác nhận quản trị; ghi rõ phần gửi email/xác minh sẽ dùng backend.
5. **Làm minh bạch vận hành:** lịch sử thu tiền có thời điểm/phương thức, inbox độc giả về request/hạn trả, report dùng ngày thanh toán và trạng thái tạo file. Ưu tiên trường dữ liệu và thao tác thật hơn thêm số liệu trang trí.

## Tiêu chí tái đánh giá

Reviewer sẽ kiểm tra lại ảnh thật và các thay đổi sau khi agent triển khai báo sẵn sàng. Một issue chỉ được đánh dấu đã sửa khi có chứng cứ tương ứng. Giao diện đẹp hơn không đóng các lỗi nghiệp vụ; test xanh không tự chứng minh thẩm mỹ. Phần ghi nhận kết quả sau sửa sẽ được thêm bên dưới.

## Tái đánh giá thị giác — vòng 1

Đã đọc và xem bản mới `CatalogueHome.tsx`, `catalogue.css`, `BookArtwork.tsx`. **Chrome DevTools MCP bị treo** ngay thao tác navigate, sau đó list_pages cũng không phản hồi; đã dừng hai lần chờ, không nhận screenshot qua MCP ở vòng này. Công cụ cua cũng báo Edge không sẵn. Đã dùng **Playwright với Microsoft Edge (`channel: msedge`)**, browser context biệt lập, để quan sát giao diện thật. Đây là phương án thay thế, không phải hoàn tất kiểm tra bằng MCP.

Ảnh được reviewer tự tạo, tách tên khỏi ảnh của agent triển khai:

- `artifacts/reviewer-desktop-home.png`, `reviewer-desktop-books.png`, `reviewer-desktop-catalogue.png` — 1440×900.
- `artifacts/reviewer-tablet-home.png`, `reviewer-tablet-books.png`, `reviewer-tablet-catalogue.png` — 768×1024.
- `artifacts/reviewer-mobile-home.png`, `reviewer-mobile-books.png`, `reviewer-mobile-catalogue.png` — 390×844, `isMobile:true`, `hasTouch:true`.
- Script kiểm tra: `.packages/reviewer-visual.mjs`. Ảnh vòng này dùng reduced motion để chụp bố cục ổn định; **chưa chứng minh renderer ThreeUI chạy trong lần kiểm tra này**.

Kết quả quan sát: cả ba viewport có `scrollWidth === innerWidth`, không ghi nhận `pageerror`. Nút lưu và thêm sách đo được 44×44px. Phần đầu trang mới dùng sans đậm, xanh in cobalt và poster bìa; đã thay tổ hợp Lora/cream/forest cũ. F07 có thay đổi thực chất, cần xem tiếp các trang khác để kết luận toàn bộ hệ thống nhất quán.

Các điểm cụ thể đã gửi agent triển khai để sửa tiếp:

1. **Mobile — link xem kho sách bị bó chiều rộng:** trong `reviewer-mobile-books.png`, “Xem toàn bộ kho sách” xuống hai dòng ở một block chỉ khoảng 95px, dù cả hàng còn trống. Điều này cộng khoảng trống vào đầu danh sách. Nên cho link chiều rộng tự nhiên và một dòng dưới mô tả; giữ vùng chạm lớn.
2. **Bìa minh họa chọn motif chưa theo nội dung:** Cây cam ngọt của tôi đang là biểu đồ cột và đường tăng trưởng tài chính; Lược sử thời gian dùng họa tiết cây/rừng giống Rừng Na Uy. Đây là vấn đề ngữ nghĩa, làm catalogue vẫn có cảm giác dữ liệu gắn ngẫu nhiên. Nên ánh xạ chủ ý theo cuốn hoặc thể loại, thay vì chỉ phân bố motif cho đa dạng.
3. **Catalogue — phần tra cứu vẫn quá cao:** ở desktop, hàng bìa đầu bắt đầu khoảng y=689px; mobile khoảng y=642px và tên cuốn đầu chưa hiện trong màn hình cao 844px. Có thể giảm khoảng dọc quanh headline, category và toolbar để trang danh mục phục vụ tìm sách nhanh hơn. Không cần giảm kích thước vùng chạm.
4. **Home mobile:** section tuyển chọn bắt đầu y≈660px, nhưng bìa đầu còn xuống sau phần heading/link. Sửa điểm 1 và giảm khoảng trắng quanh heading sẽ giúp thấy nội dung sách sớm hơn mà không cần thêm poster lớn trên điện thoại.

Vòng này chỉ xem thị giác. Chưa đóng các issue tài khoản, thanh toán, integrity và exporter vì các phần đó vẫn đang được triển khai.

## Tái đánh giá chức năng và thị giác cuối

Reviewer tiếp tục làm việc chỉ đọc mã ứng dụng, tự chạy kiểm tra và gửi lỗi để agent triển khai sửa. Không tự sửa ứng dụng rồi tự đóng lỗi. Các script reviewer nằm trong `.packages/`, ảnh và dữ liệu QA nằm trong `artifacts/`; đều dùng context Edge biệt lập, không chỉnh dữ liệu của người dùng.

### Chứng cứ thực tế

- **Ba viewport:** 1440×900, 768×1024 và 390×844 với `isMobile:true`, `hasTouch:true` cho điện thoại. Quan sát home, catalogue, login, member, nhắc việc, khoản phạt, form mật khẩu, dialog thanh toán và dialog liên kết thẻ. `scrollWidth` bằng chiều rộng viewport ở các màn đã kiểm tra; không ghi nhận `pageerror`.
- **Ảnh:** `artifacts/reviewer-final-{desktop,tablet,mobile}-{home,catalogue,login,member,notifications,reader-fines,password,payment-dialog,reader-access-dialog}.png`. Member mới nhất là `reviewer-compact-{desktop,tablet,mobile}.png`; ảnh mở thẻ là `reviewer-compact-mobile-card-expanded.png`.
- **Độ gọn của catalogue:** hàng sách đầu lên từ khoảng y=689 xuống y=456 trên desktop; từ khoảng y=642 xuống y=487 trên mobile. Tên sách, tác giả và tồn khả dụng đã thấy trong màn đầu 390×844. Link xem kho sách trên home mobile đã về một dòng.
- **Member mobile:** trạng thái mặc định đã cho thấy tên sách và hạn trả trong màn đầu, hạn trả đầu tiên có bottom≈794px trên màn cao 844px. Thẻ được mở/đóng bằng nút có `aria-expanded`; không bỏ chức năng thẻ. Thẻ mở hiển thị tên, mã và hạn thẻ đúng bố cục sau sửa cuối.
- **Năm kịch bản tài chính/xuất file:** reviewer tự chạy `.packages/financial-qa.mjs` và xác nhận cả năm PASS: ghi nhận thu chuyển khoản có đủ metadata; bản in chứa mã tham chiếu; tải XLSX thật và mở lại bằng ExcelJS có sáu sheet; độc giả gửi yêu cầu giữ sách; tìm theo tên sách và xuất đúng các requests khớp bộ lọc. Kết quả ở `artifacts/financial-qa-results.json`, `errors:[]`.
- **Ba kịch bản kích hoạt do reviewer viết:** `.packages/reviewer-activation.mjs` xác nhận cấp lại vô hiệu hóa liên kết cũ; liên kết mới kích hoạt đúng hồ sơ, giữ nguyên toàn bộ reader IDs và loan records; liên kết đã dùng không thể tạo thêm tài khoản. Kết quả `reviewer-activation-results.json`, cả ba PASS, `errors:[]`.
- **Ràng buộc kho do reviewer kiểm tra:** `.packages/reviewer-domain.mjs` gọi hàm domain với dữ liệu riêng. Cả request pending và ready đều chặn đổi bản sang repair/lost và chặn xóa đầu sách; hủy request trả lại bản khả dụng và cho phép thay đổi tình trạng. Không ghi dữ liệu này vào ứng dụng.
- **Giỏ/sách lưu:** tự thao tác giữ sách rồi reload vẫn còn; khách mở được trang sách lưu; menu mobile đi được tới trang này. Đăng nhập hợp nhất sách đã lưu, bỏ lưu rồi đăng xuất/đăng nhập lại không làm sách bị thêm trở lại.

Hai lỗi mới được phát hiện trong vòng kiểm tra này đã được gửi lại và sửa, sau đó kiểm tra lại đúng chỗ:

1. Đổi từ liên kết kích hoạt cũ sang mới trong cùng tab vẫn dùng token trong state cũ. Agent triển khai đã key component theo token; kịch bản cấp lại–mở link cũ–mở link mới–dùng lại link hiện PASS.
2. Thẻ mobile khi mở dùng `display:flex` theo hàng ngang, làm tên/mã/hạn thẻ dồn cột. Agent triển khai đổi về layout block; reviewer chụp lại riêng mobile và xác nhận bố cục bình thường, nút mở/đóng vẫn hoạt động.

Script visual lần đầu có một lỗi selector: “Sách đã lưu” trùng link trong menu và footer. Reviewer sửa selector để tìm trong navigation rồi chạy lại riêng mobile. Đây là lỗi script kiểm tra, không phải lỗi app. Vì vậy `reviewer-final-results.json` đầu có ghi failure selector; kết quả mobile sau sửa nằm trong `reviewer-final-mobile-results.json`.

### Đối chiếu F01–F09

| Mã | Trạng thái sau sửa | Căn cứ đóng trong phạm vi UI |
| --- | --- | --- |
| F01 | **Đóng** | Giỏ được phục hồi sau reload; kiểm tra schema và ID sách còn tồn tại. Đã thao tác thực qua Edge. |
| F02 | **Đóng** | Có route sách lưu cho khách, link header/menu, hợp nhất khi đăng nhập; sách đã bỏ lưu không tự trở lại sau lần đăng nhập mới. |
| F03 | **Đóng** | `copyCommitment`, `changeCopyCondition`, guard xóa sách và trạng thái held trong dialog; reviewer đã kiểm tra hàm thuần với pending/ready/hủy. |
| F04 | **Đóng** | `matchingRequests` được dùng cho hiển thị, đếm và xuất. Đã tải và mở workbook thực, kiểm tra tên file và dòng dữ liệu của sách đang lọc. |
| F05 | **Đóng** | Có cấp liên kết tại quầy sau xác minh, hiệu lực 72h, cấp lại/thay thế và dùng một lần. Đã kiểm tra độc lập cả hồi quy token cùng tab và giữ lịch sử thẻ. Liên kết xuyên thiết bị vẫn thuộc backend, UI có nói rõ giới hạn. |
| F06 | **Đóng** | Có `paidAt`, phương thức, tham chiếu, người thu và mã phiếu thu; chặn thu trùng. Đã xác nhận UI, dữ liệu lưu, bản in và sheet sổ thu. |
| F07 | **Đóng đối với nhận diện baseline** | Home/catalogue/auth/member đã thay hệ cream–Lora–forest bằng sans/cobalt, bố cục catalogue và poster có chủ ý. Điều này giải quyết cảm giác của bản cũ; không phải cam kết thiết kế độc nhất trên thị trường hay thay cho sở thích cuối cùng của người dùng. |
| F08 | **Đóng đối với vấn đề một mẫu bìa** | Có nhiều cấu trúc bìa SVG; motif được ánh xạ theo nội dung, Cây cam ngọt thành cây/quả và các sách vũ trụ có hành tinh. Đây là bìa minh họa của demo, không phải ảnh bìa chính thức của nhà xuất bản. |
| F09 | **Đóng đối với các lỗi đã chỉ ra** | Save/add 44×44px; catalogue gọn; link home không bị bó; member mobile đã cho thấy sách và hạn trả, thẻ mở/đóng đúng. Một số chữ phụ vẫn nhỏ; cần kiểm tra thêm khi có nội dung thật dài. |

### Giới hạn còn lại

- **Chưa đủ để vận hành thương mại:** vẫn là frontend lưu thiết bị. Auth/role, invitation, thanh toán và tồn sách chưa được server/database bảo vệ. Cần transaction chống cấp cùng bản sách, phân quyền server, xác minh/reset email, session lifecycle, audit và backup/restore thực. Đây là phần backend theo lộ trình đã thống nhất, không phải chức năng đã hoàn tất bởi việc có UI.
- Profile đã có đổi mật khẩu, nhưng thông tin định danh và hạn thẻ vẫn do quầy xử lý. Nhắc việc được tính trực tiếp từ dữ liệu, chưa có read/unread hoặc gửi email/push.
- Chưa có hàng chờ sách hết bản, kiểm kê/nhập lô thực, barcode tự động, luồng mất sách/bồi thường đầy đủ, đa chi nhánh hoặc tài khoản nhân viên với quyền chi tiết. Những phần này cần đối chiếu đề cương; không nên quảng cáo là đã có.
- Metadata sách và bìa vẫn là dữ liệu minh họa, chưa có CMS hoàn chỉnh cho mô tả/ảnh/vị trí kệ. Báo cáo vẫn chọn 7/30/90 ngày, chưa có khoảng ngày tùy ý.
- Chưa kiểm tra bàn phím/đọc màn hình toàn bộ hệ thống, dữ liệu lớn, mọi độ dài nội dung, Safari/Firefox hoặc mọi điều kiện mạng. Excel đã được mở lại bằng thư viện và kiểm tra dữ liệu; **không mở Microsoft Excel desktop trong đợt review này**.
- Chrome DevTools MCP tiếp tục không sử dụng được ở các vòng sau vì treo. Các ảnh sau sửa được lấy từ Edge thật qua Playwright. Không ghi nhận đã hoàn tất việc kiểm tra sau sửa bằng MCP. ThreeUI của đợt cuối dùng reduced motion/fallback trong ảnh QA; không coi các ảnh đó là bằng chứng renderer WebGL chạy.

### Kiểm tra hồi quy màu bìa — 03/11/2026

Agent triển khai phát hiện control chọn màu trong BookForm không còn tác dụng sau khi chuyển sang artwork mới, rồi sửa `BookArtwork.tsx` để tiếp tục dùng `book.color`. Reviewer kiểm tra độc lập phần sửa này; không chạy lại các luồng tài khoản/tài chính không thay đổi.

- Qua UI quản trị thật, sửa Nhà giả kim sang màu tối `#342f35`, lưu và kiểm tra bìa ở trang công khai: nền đúng màu đã chọn, chữ tự chuyển trắng, tỉ lệ tương phản tính được ≈13,09.
- Tiếp tục sửa sang màu sáng `#91b5c6`: nền phản ánh đúng màu, chữ `#192c68`, tỉ lệ ≈6,01. Reload vẫn giữ màu mới. Chỉ sửa dữ liệu của context QA biệt lập, không chạm dữ liệu người dùng.
- Reviewer chỉ ra ngưỡng luminance `.179` không bảo đảm 4,5 nếu fallback là `#102336` (ví dụ nền `#808080` cho tỉ lệ ≈4,04). Agent triển khai đã dùng đen/trắng cho nhánh fallback. Các màu bìa hiện trên home ở ba viewport đều có tỉ lệ chữ/nền từ 4,5 trở lên theo phép tính trong script.
- Đã chụp và quan sát lại home ở 1440×900, 768×1024 và 390×844 với touch/mobile emulation. Không có overflow hoặc pageerror; motif và bố cục giữ nguyên, màu nền nay tôn trọng dữ liệu sách.

Script: `.packages/reviewer-cover-color.mjs`. Kết quả: `artifacts/reviewer-cover-color-results.json`, không có failure, `errors:[]`. Ảnh home mới nhất là `reviewer-latest-{desktop,tablet,mobile}-home.png`; ảnh lưới sách là `reviewer-latest-{desktop,tablet,mobile}-books.png`. Ảnh minh chứng đổi màu bằng quản trị: `reviewer-cover-edited.png`. Các kết luận F01–F09 giữ nguyên; chức năng chọn màu cũ đã được bảo toàn.

## Kết luận sau sửa

**Bản UI đã khép kín các luồng trọng tâm và giải quyết các lỗi P1 mà reviewer phát hiện. Có thể dùng làm bản trình diễn đồ án theo phạm vi một thư viện, ba nhóm khách–độc giả–quản trị.** Nhận diện đã thay đổi rõ, các cải thiện tính năng là thao tác có dữ liệu và trạng thái, không chỉ thêm nút trang trí. Điều này không bảo đảm điểm số hay tính đầy đủ so với một đề cương chưa được cung cấp.

**Chưa gọi là hệ thống thương mại hoàn chỉnh.** Phần còn lại chủ yếu là backend, độ bền dữ liệu và các nghiệp vụ nâng cao được nêu rõ ở trên. Không còn lỗi P1 chưa xử lý trong các kịch bản mà reviewer đã kiểm tra; điều đó không đồng nghĩa không thể còn lỗi ngoài phạm vi kiểm tra.
