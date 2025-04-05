const request = require('supertest');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const app = 'http://localhost:3000';
const url = '/admin/grammar/api/add'; 
const MongoDBTestHelper = require('./MongoDBTestHelper');
let dbHelper = new MongoDBTestHelper();

describe('Grammar Add API', () => {
    let testSuccessAllow = false;

    beforeAll(async () => {
        await dbHelper.connect();
    });

    beforeEach(async () => {

    });

    afterEach(async () => {
        if (testSuccessAllow) {
            await dbHelper.deleteNearByUseIdDefault('grammars');
            testSuccessAllow = false; // Đặt lại biến sau khi xóa
        }
    });

    afterAll(async () => {
        await dbHelper.close();
    });

    it('TC1: Kiểm tra khi thiếu trường title', async () => {
        const res = await request(app)
            .post(url) 
            .set('Content-Type', 'multipart/form-data') 
            .field('description', 'Thì hiện tại đơn có nhiều dạng khác nhau')
            .field('content', 'Thì hiện tại đơn có dạng khẳng định, phủ định, nghi vấn...')
            .attach('image', null);  // Không gửi file ảnh
    
        if(res.statusCode === 201) {
            testSuccessAllow = true;
        } // Đánh dấu để xóa sau
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
    });

    it('TC2: Kiểm tra khi thiếu trường description', async () => {
        const res = await request(app)
            .post(url) 
            .set('Content-Type', 'multipart/form-data') 
            .field('title', 'Thì hiện tại đơn')
            .field('content', 'Thì hiện tại đơn có dạng khẳng định, phủ định, nghi vấn...')
            .attach('image', null);  // Không gửi file ảnh
        if(res.statusCode === 201) {
            testSuccessAllow = true;
        } // Đánh dấu để xóa sau
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
    });

    it('TC3: Kiểm tra khi thiếu trường content', async () => {
        const res = await request(app)
            .post(url) 
            .set('Content-Type', 'multipart/form-data') 
            .field('title', 'Thì hiện tại đơn')
            .field('description', 'Thì hiện tại đơn có nhiều dạng khác nhau')
            .attach('image', null);  // Không gửi file ảnh
        if(res.statusCode === 201) {
            testSuccessAllow = true;
        } // Đánh dấu để xóa sau  
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
    });

    it('TC4: Kiểm tra khi thêm grammar gặp lỗi', async () => {
        const imgHigher = await fs.readFileSync('Test\\ImageHigh.jpg');
    
        const res = await request(app)
            .post(url) 
            .set('Content-Type', 'multipart/form-data') 
            .field('title', 'Thì hiện tại đơn')
            .field('description', 'Thì hiện tại đơn có nhiều dạng khác nhau')
            .field('content', 'Thì hiện tại đơn có dạng khẳng định, phủ định, nghi vấn...')
            .attach('image', imgHigher, 'image.png');

        if(res.statusCode === 201) {
            testSuccessAllow = true;
        } // Đánh dấu để xóa sau
        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe("Error adding grammar");
    });

    it('TC5: Kiểm tra khi thêm grammar thành công không có file ảnh', async () => {
        const res = await request(app)
            .post(url) 
            .set('Content-Type', 'multipart/form-data') 
            .field('title', 'Thì hiện tại đơn')
            .field('description', 'Thì hiện tại đơn có nhiều dạng khác nhau')
            .field('content', 'Thì hiện tại đơn có dạng khẳng định, phủ định, nghi vấn...')
        if(res.statusCode === 201) {
            testSuccessAllow = true;
        } // Đánh dấu để xóa sau
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Bài học ngữ pháp đã được thêm thành công !");
    });
        
    it('TC6: Kiểm tra khi thêm grammar thành công có file ảnh', async () => {
        const imgLower = await fs.readFileSync('Test\\Image.png');
    
        const res = await request(app)
            .post(url) 
            .set('Content-Type', 'multipart/form-data') 
            .field('title', 'Thì hiện tại đơn')
            .field('description', 'Thì hiện tại đơn có nhiều dạng khác nhau')
            .field('content', 'Thì hiện tại đơn có dạng khẳng định, phủ định, nghi vấn...')
            .attach('image', imgLower, 'image.png');  // Gửi ảnh
        if(res.statusCode === 201) {
            testSuccessAllow = true;
        } // Đánh dấu để xóa sau
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Bài học ngữ pháp đã được thêm thành công !");
    });
    
});