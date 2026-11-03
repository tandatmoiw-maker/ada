# Quản trị thư viện

Ngôn ngữ nghiệp vụ cho hoạt động quản lý sách, độc giả và lưu thông tài liệu tại một thư viện.

## Thuật ngữ

**Quản trị viên**:
Nhân sự vận hành thư viện, quản lý tài liệu, độc giả và hoạt động mượn–trả.
_Tránh_: Khách hàng, người mua

**Đầu sách**:
Một ấn bản của tác phẩm, được nhận diện bằng tên sách, tác giả và ISBN; một đầu sách có thể có nhiều bản sao.
_Tránh_: Sản phẩm

**Bản sao**:
Một cuốn sách vật lý thuộc một đầu sách, được nhận diện bằng mã riêng.
_Tránh_: Đầu sách

**Độc giả**:
Người được thư viện cấp thẻ để mượn tài liệu.
_Tránh_: Khách hàng

**Phiếu mượn**:
Ghi nhận các bản sao được giao cho một độc giả cùng ngày mượn và hạn trả.
_Tránh_: Đơn hàng

**Quá hạn**:
Tình trạng bản sao chưa được trả sau hạn trả của phiếu mượn.

**Gia hạn**:
Việc chuyển hạn trả sang một ngày muộn hơn theo quy định của thư viện.

**Tiền phạt**:
Khoản phải thu phát sinh khi trả sách quá hạn hoặc vi phạm quy định của thư viện.

**Khách**:
Người ghé xem và tìm kiếm sách mà chưa đăng nhập hoặc đăng ký tài khoản trực tuyến.

**Người mượn tại quầy**:
Độc giả được thủ thư ghi nhận họ tên và thông tin liên hệ khi trực tiếp nhận sách; không bắt buộc có tài khoản trực tuyến.

**Yêu cầu giữ sách**:
Đề nghị của độc giả trực tuyến để thư viện dành các bản sách trong hai ngày, chờ nhận tại quầy.
_Tránh_: Phiếu mượn, đơn hàng

**Bàn giao sách**:
Việc xác nhận người mượn đã nhận các bản sách vật lý; thời điểm này mới lập phiếu mượn từ yêu cầu giữ sách.


**Liên kết kích hoạt thẻ**:
Liên kết dùng một lần, được thủ thư cấp sau khi xác minh tại quầy; giúp độc giả có thẻ tạo tài khoản trực tuyến mà giữ nguyên mã thẻ và lịch sử. Trong bản UI, hiệu lực 72 giờ và dùng cùng trình duyệt demo.

**Phiếu thu**:
Chứng từ ghi nhận toàn bộ khoản phạt đã thực thu, gồm thời điểm, phương thức, tham chiếu và người thu. Ngày khoản phạt phát sinh khác ngày thanh toán; báo cáo thực thu dùng ngày thanh toán.

**Nhắc việc độc giả**:
Danh sách suy ra từ sách gần đến hạn/quá hạn, yêu cầu sẵn sàng nhận và khoản phạt chưa thu. Bản UI chưa gửi email/SMS.
