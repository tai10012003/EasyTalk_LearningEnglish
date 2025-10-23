const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const config = require("../config/setting");
const { getGoogleUser } = require("../util/googleAuth");
const { getFacebookAccessToken, getFacebookUser } = require("../util/facebookAuth");
const { UserRepository } = require("./../repositories");
const NotificationService = require("./NotificationService");
const notificationService = new NotificationService();

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

    async deleteUser(id) {
        return await this.userRepository.delete(id);
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
            subject: "Mã xác thực đăng ký tài khoản EasyTalk",
            html: `
                <p>Xin chào <strong>${username}</strong>,</p>
                <p>Bạn vừa yêu cầu đăng ký tài khoản trên EasyTalk.</p>
                <p>Vui lòng nhập mã xác thực 5 số bên dưới để hoàn tất đăng ký:</p>
                <h2 style="color: #4CAF50;">${verificationCode}</h2>
                <p>Mã có hiệu lực trong 5 phút.</p>
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
        return { token: accessToken, refreshToken: refreshToken, role: user.role };
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
                    <p>Xin chào <strong>${name || email.split("@")[0]}</strong>,</p>
                    <p>Bạn vừa đăng ký tài khoản bằng Google trên EasyTalk.</p>
                    <p>Đây là mật khẩu tạm thời để bạn có thể đăng nhập bằng email nếu muốn:</p>
                    <h3 style="color:#4CAF50;">${tempPassword}</h3>
                    <p>Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập.</p>
                    <br/>
                    <p>Trân trọng,<br>Nhóm hỗ trợ EasyTalk</p>
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
        return { token: accessToken, refreshToken: refreshToken, role: user.role };
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
            subject: "Thông Báo Mã Xác Thực Đặt Lại Mật Khẩu Từ EasyTalk",
            html: `<p>Xin chào,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Vui lòng sử dụng mã xác minh bên dưới để tiến hành đặt lại mật khẩu của bạn. Mã này có hiệu lực trong <strong>1 phút</strong>.</p>
            <h2 style="color: #4CAF50;">${verificationCode}</h2>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc <a href="pductai14@gmail.com">liên hệ với bộ phận hỗ trợ</a> nếu bạn có bất kỳ thắc mắc nào.</p>
            <p>Trân trọng,</p>
            <p>Nhóm hỗ trợ EasyTalk</p>`,
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