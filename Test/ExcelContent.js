const xlsx = require('xlsx');
const path = require('path');

class ExcelContent {
  constructor(filePath) {
    // Lưu đường dẫn file và mở kết nối đến file Excel
    this.filePath = filePath;
    this.workbook = xlsx.readFile(filePath);
    this.sheet = this.workbook.Sheets[this.workbook.SheetNames[0]]; // Chọn sheet đầu tiên
    
    // Đọc các tên cột từ hàng đầu tiên (A1, B1, C1,...)
    this.columnNames = this._getColumnNames();
  }

  // Hàm lấy tên cột từ hàng đầu tiên
  _getColumnNames() {
    let columnNames = [];
    const range = xlsx.utils.decode_range(this.sheet['!ref']); // lấy phạm vi dữ liệu
    const firstRow = range.s.r; // lấy chỉ số hàng đầu tiên

    // Lấy giá trị của các cột trong hàng đầu tiên (A1, B1, C1...)
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
      const cellAddress = { r: firstRow, c: colIndex }; // Địa chỉ ô
      const cell = this.sheet[xlsx.utils.encode_cell(cellAddress)];
      if (cell && cell.v) {
        columnNames.push(cell.v); // Lưu tên cột
      }
    }

    return columnNames;
  }

  // Hàm đọc giá trị tại hàng và cột nhất định theo tên cột
  readValueAt(row, columnName) {
    // Tìm vị trí cột tương ứng với tên cột
    const colIndex = this.columnNames.indexOf(columnName);
    if (colIndex === -1) {
      throw new Error(`Column name "${columnName}" not found.`);
    }

    // Tạo địa chỉ ô bằng tên cột và số hàng
    const colLetter = xlsx.utils.encode_col(colIndex); // chuyển index thành chữ cái (A, B, C, ...)
    const cellAddress = `${colLetter}${row}`;

    // Đọc giá trị tại vị trí
    const cell = this.sheet[cellAddress];
    return cell ? cell.v : undefined;
  }

  // Hàm ghi giá trị vào file Excel tại vị trí chỉ định theo tên cột
  writeValueAt(row, columnName, value) {
    // Tìm vị trí cột tương ứng với tên cột
    const colIndex = this.columnNames.indexOf(columnName);
    if (colIndex === -1) {
      throw new Error(`Column name "${columnName}" not found.`);
    }

    // Tạo địa chỉ ô bằng tên cột và số hàng
    const colLetter = xlsx.utils.encode_col(colIndex); // chuyển index thành chữ cái (A, B, C, ...)
    const cellAddress = `${colLetter}${row}`;

    // Ghi giá trị vào ô
    this.sheet[cellAddress] = { v: value };

    // Cập nhật lại file Excel
    xlsx.writeFile(this.workbook, this.filePath);
  }

  // Hàm huỷ kết nối (giải phóng bộ nhớ)
  closeConnection() {
    this.workbook = null;
    this.sheet = null;
    console.log("Connection to Excel file closed.");
  }
}

module.exports = ExcelContent;
