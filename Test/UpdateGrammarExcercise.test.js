const request = require('supertest');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const app = 'http://localhost:3000';
const url = '/admin/grammar-exercise/update/'; 
const MongoDBTestHelper = require('./MongoDBTestHelper');
const e = require('connect-flash');
let dbHelper = new MongoDBTestHelper();

describe('Grammar update API', () => {
    let grammarExerciseTest = {
        _id: new ObjectId(), 
        title: "TestData",    
        questions: [
            { question: 'TestQuest1', type: 'hehe' },
            { question: 'TestQuest2', type: 'hehe   ' } 
        ]
    };    
    let idTest;

    beforeAll(async () => {
        await dbHelper.connect();
    });

    beforeEach(async () => {
        data = await dbHelper.insertOne('grammars', grammarExerciseTest);
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

    it('TC1: Kiểm tra khi title bị bỏ trống', async () => {
        const res = await request(app)
            .post(url + idTest)
            .send({
                title: '',  // Title trống
                questions: [
                    {
                        question: "Q1",
                        type: "multiple-choice",
                    },
                    {
                        question: "Q2",
                        type: "multiple-choice",
                    }
                ]  // Đảm bảo đây là đối tượng, không phải chuỗi
            });
        
        // Kiểm tra mã phản hồi và thông báo lỗi
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Title cannot be empty.');
    });    

    it('TC2: Kiểm tra khi questions là null', async () => {
        const res = await request(app)
            .post(url + idTest)
            .send({
                title: 'Quest_1',  // Title hợp lệ
                questions: null  // Giả sử bạn gửi questions là null
            });
    
        // Kiểm tra mã phản hồi và thông báo lỗi
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Questions are invalid.');
    });    
    
    it('TC3: Kiểm tra khi có lỗi khi thêm dữ liệu', async () => {
        const res = await request(app)
            .post(url + idTest)
            .send({
                title: 'Quest_1',  // Tiêu đề hợp lệ
                questions: ['Q1', 'Q2']  // Mảng câu hỏi hợp lệ
            });
    
        // Kiểm tra mã phản hồi và thông báo lỗi
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Error adding grammar exercise');
    });    

    it('TC4: Kiểm tra khi thêm dữ liệu mới thành công', async () => {
        const res = await request(app)
            .post(url + idTest)
            .send({
                title: 'Quest_1',  // Tiêu đề hợp lệ
                questions: [
                    { question: 'Q1', type: 'hehe' }  // Đảm bảo cấu trúc đúng cho câu hỏi
                ]
            });
    
        // Kiểm tra thông báo thành công
        expect(res.body.message).toBe('Grammar exercise added successfully!');
    });    

    it('TC5: Kiểm tra khi object không tồn tại', async () => {
        // Xóa đối tượng để đảm bảo nó không còn tồn tại trong DB
        await dbHelper.deleteOne('grammars', { _id: new ObjectId(idTest) });
    
        const res = await request(app)
            .post(url + idTest)
            .send({
                title: 'Quest_1',  // Tiêu đề hợp lệ
                questions: ['Q1', 'Q2']  // Gửi câu hỏi dưới dạng mảng hợp lệ
            });
    
        // Kiểm tra mã phản hồi và thông báo lỗi
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Grammar exercise not found');
    });    
    
});
