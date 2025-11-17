const nodemailer = require('nodemailer');
const cron = require('node-cron');
const config = require('../config/setting');
const { ReminderRepository } = require('./../repositories');
const NotificationService = require("./notificationService");
const { getVietnamDate } = require('../util/dateFormat');

class ReminderService {
    constructor() {
        this.reminderRepository = new ReminderRepository();
        this.cronJobs = new Map();
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
        this.notificationService = new NotificationService();
        this.initReminders();
    }

    async initReminders() {
        try {
            const reminders = await this.reminderRepository.remindersCollection.find({ status: "active" }).toArray();
            for (const reminder of reminders) {
                this.scheduleEmail(reminder);
            }
            console.log(`✅ Loaded ${reminders.length} reminders on startup.`);
        } catch (error) {
            console.error("❌ Error initializing reminders:", error);
        }
    }

    validateReminderTime(reminderTime) {
        const now = new Date();
        const reminderDate = new Date(reminderTime);
        const nowVN = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const reminderVN = new Date(reminderDate.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        if (reminderVN <= nowVN) {
            throw new Error("Thời gian nhắc nhở phải ở trong tương lai (giờ Việt Nam).");
        }
    }

    async getReminders(userId, page = 1, limit = 10) {
        return await this.reminderRepository.findAll(userId, page, limit);
    }

    async createReminder(userId, email, reminderTime, frequency, additionalInfo) {
        this.validateReminderTime(reminderTime);
        const vnDate = new Date(reminderTime);
        const vnDateStr = getVietnamDate(vnDate);
        const [y, m, d] = vnDateStr.split('-');
        vnDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
        const reminder = {
            user: userId,
            email,
            reminderTime: vnDate.toISOString(),
            frequency: frequency,
            additionalInfo: additionalInfo,
            status: "active",
        };
        const insertedId = await this.reminderRepository.createReminder(reminder);
        const savedReminder = { ...reminder, _id: insertedId };
        this.scheduleEmail(savedReminder);
        return insertedId;
    }

    async getReminderById(reminderId) {
        return await this.reminderRepository.findReminderById(reminderId);
    }

    async updateReminder(reminderId, updatedFields) {
        const reminder = await this.getReminderById(reminderId);
        if (!reminder) throw new Error("Reminder không tồn tại");
        if (updatedFields.reminderTime) {
            this.validateReminderTime(updatedFields.reminderTime);
            const vnDate = new Date(updatedFields.reminderTime);
            const vnDateStr = getVietnamDate(vnDate);
            const [y, m, d] = vnDateStr.split('-');
            vnDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
            updatedFields.reminderTime = vnDate.toISOString();
        }
        const success = await this.reminderRepository.updateReminder(reminderId, updatedFields);
        if (success) {
            const updatedReminder = await this.getReminderById(reminderId);
            this.stopScheduledEmail(reminderId);
            this.scheduleEmail(updatedReminder);
        }
        return success;
    }

    async deleteReminder(reminderId) {
        this.stopScheduledEmail(reminderId);
        return await this.reminderRepository.deleteReminder(reminderId);
    }

    getCronExpression(reminder) {
        const date = new Date(reminder.reminderTime);
        const vnDateStr = getVietnamDate(date);
        const [year, month, day] = vnDateStr.split('-').map(Number);
        const vnDate = new Date(date);
        vnDate.setFullYear(year, month - 1, day);
        const min = vnDate.getMinutes();
        const hour = vnDate.getHours();
        const dom = vnDate.getDate();
        const dow = vnDate.getDay();
        switch (reminder.frequency?.toLowerCase()) {
            case "daily":
                return `${min} ${hour} * * *`;
            case "weekly":
                return `${min} ${hour} * * ${dow}`;
            case "monthly":
                return `${min} ${hour} ${dom} * *`;
            default:
                return `${min} ${hour} ${dom} ${month} *`;
        }
    }

    scheduleEmail(reminder) {
        try {
            const cronExpression = this.getCronExpression(reminder);
            const job = cron.schedule(
                cronExpression,
                async () => {
                    await this.sendEmail(
                        reminder.email,
                        reminder.reminderTime,
                        reminder.frequency,
                        reminder.additionalInfo || "Không có ghi chú thêm.",
                        reminder.user
                    );
                    if (
                        !reminder.frequency ||
                        reminder.frequency.toLowerCase() == "one-time"
                    ) {
                        job.stop();
                        this.cronJobs.delete(reminder._id.toString());
                        await this.reminderRepository.updateReminder(reminder._id, { status: "completed" });
                    }
                },
                {
                    scheduled: true,
                    timezone: "Asia/Ho_Chi_Minh",
                }
            );
            this.cronJobs.set(reminder._id.toString(), job);
            console.log(`⏰ Scheduled reminder: ${reminder._id} → ${cronExpression} (VN Time) ${reminder.frequency})`);
        } catch (err) {
            console.error("Error scheduling reminder:", err);
        }
    }

    stopScheduledEmail(reminderId) {
        const job = this.cronJobs.get(reminderId.toString());
        if (job) {
            job.stop();
            this.cronJobs.delete(reminderId.toString());
            console.log(`🛑 Stopped cron job for reminder ${reminderId}`);
        }
    }

    async sendEmail(email, reminderTime, frequency, additionalInfo, userId = null) {
        const vnTime = new Date(reminderTime).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "📘 EasyTalk - Lời Nhắc Học Tập Dành Cho Bạn",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; color: #333;">
                    <h2 style="color: #4CAF50; text-align: center;">⏰ Đã đến giờ học rồi!</h2>
                    <p>Xin chào bạn 👋,</p>
                    <p>Bạn đã đặt lời nhắc học tập vào lúc <strong>${vnTime}</strong> (<em>${frequency}</em>).</p>
                    <p style="margin-top: 10px;"><strong>Lời nhắn bạn đã để lại cho chính mình:</strong></p>
                    <blockquote style="border-left: 4px solid #4CAF50; padding-left: 10px; color: #555; font-style: italic;">
                        ${additionalInfo || "Không có lời nhắn nào, nhưng EasyTalk tin rằng bạn sẽ làm tốt hôm nay!"}
                    </blockquote>
                    <p style="margin-top: 15px;">Hãy dành một chút thời gian để ôn luyện, luyện nghe, hoặc học vài từ vựng mới nhé. Mỗi bước nhỏ hôm nay đều giúp bạn tiến gần hơn đến mục tiêu của mình 💪.</p>
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666;">
                        Nếu bạn muốn thay đổi hoặc hủy lời nhắc, vui lòng đăng nhập vào tài khoản của bạn trên 
                        <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">EasyTalk</a>.
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        Chúc bạn một ngày học tập hiệu quả và đầy năng lượng! 🌟<br>
                        — <strong>Đội ngũ EasyTalk</strong><br>
                        <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
                    </p>
                </div>
            `,
        };
        this.transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error("Lỗi gửi email:", error);
                return;
            }
            console.log("Email đã gửi:", info.response);
            if (userId) {
                try {
                    await this.notificationService.createNotification(
                        userId,
                        "Email nhắc nhở đã gửi!",
                        `Email nhắc nhở học tập vào lúc ${vnTime} (${frequency}) đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.`,
                        "system"
                    );
                    console.log(`🔔 Notification đã tạo cho user ${userId}`);
                } catch (err) {
                    console.error("❌ Lỗi tạo notification:", err);
                }
            }
        });
    }
}

module.exports = ReminderService;