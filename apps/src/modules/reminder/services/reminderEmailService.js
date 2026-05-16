const nodemailer = require('nodemailer');
const config = require('../../../shared/config/setting');
const { formatVietnamTime } = require('../utils/timezoneHelper');

class ReminderEmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
    }

    async sendReminderEmail(reminder, notificationService = null) {
        const vnTime = formatVietnamTime(reminder.reminderTime);
        const mailOptions = {
            from: config.email.user,
            to: reminder.email,
            subject: "📘 EasyTalk - Lời Nhắc Học Tập Dành Cho Bạn",
            html: this.buildEmailTemplate(vnTime, reminder.frequency, reminder.additionalInfo)
        };
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, async (error, info) => {
                if(error) {
                    console.error("Lỗi gửi email:", error);
                    reject(error);
                    return;
                }
                console.log("Email đã gửi:", info.response);
                if(reminder.user && notificationService) {
                    try {
                        await notificationService.createNotification(
                            reminder.user,
                            "Email nhắc nhở đã gửi!",
                            `Email nhắc nhở học tập vào lúc ${vnTime} (${reminder.frequency}) đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.`,
                            "system"
                        );
                        console.log(`Notification đã tạo cho user ${reminder.user}`);
                    } catch (err) {
                        console.error("Lỗi tạo notification:", err);
                    }
                }
                resolve(info);
            });
        });
    }

    buildEmailTemplate(vnTime, frequency, additionalInfo) {
        return `
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; color: #333;">
                <h2 style="color: #4CAF50; text-align: center;">⏰ Đã đến giờ học rồi!</h2>
                <p>Xin chào bạn 👋,</p>
                <p>Bạn đã đặt lời nhắc học tập vào lúc <strong>${vnTime}</strong> (<em>${frequency === 'one-time' ? 'Một lần' : frequency === 'daily' ? 'Hàng ngày' : frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}</em>).</p>
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
        `;
    }
}

module.exports = ReminderEmailService;