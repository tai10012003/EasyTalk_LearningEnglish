const request = require('supertest');
// Hoặc, nếu API của bạn chạy trên một server riêng biệt:
const app = 'http://localhost:3000'; // Thay thế bằng URL của API
const url = '/admin/grammar-exercise';
const MongoDBTestHelper = require('./MongoDBTestHelper');
let dbHelper = new MongoDBTestHelper();

describe('POST /add API', () => {

    beforeAll(async () => {
        await dbHelper.connect();
    });

    afterEach(async () => {
        // Tìm tất cả các tài liệu với title là 'Quest_1' trong collection 'grammarexercises'
        const foundGrammars = await dbHelper.findDocumentsByTitle('grammarexercises', 'Quest_1');
    
        // Xóa tất cả tài liệu có title là 'Quest_1'
        if (foundGrammars.length > 0) {
            for (let grammar of foundGrammars) {
                await dbHelper.deleteOne('grammarexercises', { _id: grammar._id });
            }
        }
    });

    afterAll(async () => {
        // Đảm bảo đóng kết nối MongoDB
        await dbHelper.close();
    });

    it('TC1: nên trả về lỗi nếu tiêu đề bị thiếu', async () => {
        const res = await request(app)
            .post(url + '/add')
            .send({ questions: ['Q1', 'Q2'] });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Tiêu đề không để trống.');
    });

    it('TC2: nên trả về lỗi nếu mảng câu hỏi là null', async () => {
        const res = await request(app)
            .post(url + '/add')
            .send({ title: 'Quest 1', questions: null });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Câu hỏi không hợp lệ.');
    });

    it('TC3: nên thêm dữ liệu mới thành công', async () => {
        // Gửi yêu cầu POST để thêm dữ liệu mới
        const res = await request(app)
            .post(url + '/add')
            .send({ title: 'Quest_1', questions: ['Q1', 'Q2'] });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Bài luyện tập ngữ pháp đã được thêm thành công !');
    });    
    
    it('TC4: nên trả về lỗi nếu thêm dữ liệu bị lỗi (ví dụ: trùng lặp)', async () => {
        await request(app)
            .post(url + '/add')
            .send({ title: 'Quest_1', questions: ['Q1', 'Q2'] });

        const res = await request(app)
            .post(url + '/add')
            .send({ title: 'Quest_1', questions: ['Q1', 'Q2'] });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('Error adding grammar exercise');
    });

});