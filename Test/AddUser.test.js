const request = require('supertest');
const { ObjectId } = require('mongodb');
const app = 'http://localhost:3000';
const url = '/admin/users/api/add'; 
const MongoDBTestHelper = require('./MongoDBTestHelper');
let dbHelper = new MongoDBTestHelper();

describe('User Registration Tests', () => {

    beforeAll(async () => {
        await dbHelper.connect();
    });

    afterEach(async () => {
        if (testSuccessAllow) {
            await dbHelper.deleteNearByUseIdDefault('users');
            testSuccessAllow = false; // Đặt lại biến sau khi xóa
        }
    });

    afterAll(async () => {
        await dbHelper.close();
    });

    it('TC1: Thêm người dùng với dữ liệu hợp lệ', async () => {
        const res = await request(app)
            .post(url)
            .send({
                username: 'user1',
                email: 'user1@example.com',
                password: 'Password123',
                role: 'user'
            });

        if(res.body.success) {
            testSuccessAllow = true; // Đánh dấu để xóa sau
        }
        // Kiểm tra kết quả phản hồi
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('User added successfully!');
    });

    it('TC2: Dữ liệu đầu vào thiếu trường bắt buộc', async () => {
        const res = await request(app)
            .post(url)
            .send({
                username: 'user3',
                email: 'user3@example.com',
                // thiếu password
                role: 'user'
            });
        if(res.body.success) {
            testSuccessAllow = true; // Đánh dấu để xóa sau
        }
        // Kiểm tra kết quả phản hồi
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Error adding user');
        expect(res.body.error).toBe('Password is required');
        
    });
});
