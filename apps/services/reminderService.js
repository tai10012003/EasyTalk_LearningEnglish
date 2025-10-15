const nodemailer = require('nodemailer');
const cron = require('node-cron');
const config = require('./../config/setting.json');
const { ReminderRepository } = require('./../repositories');

class ReminderService {
    constructor() {
        this.reminderRepository = new ReminderRepository();
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
            status: "active",
        };
        const insertedId = await this.reminderRepository.createReminder(reminder);
        this.scheduleEmail({ ...reminder, _id: insertedId });
        return insertedId;
    }

    async getRemindersByUserId(userId) {
        return await this.reminderRepository.findRemindersByUserId(userId);
    }

    async getReminderById(reminderId) {
        return await this.reminderRepository.findReminderById(reminderId);
    }

    async updateReminder(reminderId, updatedFields) {
        const success = await this.reminderRepository.updateReminder(reminderId, updatedFields);
        if (success) {
            const updatedReminder = await this.getReminderById(reminderId);
            this.scheduleEmail(updatedReminder);
        }
        return success;
    }

    async deleteReminder(reminderId) {
        return await this.reminderRepository.deleteReminder(reminderId);
    }

    scheduleEmail(reminder) {
        const reminderDate = new Date(reminder.reminderTime);
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
            timezone: "Asia/Ho_Chi_Minh"
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

module.exports = ReminderService;