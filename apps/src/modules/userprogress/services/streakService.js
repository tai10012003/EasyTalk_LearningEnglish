const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const config = require('../../../shared/config/setting');
const UserProgressRepository = require('../repositories/userprogressRepository');
const NotificationService = require('../../notification/services/notificationService');
const { invalidateUserProgressCache } = require('../utils/cacheHelper');
const { getVietnamDate } = require('../../../shared/utils/dateFormat');

class StreakService {
    constructor(deps = {}) {
        this.userProgressRepository = deps.repository || new UserProgressRepository();
        this.notificationService = deps.notificationService || new NotificationService();
        this.transporter = deps.transporter || nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
    }

    async checkAndResetStreakOnLogin(userId) {
        const userProgress = await this.userProgressRepository.findByUserId(userId);
        if(!userProgress) return null;
        const todayStr = getVietnamDate();
        const today = new Date(todayStr + 'T00:00:00+07:00');
        const studyDates = [...new Set(
            (userProgress.studyDates || []).map(d => d instanceof Date ? getVietnamDate(d) : d).filter(Boolean)
        )];
        if(studyDates.includes(todayStr)) {
            return userProgress;
        }
        const pastDates = studyDates.filter(d => d !== todayStr).sort((a, b) => new Date(b) - new Date(a));
        if(pastDates.length === 0) {
            return userProgress;
        }
        const lastStudyDateStr = pastDates[0];
        const lastStudyDate = new Date(lastStudyDateStr + 'T00:00:00+07:00');
        const daysDiff = Math.floor((today - lastStudyDate) / (24 * 60 * 60 * 1000));
        if(daysDiff === 2) {
            const currentStreak = userProgress.streak || 0;
            if(currentStreak > 0) {
                try {
                    const existingNotif = await this.notificationService.getNotificationsByUserId(userId);
                    const todayStart = new Date(todayStr + 'T00:00:00+07:00');
                    const todayEnd = new Date(todayStr + 'T23:59:59+07:00');
                    const hasWarningToday = existingNotif.some(n =>
                        n.type === "warning" &&
                        n.title.includes("STREAK CỦA BẠN ĐANG NGUY HIỂM") &&
                        n.createdAt >= todayStart &&
                        n.createdAt <= todayEnd
                    );
                    if(!hasWarningToday) {
                        await this.notificationService.createNotification(
                            userId,
                            "STREAK CỦA BẠN ĐANG NGUY HIỂM!",
                            `Bạn đã nghỉ học 1 ngày! Chuỗi ${currentStreak} ngày của bạn sẽ bị mất nếu hôm nay không học. Đây là CƠ HỘI CUỐI CÙNG để giữ lại thành quả của mình. Hãy học ngay để tiếp tục chuỗi chiến thắng! 💪`,
                            "warning",
                            "http://localhost:5173/journey"
                        );
                        const user = await this.userProgressRepository.db.collection("users").findOne({ _id: new ObjectId(userId) });
                        if(user && user.email) {
                            await this.sendStreakEmail(user.email, "warning", { currentStreak });
                            console.log(`📧 Email cảnh báo streak đã gửi đến ${user.email}`);
                        }
                    }
                } catch(err) {
                    console.error("Lỗi gửi thông báo/email cảnh báo streak:", err);
                }
            }
        }
        if(daysDiff >= 3) {
            const lostStreak = userProgress.streak || 0;
            const maxStreak = userProgress.maxStreak || 0;
            if(lostStreak > 0) {
                try {
                    const existingNotif = await this.notificationService.getNotificationsByUserId(userId);
                    const todayStart = new Date(todayStr + 'T00:00:00+07:00');
                    const todayEnd = new Date(todayStr + 'T23:59:59+07:00');
                    const hasStreakLostToday = existingNotif.some(n =>
                        n.type === "streak_lost" &&
                        n.title.includes("STREAK ĐÃ BỊ RESET VỀ 0") &&
                        n.message.includes(`${lostStreak} ngày`) &&
                        n.createdAt >= todayStart &&
                        n.createdAt <= todayEnd
                    );
                    if (!hasStreakLostToday) {
                        let title = "STREAK ĐÃ BỊ RESET VỀ 0!";
                        let message = "";
                        if(lostStreak >= 30) {
                            message = `Thật đáng tiếc! Bạn đã mất chuỗi ${lostStreak} ngày học tập kiên trì do nghỉ 2 ngày liên tiếp. Đây là một mất mát lớn, nhưng đừng để nó đánh gục bạn! Kỷ lục ${maxStreak} ngày của bạn vẫn còn đó - hãy bắt đầu lại và phá vỡ chính mình! 🔥`;
                        } else if(lostStreak >= 7) {
                            message = `Rất tiếc! Chuỗi ${lostStreak} ngày của bạn đã kết thúc do nghỉ 2 ngày liên tiếp. Nhưng đừng bỏ cuộc! Hãy học ngay hôm nay để bắt đầu một chuỗi mới mạnh mẽ hơn. Bạn đã làm được ${lostStreak} ngày, lần này bạn có thể làm tốt hơn! 💪`;
                        } else {
                            message = `Streak ${lostStreak} ngày của bạn đã kết thúc do nghỉ 2 ngày liên tiếp. Đừng lo lắng! Mọi hành trình đều bắt đầu từ bước đầu tiên. Hãy học ngay hôm nay để khởi đầu chuỗi streak mới! 🚀`;
                        }
                        await this.notificationService.createNotification(userId, title, message, "streak_lost", "http://localhost:5173/streak");
                        const user = await this.userProgressRepository.db.collection("users").findOne({ _id: new ObjectId(userId) });
                        if(user && user.email) {
                            await this.sendStreakEmail(user.email, "lost", { lostStreak, maxStreak });
                            console.log(`📧 Email thông báo streak lost đã gửi đến ${user.email}`);
                        }
                    }
                } catch(err) {
                    console.error("Lỗi gửi thông báo/email streak bị reset:", err);
                }
            }
            const updateOp = { $set: { streak: 0 } };
            await this.userProgressRepository.update(userId, updateOp, true);
            await invalidateUserProgressCache();
            return { ...userProgress, streak: 0 };
        }
        return userProgress;
    }

