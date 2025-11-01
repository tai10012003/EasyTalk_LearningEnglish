const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const config = require("../config/setting");
const { getGoogleUser } = require("../util/googleAuth");
const { getFacebookAccessToken, getFacebookUser } = require("../util/facebookAuth");
const { UserRepository } = require("./../repositories");
const NotificationService = require("./notificationService");
const notificationService = new NotificationService();
const UserSettingService = require("./usersettingService");
const usersettingService = new UserSettingService();
const UserprogressService = require("./userprogressService");
const userprogressService = new UserprogressService();

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
        this.verificationCodes = {};
        this.refreshTokens = new Map();
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: config.email.user, pass: config.email.pass },
        });
    }

    async getUserList(page = 1, limit = 12, role = "") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (role) filter.role = role;
        const { users, total } = await this.userRepository.findAll(filter, skip, limit);
        return { users, totalUsers: total };
    }

    async getUser(id) {
        return await this.userRepository.findById(id);
    }

    async getUserByEmail(email) {
        return await this.userRepository.findByEmail(email);
    }

    async updatePassword(userId, hashedNewPassword) {
        return await this.userRepository.updatePassword(userId, hashedNewPassword);
    }

    async insertUser(user) {
        return await this.userRepository.insert(user);
    }

    async updateUser(user) {
        const { _id, ...updateFields } = user;
        return await this.userRepository.update(_id, updateFields);
    }

    async resetTempPassword(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("Không tìm thấy người dùng!");
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
        await this.userRepository.updatePassword(userId, hashedTempPassword);
        const mailOptions = {
            from: config.email.user,
            to: user.email,
            subject: "🔑 Mật Khẩu Tạm Thời Mới Từ EasyTalk",
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; color: #333;">
                <h2 style="text-align: center; color: #4CAF50;">Cập nhật mật khẩu tạm thời 🔒</h2>
                <p>Xin chào <strong>${user.username}</strong>,</p>
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
        await notificationService.createNotification(
            userId,
            "Mật khẩu tạm thời đã được đặt lại",
            `Quản trị viên đã đặt lại mật khẩu tạm thời cho tài khoản của bạn, vui lòng kiểm tra email.`,
            "system"
        );
        return {
            success: true,
            message: "Đặt lại mật khẩu tạm thời thành công! Email đã được gửi tới người dùng.",
            tempPassword,
        };
    }

    async deleteUser(id) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new Error("Không tìm thấy người dùng.");
        const result = await this.userRepository.delete(id);
        try {
            await notificationService.deleteNotificationsByUser(id);
            await userprogressService.deleteUserProgress(id);
        } catch (error) {
            console.error(`Không thể xóa thông báo liên quan tới user ${id}:`, error);
        }
        return result;
    }

    // async register(username, email, password, confirmPassword, role = "user") {
    //     if (password !== confirmPassword) throw new Error("Passwords do not match.");
    //     const hashedPassword = await bcrypt.hash(password, 10);
    //     const user = { username, email, password: hashedPassword, role, active: "active" };
    //     const result = await this.userRepository.insert(user);
    //     user._id = result.insertedId;
    //     return user;
    // }

    async sendRegisterCode(username, email, password, role = "user") {
        const exist = await this.userRepository.findByEmail(email);
        if (exist) throw new Error("Email đã được sử dụng trong hệ thống, vui lòng nhập email khác!");
        const verificationCode = Math.floor(10000 + Math.random() * 90000);
        const expiresAt = Date.now() + 90 * 1000;
        this.verificationCodes[email] = {
            code: verificationCode,
            expiresAt,
            dataToRegister: { username, email, password, role },
        };
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
        return { success: true, message: "Mã xác thực đã được gửi tới email của bạn.", expiresAt, serverTime: Date.now(), };
    }

    async verifyRegisterCode(email, code) {
        const record = this.verificationCodes[email];
        if (!record) throw new Error("Mã xác thực đã hết hạn hoặc không tồn tại!");
        if (Date.now() > record.expiresAt) {
            delete this.verificationCodes[email];
            throw new Error("Mã xác thực đã hết hạn, vui lòng gửi lại mã mới!");
        }
        if (String(record.code) !== String(code)) throw new Error("Mã xác thực không hợp lệ. Vui lòng nhập chính xác!");
        const { username, password, role } = record.dataToRegister;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { username, email, password: hashedPassword, role, active: "active" };
        const result = await this.userRepository.insert(user);
        user._id = result.insertedId;
        delete this.verificationCodes[email];
        return user;
    }

    generateAccessToken(user) {
        return jwt.sign({ id: user._id, role: user.role, username: user.username }, config.jwt.secret, { expiresIn: "15m" });
    }

    generateRefreshToken(user) {
        return jwt.sign({  id: user._id, type: "refresh" }, config.jwt.secret, { expiresIn: "7d" });
    }

    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user)
            throw new Error("Email đăng nhập hoặc mật khẩu không đúng !!");
        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid)
            throw new Error("Email đăng nhập hoặc mật khẩu không đúng !!");
        if (user.active == "locked")
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ !!");
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        this.refreshTokens.set(refreshToken, user._id.toString());
        const language = await usersettingService.getUserLanguage(user._id);
        return { token: accessToken, refreshToken: refreshToken, role: user.role, language };
    }

    async loginWithGoogle(code) {
        const googleUser = await getGoogleUser(code);
        const { email, name } = googleUser;
        let user = await this.userRepository.findByEmail(email);
        let isNewUser = false;
        if (!user) {
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            const insertResult = await this.userRepository.insert({
                username: name || email.split("@")[0],
                password: hashedPassword,
                email,
                role: "user",
                active: "active",
            });
            user = { _id: insertResult.insertedId, username: name || email.split("@")[0], email, role: "user", active: "active" };
            isNewUser = true;
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
            this.transporter.sendMail(mailOptions, (error) => {
                if (error) console.error("Gửi email thất bại:", error);
                else console.log(`✅ Đã gửi mật khẩu tạm thời đến ${email}`);
            });
        }
        if (user.active == "locked") {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ!");
        }
        if (isNewUser) {
            await notificationService.createNotification(
                user._id,
                "Chào mừng bạn đến với EasyTalk!",
                "Bạn đã đăng ký tài khoản mới thành công. Hãy bắt đầu học ngay hôm nay nhé!",
                "success"
            );
            await notificationService.createNotification(
                user._id,
                "Mật khẩu tạm thời đã gửi tới email!",
                `Khi đăng nhập Google, mật khẩu tạm thời sẽ được gửi đến email ${email}. Vui lòng kiểm tra hộp thư email nhé!`,
                "system"
            );
        }
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        this.refreshTokens.set(refreshToken, user._id.toString());
        const language = await usersettingService.getUserLanguage(user._id);
        return { token: accessToken, refreshToken: refreshToken, role: user.role, language };
    }

    async loginWithFacebook(code) {
        const tokenData = await getFacebookAccessToken(code);
        const accessToken = tokenData.access_token;
        const fbUser = await getFacebookUser(accessToken);
        const { email, name, id: facebookId } = fbUser;
        const userEmail = email || `facebook-${facebookId}@easytalk.com`;
        let user = await this.userRepository.findByEmail(userEmail);
        if (!user) {
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            await this.userRepository.insert({
                username: name || userEmail.split("@")[0],
                password: hashedPassword,
                email: userEmail,
                role: "user",
                active: "active",
                facebookId,
            });
            const mailOptions = {
                from: config.email.user,
                to: userEmail,
                subject: "🔑 Mật khẩu tạm thời từ EasyTalk",
                html: `
                    <p>Xin chào <strong>${name || userEmail.split("@")[0]}</strong>,</p>
                    <p>Bạn vừa đăng ký tài khoản bằng Facebook trên EasyTalk.</p>
                    <p>Đây là mật khẩu tạm thời để bạn có thể đăng nhập bằng email nếu muốn:</p>
                    <h3 style="color:#4CAF50;">${tempPassword}</h3>
                    <p>Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập.</p>
                    <br/>
                    <p>Trân trọng,<br>Nhóm hỗ trợ EasyTalk</p>
                `,
            };
            this.transporter.sendMail(mailOptions, (error) => {
                if (error) console.error("Gửi email thất bại:", error);
                else console.log(`✅ Đã gửi mật khẩu tạm thời đến ${userEmail}`);
            });
            user = await this.userRepository.findByEmail(userEmail);
        }
        if (user.active == "locked") {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ!");
        }
        const newAccessToken = this.generateAccessToken(user);
        const newRefreshToken = this.generateRefreshToken(user);
        this.refreshTokens.set(newRefreshToken, user._id.toString());
        return { token: newAccessToken, refreshToken: newRefreshToken, role: user.role };
    }

    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new Error("Refresh token không tồn tại");
        }
        if (!this.refreshTokens.has(refreshToken)) {
            throw new Error("Refresh token không hợp lệ");
        }
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret);
            if (decoded.type !== "refresh") {
                throw new Error("Token không phải refresh token");
            }
            const user = await this.userRepository.findById(decoded.id);
            if (!user) throw new Error("User không tồn tại");
            if (user.active == "locked") {
                throw new Error("Tài khoản đã bị khóa");
            }
            const newAccessToken = this.generateAccessToken(user);
            return { 
                token: newAccessToken,
                role: user.role 
            };
        } catch (error) {
        this.refreshTokens.delete(refreshToken);
            throw new Error("Refresh token hết hạn hoặc không hợp lệ");
        }
    }

    async logout(refreshToken) {
        if (refreshToken) {
            this.refreshTokens.delete(refreshToken);
        }
        return { message: "Đăng xuất thành công" };
    }

    async changePassword(userId, currentPassword, newPassword, confirmNewPassword) {
        if (!currentPassword || !newPassword || !confirmNewPassword)
            throw new Error("Vui lòng nhập đầy đủ thông tin mật khẩu.");
        if (newPassword !== confirmNewPassword)
            throw new Error("Mật khẩu mới không khớp.");
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new Error("Không tìm thấy người dùng.");
        const passwordIsValid = await bcrypt.compare(currentPassword, user.password);
        if (!passwordIsValid)
            throw new Error("Mật khẩu hiện tại không chính xác.");
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.updatePassword(userId, hashedNewPassword);
        return { message: "Đổi mật khẩu thành công." };
    }

    async sendForgotPasswordCode(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user)
            throw new Error("Email đã nhập không tồn tại trên hệ thống !!");
        const verificationCode = Math.floor(10000 + Math.random() * 90000);
        const expiresAt = Date.now() + 60 * 1000;
        this.verificationCodes[email] = { code: verificationCode, expiresAt };
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: "🔒 Mã Xác Thực Đặt Lại Mật Khẩu - EasyTalk",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; color: #333;">
                    <h2 style="text-align: center; color: #4CAF50;">Yêu cầu đặt lại mật khẩu 🔑</h2>
                    <p>Xin chào <strong>${name || email.split("@")[0]}</strong>,</p>
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
        return { success: true, message: "Mã xác thực đã được gửi đến email của bạn!", expiresAt, serverTime: Date.now() };
    }

    verifyForgotPasswordCode(email, code) {
        const record = this.verificationCodes[email];
        if (!record)
            throw new Error("Mã xác thực đã hết hạn hoặc không tồn tại!");
        if (Date.now() > record.expiresAt) {
            delete this.verificationCodes[email];
            throw new Error("Mã xác thực đã hết hạn, vui lòng gửi lại mã mới!");
        }
        if (String(record.code) !== String(code))
            throw new Error("Mã xác thực không hợp lệ. Vui lòng nhập chính xác!");

        delete this.verificationCodes[email];
        return { success: true, message: "Mã xác thực chính xác!" };
    }

    async resetPassword(email, newPassword) {
        const user = await this.userRepository.findByEmail(email);
        if (!user)
            throw new Error("User not found");
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.updatePassword(user._id, hashedPassword);
        return { message: "Password reset successful" };
    }

    async updateProfile(userId, username, email) {
        const updatedUser = await this.userRepository.update(userId, { username, email });
        if (!updatedUser)
            throw new Error("Không tìm thấy người dùng !");
        return { success: true, message: "Thông tin của bạn đã được cập nhật thành công !", user: updatedUser };
    }

    async getUserById(userId) {
        return await this.userRepository.findById(userId);
    }
}

module.exports = UserService;