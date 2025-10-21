const nodemailer = require('nodemailer');
const cron = require('node-cron');
const config = require('../config/setting');
const { ReminderRepository } = require('./../repositories');

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
        if (reminderDate <= now) {
            throw new Error("Thời gian nhắc nhở phải ở trong tương lai.");
        }
    }

    async createReminder(userId, email, reminderTime, frequency, additionalInfo) {
        this.validateReminderTime(reminderTime);
        const reminder = {
            user: userId,
            email,
            reminderTime,
            frequency,
            additionalInfo,
            status: "active",
        };
        const insertedId = await this.reminderRepository.createReminder(reminder);
        const savedReminder = { ...reminder, _id: insertedId };
        this.scheduleEmail(savedReminder);
        return insertedId;
    }

    async getRemindersByUserId(userId) {
        return await this.reminderRepository.findRemindersByUserId(userId);
    }

    async getReminderById(reminderId) {
        return await this.reminderRepository.findReminderById(reminderId);
    }

    async updateReminder(reminderId, updatedFields) {
        const reminder = await this.getReminderById(reminderId);
        if (!reminder) throw new Error("Reminder không tồn tại");
        if (updatedFields.reminderTime) this.validateReminderTime(updatedFields.reminderTime);
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
        const min = date.getMinutes();
        const hour = date.getHours();
        switch (reminder.frequency?.toLowerCase()) {
            case "daily":
                return `${min} ${hour} * * *`;
            case "weekly":
                return `${min} ${hour} * * 1`;
            case "monthly":
                return `${min} ${hour} ${date.getDate()} * *`;
            default:
                return `${min} ${hour} ${date.getDate()} ${date.getMonth() + 1} *`;
        }
    }

    scheduleEmail(reminder) {
        try {
            const cronExpression = this.getCronExpression(reminder);
            const job = cron.schedule(
                cronExpression,
                () => {
                    this.sendEmail(
                        reminder.email,
                        reminder.reminderTime,
                        reminder.frequency,
                        reminder.additionalInfo || "Không có ghi chú thêm."
                    );
                    if (
                        !reminder.frequency ||
                        reminder.frequency.toLowerCase() == "one-time"
                    ) {
                        job.stop();
                        this.cronJobs.delete(reminder._id.toString());
                        this.reminderRepository.updateReminder(reminder._id, { status: "completed" });
                    }
                },
                {
                    scheduled: true,
                    timezone: "Asia/Ho_Chi_Minh",
                }
            );
            this.cronJobs.set(reminder._id.toString(), job);
            console.log(`⏰ Scheduled reminder: ${reminder._id} (${reminder.frequency})`);
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

    sendEmail(email, reminderTime, frequency, additionalInfo) {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "📘 EasyTalk - Nhắc nhở học tập",
            html: `
                <p>Xin chào 👋,</p>
                <p>Bạn đã đặt lời nhắc học tập vào <strong>${reminderTime}</strong> (${frequency}).</p>
                <p><strong>Lời nhắn của bạn:</strong></p>
                <p style="white-space: pre-line">${additionalInfo}</p>
                <p>Chúc bạn học tập thật hiệu quả và duy trì sự kỷ luật nhé 💪.</p>
                <p>— EasyTalk Team</p>
            `,
        };
        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Lỗi gửi email:", error);
            } else {
                console.log("✅ Email đã gửi:", info.response);
            }
        });
    }
}

module.exports = ReminderService;