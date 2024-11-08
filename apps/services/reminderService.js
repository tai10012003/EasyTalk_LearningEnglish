const { ObjectId } = require('mongodb');
const config = require("./../config/setting.json");
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const databaseConnection = require('./../database/database');

class ReminderService {
    constructor() {
        // Initialize the MongoDB client and connect to the database
        this.client = databaseConnection.getMongoClient();
        this.reminderDatabase = this.client.db(config.mongodb.database);
        this.reminderCollection = this.reminderDatabase.collection("reminders");

        // Configure nodemailer for email sending
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
    }

    async createReminder(userId, email, reminderTime, frequency, additionalInfo) {
        const reminder = {
            user: userId,
            email,
            reminderTime,
            frequency,
            additionalInfo,
            status: "active"
        };
        const result = await this.reminderCollection.insertOne(reminder);
        this.scheduleEmail(reminder);
        return result.insertedId;
    }

    async getRemindersByUserId(userId) {
        try {
            const reminders = await this.reminderCollection.find({ user: userId }).toArray();
            return reminders;
        } catch (error) {
            console.error("Error fetching reminders:", error);
            throw new Error("Failed to fetch reminders.");
        }
    }    

    async getReminderById(reminderId) {
        try {
            const reminder = await this.reminderCollection.findOne({ _id: new ObjectId(reminderId) });
            return reminder;
        } catch (error) {
            console.error("Error fetching reminder by ID:", error);
            throw new Error("Failed to fetch reminder by ID.");
        }
    }

    async updateReminder(reminderId, updatedFields) {
        try {
            const result = await this.reminderCollection.updateOne(
                { _id: new ObjectId(reminderId) },
                { $set: updatedFields }
            );
    
            if (result.modifiedCount > 0) {
                const updatedReminder = await this.getReminderById(reminderId);
                this.scheduleEmail(updatedReminder);
            }
    
            return true;
        } catch (error) {
            console.error("Error updating reminder:", error);
            throw new Error("Failed to update reminder.");
        }
    }    

    async deleteReminder(reminderId) {
        try {
            await this.reminderCollection.deleteOne({ _id: new ObjectId(reminderId) });
            return true;
        } catch (error) {
            console.error("Error deleting reminder:", error);
            throw new Error("Failed to delete reminder.");
        }
    }

    async scheduleEmail(reminder) {
        const reminderDate = new Date(reminder.reminderTime);
        
        // Create cron schedule based on the reminder date
        const cronExpression = `${reminderDate.getMinutes()} ${reminderDate.getHours()} ${reminderDate.getDate()} ${reminderDate.getMonth() + 1} *`;
        
        cron.schedule(cronExpression, () => {
            this.sendEmail(
                reminder.email,
                reminder.reminderTime,
                reminder.frequency,
                reminder.additionalInfo || "No additional information provided."
            );
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh" // Adjust to your timezone
        });
    }

    sendEmail(email, reminderTime, frequency, additionalInfo) {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: 'Thông Báo Nhắc Nhở Học Tập Từ EasyTalk',
            html: `<p>Xin chào,</p>
                   <p>Đây là lời nhắc nhở nhẹ nhàng cho hoạt động đã lên lịch của bạn với <strong>EasyTalk</strong>. Lời nhắc nhở của bạn được đặt vào <strong>${reminderTime}</strong> và sẽ lặp lại <strong>${frequency.toLowerCase()}</strong>. Sau đây là một số lời nhắc nhở giúp bạn học tập:</p>
                   <p style="white-space: pre-line"><strong>${additionalInfo}</strong></p>
                   <p>Chúng tôi hy vọng lời nhắc nhở này giúp bạn duy trì mục tiêu của mình. Hãy thoải mái liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ nào.</p>
                   <p>Trân trọng, </p>
                   <p>Nhóm EasyTalk</p>`
        };
    
        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Lỗi gửi email:', error);
            } else {
                console.log('Email đã gửi thành công:', info.response);
            }
        });
    }
}

module.exports = new ReminderService();
