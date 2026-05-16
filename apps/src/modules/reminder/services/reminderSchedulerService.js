const cron = require('node-cron');
const { buildCronExpression  } = require('../utils/cronExpression');
const { convertToVietnamTime } = require('../utils/timezoneHelper');

class ReminderSchedulerService {
    constructor() {
        this.cronJobs = new Map();
    }

    scheduleReminder(reminder, onExecuteCallback) {
        try {
            const vnDate = convertToVietnamTime(reminder.reminderTime);
            const cronExpression = buildCronExpression (vnDate, reminder.frequency);
            const job = cron.schedule(
                cronExpression,
                async () => {
                    await onExecuteCallback(reminder);
                    if(this.isOneTimeReminder(reminder)) {
                        this.stopJob(reminder._id);
                    }
                },
                {
                    scheduled: true,
                    timezone: "Asia/Ho_Chi_Minh",
                }
            );
            this.cronJobs.set(reminder._id.toString(), job);
            console.log(`Scheduled reminder: ${reminder._id} → ${cronExpression} (VN Time, ${reminder.frequency})`);
        } catch (err) {
            console.error("Error scheduling reminder:", err);
        }
    }

    stopJob(reminderId) {
        const jobKey = reminderId.toString();
        const job = this.cronJobs.get(jobKey);
        if(job) {
            job.stop();
            this.cronJobs.delete(jobKey);
            console.log(`Stopped cron job for reminder ${reminderId}`);
        }
    }

    hasJob(reminderId) {
        return this.cronJobs.has(reminderId.toString());
    }

    isOneTimeReminder(reminder) {
        return !reminder.frequency || reminder.frequency.toLowerCase() === "one-time";
    }

    stopAllJobs() {
        for(const [reminderId, job] of this.cronJobs.entries()) {
            job.stop();
            console.log(`Stopped cron job for reminder ${reminderId}`);
        }
        this.cronJobs.clear();
    }

    getActiveJobsCount() {
        return this.cronJobs.size;
    }
}

module.exports = ReminderSchedulerService;