    async sendStreakEmail(userEmail, type, streakData) {
        const { currentStreak, lostStreak, maxStreak } = streakData;
        let subject = "";
        let heading = "";
        let content = "";
        if(type === "warning") {
            subject = "⚠️ CẢNH BÁO: Streak Của Bạn Đang Nguy Hiểm!";
            heading = "🔥 STREAK CỦA BẠN CẦN BẠN!";
            content = `
                <p>Xin chào bạn 👋,</p>
                <p style="color: #ff6b6b; font-weight: bold; font-size: 16px;">
                    Bạn đã nghỉ học 1 ngày và chuỗi <strong>${currentStreak} ngày</strong> của bạn đang trong tình trạng nguy hiểm!
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>⏰ ĐÂY LÀ CƠ HỘI CUỐI CÙNG!</strong><br>
                        Nếu hôm nay bạn không học, chuỗi ${currentStreak} ngày của bạn sẽ bị reset về 0. 
                        Tất cả những nỗ lực trước đó sẽ không còn nữa.
                    </p>
                </div>
                <p style="font-size: 16px; line-height: 1.6;">
                    Hãy dành chỉ <strong>5-10 phút</strong> để học một bài ngắn, ôn vài từ vựng, 
                    hoặc luyện nghe một đoạn hội thoại. Đó là tất cả những gì cần để giữ lại thành quả của bạn! 💪
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/journey" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                        🚀 HỌC NGAY BÂY GIỜ
                    </a>
                </div>
            `;
        } else if(type === "lost") {
            subject = "💔 Streak Của Bạn Đã Bị Reset";
            heading = "😔 STREAK ĐÃ BỊ RESET VỀ 0";
            if(lostStreak >= 30) {
                content = `
                    <p>Xin chào bạn 👋,</p>
                    <p style="color: #dc3545; font-weight: bold; font-size: 16px;">
                        Thật đáng tiếc! Bạn đã mất chuỗi <strong style="font-size: 20px;">${lostStreak} ngày</strong> học tập kiên trì do nghỉ 2 ngày liên tiếp.
                    </p>
                    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; color: #721c24;">
                            Đây là một mất mát lớn, nhưng đừng để nó đánh gục bạn! 
                            Kỷ lục <strong>${maxStreak} ngày</strong> của bạn vẫn còn đó và chứng minh bạn đã có thể làm được điều đó.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Mỗi huyền thoại đều có lúc vấp ngã. Điều khác biệt giữa người thành công và người thất bại 
                        là khả năng đứng dậy và bắt đầu lại. Hãy bắt đầu lại và lần này bạn sẽ phá vỡ chính mình! 🔥
                    </p>
                `;
            } else if(lostStreak >= 7) {
                content = `
                    <p>Xin chào bạn 👋,</p>
                    <p style="color: #dc3545; font-weight: bold; font-size: 16px;">
                        Rất tiếc! Chuỗi <strong>${lostStreak} ngày</strong> của bạn đã kết thúc do nghỉ 2 ngày liên tiếp.
                    </p>
                    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; color: #721c24;">
                            Nhưng đừng bỏ cuộc! Bạn đã chứng minh được khả năng học ${lostStreak} ngày liên tiếp - 
                            đó là một thành tích đáng tự hào.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Lần này, với kinh nghiệm đã có, bạn có thể làm tốt hơn! 
                        Hãy đặt mục tiêu vượt qua ${lostStreak} ngày và tạo nên kỷ lục mới. Bạn làm được mà! 💪
                    </p>
                `;
            } else {
                content = `
                    <p>Xin chào bạn 👋,</p>
                    <p style="color: #dc3545; font-weight: bold; font-size: 16px;">
                        Streak <strong>${lostStreak} ngày</strong> của bạn đã kết thúc do nghỉ 2 ngày liên tiếp.
                    </p>
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; color: #0c5460;">
                            <strong>Đừng lo lắng!</strong> Mọi hành trình đều bắt đầu từ bước đầu tiên. 
                            Điều quan trọng là bạn tiếp tục đi tiếp, không dừng lại.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Hãy học ngay hôm nay để khởi đầu chuỗi streak mới! Lần này bạn đã biết cách duy trì rồi đấy. 🚀
                    </p>
                `;
            }
            content += `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/journey" 
                       style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                        🔥 BẮT ĐẦU LẠI NGAY
                    </a>
                </div>
            `;
        }
        const mailOptions = {
            from: config.email.user,
            to: userEmail,
            subject: subject,
            html: `
                <div>
                    <h2 style="color: #4CAF50; text-align: center;">${heading}</h2>
                    ${content}
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666; line-height: 1.6;">
                        <strong>💡 Mẹo duy trì streak:</strong><br>
                        • Đặt lịch nhắc nhở hàng ngày vào cùng một giờ<br>
                        • Bắt đầu với mục tiêu nhỏ (5-10 phút/ngày)<br>
                        • Học vào buổi sáng để đảm bảo không quên<br>
                        • Kết hợp học với thói quen hàng ngày của bạn
                    </p>
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        Chúc bạn một hành trình học tập thành công! 🌟<br>
                        — <strong>Đội ngũ EasyTalk</strong><br>
                        <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
                    </p>
                </div>
            `,
        };
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, (error, info) => {
                if(error) {
                    console.error("Lỗi gửi email streak:", error);
                    reject(error);
                } else {
                    console.log("Email streak đã gửi:", info.response);
                    resolve(info);
                }
            });
        });
    }
}

module.exports = StreakService;