const { ObjectId } = require('mongodb');
const ReminderRepository = require('../repositories/reminderRepository');
const ReminderSchedulerService = require('./reminderSchedulerService');
const ReminderEmailService = require('./reminderEmailService');
const { validateFutureTime, convertToVietnamTime } = require('../utils/timezoneHelper');

class ReminderService {
    constructor() {
        this.repository = new ReminderRepository();
        this.schedulerService = new ReminderSchedulerService();
        this.emailService = new ReminderEmailService();
        this.notificationService = null;
    }

    setNotificationService(service) {
        this.notificationService = service;
    }

    async initReminders() {
        try {
            const reminders = await this.repository.findActiveReminders();
            for(const reminder of reminders) {
                this.scheduleReminder(reminder);
            }
            console.log(`Loaded ${reminders.length} active reminders on startup.`);
        } catch (error) {
            console.error("Error initializing reminders:", error);
        }
    }

    async getReminders(userId, page = 1, limit = 10) {
        return await this.repository.findAll(userId, page, limit);
    }

    async getReminderById(reminderId) {
        return await this.repository.findById(reminderId);
    }

    async createReminder(userId, email, reminderTime, frequency, additionalInfo) {
        validateFutureTime(reminderTime);
        const vnDate = convertToVietnamTime(reminderTime);
        const reminder = {
            user: new ObjectId(userId),
            email,
            reminderTime: vnDate.toISOString(),
            frequency: frequency || 'one-time',
            additionalInfo: additionalInfo || '',
            status: "active",
        };
        const insertedId = await this.repository.insert(reminder);
        const savedReminder = { ...reminder, _id: insertedId };
        this.scheduleReminder(savedReminder);
        return insertedId;
    }

    async updateReminder(reminderId, updatedFields) {
        const reminder = await this.repository.findById(reminderId);
        if(!reminder) throw new Error("Reminder không tồn tại");
        if(updatedFields.reminderTime) {
            validateFutureTime(updatedFields.reminderTime);
            const vnDate = convertToVietnamTime(updatedFields.reminderTime);
            updatedFields.reminderTime = vnDate.toISOString();
        }
        const success = await this.repository.update(reminderId, updatedFields);
        if(success) {
            const updatedReminder = await this.repository.findById(reminderId);
            this.schedulerService.stopJob(reminderId);
            this.scheduleReminder(updatedReminder);
        }
        return success;
    }

    async deleteReminder(reminderId) {
        this.schedulerService.stopJob(reminderId);
        return await this.repository.delete(reminderId);
    }

    scheduleReminder(reminder) {
        this.schedulerService.scheduleReminder(reminder, async (rem) => {
            await this.emailService.sendReminderEmail(rem, this.notificationService);
            if(this.schedulerService.isOneTimeReminder(rem)) {
                await this.repository.update(rem._id, { status: "completed" });
            }
        });
    }

    getActiveJobsCount() {
        return this.schedulerService.getActiveJobsCount();
    }

    stopAllJobs() {
        this.schedulerService.stopAllJobs();
    }
}

module.exports = ReminderService;