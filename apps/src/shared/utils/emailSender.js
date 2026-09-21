const { EmailConnection } = require('../config');

const sendEmail = async (to, subject, html, options = {}) => {
    try {
        if (!EmailConnection.isInitialized()) {
            throw new Error('Email service not initialized');
        }
        const mailOptions = {
            to,
            subject,
            html,
            ...options
        };
        const info = await EmailConnection.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${subject}`);
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error(`Email send error to ${to}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

const sendStreakWarningEmail = async (userEmail, streakData) => {
    const { currentStreak } = streakData;
    const subject = "⚠️ CẢNH BÁO: Streak Của Bạn Đang Nguy Hiểm!";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">🔥 STREAK CỦA BẠN CẦN BẠN!</h2>
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
                <a href="http://localhost:5173/journey" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                    🚀 HỌC NGAY BÂY GIỜ
                </a>
            </div>
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
    `;
    return await sendEmail(userEmail, subject, html);
};

const sendStreakLostEmail = async (userEmail, streakData) => {
    const { lostStreak, maxStreak } = streakData;
    const subject = "💔 Streak Của Bạn Đã Bị Reset";
    let message = '';
    if (lostStreak >= 30) {
        message = `
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
    } else if (lostStreak >= 7) {
        message = `
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
        message = `
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
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">😔 STREAK ĐÃ BỊ RESET VỀ 0</h2>
            <p>Xin chào bạn 👋,</p>
            ${message}
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/journey" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                    🔥 BẮT ĐẦU LẠI NGAY
                </a>
            </div>
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
    `;
    return await sendEmail(userEmail, subject, html);
};

const sendWelcomeEmail = async (userEmail, username) => {
    const subject = "🎉 Chào mừng bạn đến với EasyTalk!";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">Chào mừng ${username}! 🎉</h2>
            <p>Xin chào <strong>${username}</strong> 👋,</p>
            <p style="font-size: 16px; line-height: 1.6;">
                Chúc mừng bạn đã tham gia cộng đồng học tiếng Anh EasyTalk! 
                Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình chinh phục tiếng Anh.
            </p>
            <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #2e7d32;">
                    <strong>🚀 Bắt đầu ngay hôm nay để:</strong><br>
                    • Xây dựng chuỗi streak học tập<br>
                    • Mở khóa các bài học và bài tập<br>
                    • Tích lũy điểm kinh nghiệm và kim cương<br>
                    • Cạnh tranh trên bảng xếp hạng
                </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/journey" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                    🎯 BẮT ĐẦU HỌC NGAY
                </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Chúc bạn học tập hiệu quả! 🌟<br>
                — <strong>Đội ngũ EasyTalk</strong><br>
                <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
            </p>
        </div>
    `;
    return await sendEmail(userEmail, subject, html);
};

const sendPasswordResetEmail = async (userEmail, resetToken) => {
    const subject = "🔐 Yêu Cầu Đặt Lại Mật Khẩu";
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">Đặt Lại Mật Khẩu</h2>
            <p>Xin chào 👋,</p>
            <p style="font-size: 16px; line-height: 1.6;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                    🔐 ĐẶT LẠI MẬT KHẨU
                </a>
            </div>
            <p style="font-size: 14px; color: #666;">
                Hoặc copy link sau vào trình duyệt:<br>
                <code style="background-color: #f5f5f5; padding: 5px 10px; border-radius: 3px;">${resetLink}</code>
            </p>
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #856404;">
                    <strong>⚠️ Lưu ý:</strong> Link này chỉ có hiệu lực trong <strong>1 giờ</strong>.
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                </p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                — <strong>Đội ngũ EasyTalk</strong><br>
                <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
            </p>
        </div>
    `;
    return await sendEmail(userEmail, subject, html);
};

const sendVerificationEmail = async (userEmail, verificationToken) => {
    const subject = "✉️ Xác Thực Email Của Bạn";
    const verifyLink = `http://localhost:5173/verify-email?token=${verificationToken}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">Xác Thực Email</h2>
            <p>Xin chào 👋,</p>
            <p style="font-size: 16px; line-height: 1.6;">
                Cảm ơn bạn đã đăng ký tài khoản EasyTalk! 
                Vui lòng xác thực email của bạn để hoàn tất quá trình đăng ký.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                    ✅ XÁC THỰC EMAIL
                </a>
            </div>
            <p style="font-size: 14px; color: #666;">
                Hoặc copy link sau vào trình duyệt:<br>
                <code style="background-color: #f5f5f5; padding: 5px 10px; border-radius: 3px;">${verifyLink}</code>
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                — <strong>Đội ngũ EasyTalk</strong><br>
                <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
            </p>
        </div>
    `;
    return await sendEmail(userEmail, subject, html);
};

module.exports = {
    sendEmail,
    sendStreakWarningEmail,
    sendStreakLostEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVerificationEmail
};