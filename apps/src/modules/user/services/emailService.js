const nodemailer = require("nodemailer");
const config = require("../../../shared/config/setting");

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { 
                user: config.email.user, 
                pass: config.email.pass 
            },
        });
    }

    async sendRegisterVerificationCode(email, username, verificationCode) {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "🔐 Xác thực đăng ký tài khoản EasyTalk",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; color: #333;">
                    <h2 style="text-align: center; color: #4CAF50;">Chào mừng bạn đến với EasyTalk! 🎉</h2>
                    <p>Xin chào <strong>${username}</strong>,</p>
                    <p>Cảm ơn bạn đã lựa chọn <strong>EasyTalk</strong> để đồng hành trong hành trình học tiếng Anh của mình.</p>
                    <p>Để hoàn tất việc đăng ký tài khoản, vui lòng nhập mã xác thực gồm <strong>5 chữ số</strong> dưới đây vào ô xác thực trên trang đăng ký:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <h1 style="color: #4CAF50; letter-spacing: 5px;">${verificationCode}</h1>
                    </div>
                    <p><strong>Lưu ý:</strong> Mã này chỉ có hiệu lực trong <strong>1 phút 30 giây</strong>. Sau thời gian này, bạn có thể yêu cầu gửi lại mã mới nếu cần.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666;">Thân mến,<br><strong>Đội ngũ EasyTalk</strong><br>
                    <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a></p>
                </div>
            `,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendForgotPasswordCode(email, username, verificationCode) {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "🔒 Mã Xác Thực Đặt Lại Mật Khẩu - EasyTalk",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; color: #333;">
                    <h2 style="text-align: center; color: #4CAF50;">Yêu cầu đặt lại mật khẩu 🔑</h2>
                    <p>Xin chào <strong>${username || email.split("@")[0]}</strong>,</p>
                    <p>Chúng tôi đã nhận được yêu cầu <strong>đặt lại mật khẩu</strong> cho tài khoản của bạn trên <strong>EasyTalk</strong>.</p>
                    <p>Vui lòng sử dụng <strong>mã xác thực 5 số</strong> bên dưới để tiếp tục quá trình đặt lại mật khẩu.  
                    Mã có hiệu lực trong <strong>1 phút</strong>.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <h1 style="color: #4CAF50; letter-spacing: 4px;">${verificationCode}</h1>
                    </div>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng <strong>bỏ qua email này</strong> hoặc 
                    <a href="mailto:pductai14@gmail.com" style="color: #4CAF50; text-decoration: none;">liên hệ với bộ phận hỗ trợ EasyTalk</a> để được trợ giúp.</p>
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666;">
                        Trân trọng,<br>
                        <strong>Đội ngũ EasyTalk</strong><br>
                        <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
                    </p>
                </div>
            `,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendTempPassword(email, username, tempPassword) {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "🔑 Mật Khẩu Tạm Thời Mới Từ EasyTalk",
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; color: #333;">
                <h2 style="text-align: center; color: #4CAF50;">Cập nhật mật khẩu tạm thời 🔒</h2>
                <p>Xin chào <strong>${username}</strong>,</p>
                <p>Đây là thông báo từ hệ thống <strong>EasyTalk</strong>.</p>
                <p>Quản trị viên đã tiến hành <strong>đặt lại mật khẩu tạm thời</strong> cho tài khoản của bạn nhằm đảm bảo tính an toàn và bảo mật.</p>
                <p>Bạn có thể sử dụng mật khẩu tạm thời bên dưới để đăng nhập:</p>
                <div style="text-align: center; margin: 25px 0;">
                <h2 style="color: #4CAF50; letter-spacing: 2px;">${tempPassword}</h2>
                </div>
                <p style="font-size: 15px;">Vì lý do bảo mật, <strong>bạn nên đổi mật khẩu ngay sau khi đăng nhập</strong> để đảm bảo tài khoản của bạn luôn được bảo vệ.</p>
                <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 14px; color: #666;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng <strong>bỏ qua email này</strong> hoặc 
                <a href="mailto:pductai14@gmail.com" style="color: #4CAF50; text-decoration: none;">liên hệ với đội ngũ hỗ trợ EasyTalk</a> để được trợ giúp.
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Trân trọng,<br>
                <strong>Đội ngũ EasyTalk</strong><br>
                <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
                </p>
            </div>
            `,
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendWelcomeWithTempPassword(email, name, tempPassword) {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "🔑 Mật khẩu tạm thời từ EasyTalk",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; color: #333;">
                    <h2 style="text-align: center; color: #4CAF50;">Chào mừng bạn đến với EasyTalk! 🎉</h2>
                    <p>Xin chào <strong>${name || email.split("@")[0]}</strong>,</p>
                    <p>Cảm ơn bạn đã đăng ký và đăng nhập bằng <strong>Google</strong> trên nền tảng <strong>EasyTalk</strong>.</p>
                    <p>Chúng tôi đã tạo cho bạn một <strong>mật khẩu tạm thời</strong> để bạn có thể đăng nhập bằng tài khoản thông thường (email & mật khẩu) nếu muốn. 
                    Điều này giúp bạn linh hoạt sử dụng cả hai cách đăng nhập — bằng Google hoặc trực tiếp qua hệ thống.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <h1 style="color: #4CAF50; letter-spacing: 3px;">${tempPassword}</h1>
                    </div>
                    <p><strong>Vì lý do bảo mật</strong>, bạn nên thay đổi mật khẩu ngay sau khi đăng nhập lần đầu bằng mật khẩu tạm thời này.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666;">Thân mến,<br><strong>Đội ngũ EasyTalk</strong><br>
                    <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a></p>
                </div>
            `,
        };
        await this.transporter.sendMail(mailOptions);
    }
}

module.exports = EmailService;