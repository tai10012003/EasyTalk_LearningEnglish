const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const config = require("../config/setting.json");
const { getGoogleUser } = require("../util/googleAuth");
const { getFacebookAccessToken, getFacebookUser } = require("../util/facebookAuth");
const { UserRepository } = require("./../repositories");

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
        this.verificationCodes = {};
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: config.email.user, pass: config.email.pass },
        });
    }

    async getUserList(page = 1, limit = 3, role = "") {
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

    async register(username, email, password, confirmPassword, role = "user") {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { username, email, password: hashedPassword, role, active: "active" };
        await this.userRepository.insert(user);
        return { message: "Đăng ký thành công !!" };
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
        const token = jwt.sign(
            { id: user._id, role: user.role, username: user.username },
            config.jwt.secret,
            { expiresIn: "1h" }
        );
        return { token, role: user.role };
    }

    async loginWithGoogle(code) {
        const googleUser = await getGoogleUser(code);
        const { email, name } = googleUser;
        let user = await this.userRepository.findByEmail(email);
        if (!user) {
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            await this.userRepository.insert({
                username: name || email.split("@")[0],
                password: hashedPassword,
                email,
                role: "user",
                active: "active",
            });
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
            user = await this.userRepository.findByEmail(email);
        }
        if (user.active == "locked") {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ!");
        }
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: "1h" }
        );
        return { token, role: user.role };
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
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: "1h" }
        );
        return { token, role: user.role };
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