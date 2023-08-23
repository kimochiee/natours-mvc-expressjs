//lấy thông tin lỗi cho error handler xử lý 
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //tham chiếu message đến đối tượng của lớp cha gần nhất (ở đây là Error)

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //là những lỗi do mongodb hoặc người dùng tạo ra, mếu false thì có nghĩa do code bị lỗi chỗ nào đó

    Error.captureStackTrace(this, this.constructor); //trả về vị trí dòng lệnh gây ra lỗi
  }
}

module.exports = AppError;
