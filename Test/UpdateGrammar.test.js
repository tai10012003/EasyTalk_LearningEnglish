const request = require('supertest');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const app = 'http://localhost:3000';
const url = '/admin/grammar/api/update/'; 
const MongoDBTestHelper = require('./MongoDBTestHelper');
let dbHelper = new MongoDBTestHelper();

describe('Grammar update API', () => {
    let grammarTest = {
        _id: new ObjectId(),
        title: "TestData",
        description: "TestData",
        content: "TestData",
    };
    let idTest;

    beforeAll(async () => {
        await dbHelper.connect();
    });

    beforeEach(async () => {
        data = await dbHelper.insertOne('grammars', grammarTest);
        idTest = data.insertedId.toString();
    });

    afterEach(async () => {
        try {
            await dbHelper.deleteOne('grammars', { _id: new ObjectId(idTest) });
        }
        catch(e){

        }
    });

    afterAll(async () => {
        // Đảm bảo đóng kết nối MongoDB
        await dbHelper.close();
    });

    it('TC1: Kiểm tra khi grammarService.updateGrammar ném ra lỗi ( bị lỗi ảnh quá to)', async () => {
        const imgHigher = await fs.readFileSync('Test\\ImageHigh.jpg');
        const res = await request(app)
            .put(url + idTest) 
            .set('Content-Type', 'multipart/form-data')  // Set đúng kiểu content-type
            .field('title', 'Thì quá khứ đơn')
            .field('description', 'Thì quá khứ đơn có nhiều dạng khác nhau')
            .field('content', 'Thì quá khứ đơn có dạng khẳng định, phủ định, nghi vấn...')
            .attach('image', imgHigher, 'image.png'); 

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe("Error updating grammar");
    });

    it('TC2: Kiểm tra khi cập nhật grammar thành công có file', async () => {
        // Đường dẫn tệp bạn muốn gửi trong yêu cầu
        const imgLower = await fs.readFileSync('Test\\Image.png');

        const res = await request(app)
            .put(url + idTest) 
            .set('Content-Type', 'multipart/form-data')  // Set đúng kiểu content-type
            .field('title', 'Thì quá khứ đơn')
            .field('description', 'Thì quá khứ đơn có nhiều dạng khác nhau')
            .field('content', 'Thì quá khứ đơn có dạng khẳng định, phủ định, nghi vấn...')
            .attach('image', imgLower, 'image.png');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Bài học ngữ pháp đã được cập nhật thành công !');
    });

    it('TC3: Kiểm tra khi cập nhật grammar thành công không có file', async () => {
        const res = await request(app)
            .put(url + idTest)
            .set('Content-Type', 'multipart/form-data')  // Set đúng kiểu content-type
            .field('title', 'Thì quá khứ đơn')
            .field('description', 'Thì quá khứ đơn có nhiều dạng khác nhau')
            .field('content', 'Thì quá khứ đơn có dạng khẳng định, phủ định, nghi vấn...')

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Bài học ngữ pháp đã được cập nhật thành công !');
    });

    it('TC4: Kiểm tra khi không tìm thấy grammar cần cập nhật', async () => {
        dbHelper.deleteOne('grammars', { _id: new ObjectId(idTest) }); // Xoá để đảm bảo id không tồn tại
        const res = await request(app)
            .put(url + idTest)
            .set('Content-Type', 'multipart/form-data')  // Set đúng kiểu content-type
            .field('title', 'Thì quá khứ đơn')
            .field('description', 'Thì quá khứ đơn có nhiều dạng khác nhau')
            .field('content', 'Thì quá khứ đơn có dạng khẳng định, phủ định, nghi vấn...')

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Bài học ngữ pháp không tìm thấy.');
    });
});
