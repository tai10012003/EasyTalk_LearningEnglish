const UserRepository = require('../repositories/userRepository');
const AuthenticationService = require('./AuthenticationService');
const EmailService = require('./emailService');
const SocialAuthService = require('./socialAuthService');
const { hashPassword, comparePassword, generateTempPassword, generateVerificationCode } = require('../utils/passwordUtils');
const tokenManager = require('../utils/tokenManager');

class UserService {
    constructor(deps = {}) {
        this.repository = deps.repository || new UserRepository();
        this.authService = deps.authService || new AuthenticationService();
        this.emailService = deps.emailService || new EmailService();
        this.socialAuthService = deps.socialAuthService || new SocialAuthService();
        this.notificationService = deps.notificationService || null;
        this.userSettingService = deps.userSettingService || null;
        this.userProgressService = deps.userProgressService || null;
        this.flashcardService = deps.flashcardService || null;
    }

    setDependencies(notificationService, userSettingService, userProgressService, flashcardService) {
        this.notificationService = notificationService;
        this.userSettingService = userSettingService;
        this.userProgressService = userProgressService;
        this.flashcardService = flashcardService;
    }

    async getUserList(page = 1, limit = 12, role = "") {
        const skip = (page - 1) * limit;
        const filter = {};
        if(role) filter.role = role;
        const { users, total } = await this.repository.findAll(filter, skip, limit);
        return { users, totalUsers: total };
    }

    async getUser(id) {
        return await this.repository.findById(id);
    }

    async getUserByEmail(email) {
        return await this.repository.findByEmail(email);
    }

    async getUserById(userId) {
        return await this.repository.findById(userId);
    }

    async sendRegisterCode(username, email, password, role = "user") {
        const exist = await this.repository.findByEmail(email);
        if(exist) throw new Error("Email đã được sử dụng trong hệ thống, vui lòng nhập email khác!");
        const verificationCode = generateVerificationCode();
        const expiresAt = Date.now() + 90 * 1000;
        tokenManager.storeVerificationCode(email, verificationCode, expiresAt, {
            username, email, password, role
        });
        await this.emailService.sendRegisterVerificationCode(email, username, verificationCode);
        return { 
            success: true, 
            message: "Mã xác thực đã được gửi tới email của bạn.", 
            expiresAt, 
            serverTime: Date.now() 
        };
    }

    async verifyRegisterCode(email, code) {
        const record = tokenManager.getVerificationCode(email);
        if(!record) {
            throw new Error("Mã xác thực đã hết hạn hoặc không tồn tại!");
        }
        if(Date.now() > record.expiresAt) {
            tokenManager.deleteVerificationCode(email);
            throw new Error("Mã xác thực đã hết hạn, vui lòng gửi lại mã mới!");
        }
        if(String(record.code) !== String(code)) {
            throw new Error("Mã xác thực không hợp lệ. Vui lòng nhập chính xác!");
        }
        const { username, password, role } = record.dataToRegister;
        const hashedPassword = await hashPassword(password);
        const user = { 
            username, 
            email, 
            password: hashedPassword, 
            role, 
            active: "active" 
        };
        const result = await this.repository.insert(user);
        user._id = result.insertedId;
        await this.userProgressService.createUserProgress(user._id);
        tokenManager.deleteVerificationCode(email);
        return user;
    }

    async login(email, password) {
        const user = await this.repository.findByEmail(email);
        if(!user) {
            throw new Error("Email đăng nhập hoặc mật khẩu không đúng !!");
        }
        const passwordIsValid = await comparePassword(password, user.password);
        if(!passwordIsValid) {
            throw new Error("Email đăng nhập hoặc mật khẩu không đúng !!");
        }
        if(user.active === "locked") {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ !!");
        }
        const { accessToken, refreshToken } = this.authService.generateTokenPair(user);
        await this.repository.update(user._id.toString(), { lastActive: new Date() });
        await this.userProgressService.checkAndResetStreakOnLogin(user._id.toString());
        await this.userProgressService.checkAndUnlockChampionPrizes(user._id.toString());
        const language = await this.userSettingService.getUserLanguage(user._id);
        return { token: accessToken, refreshToken: refreshToken, role: user.role, language };
    }

    async loginWithGoogle(code) {
        const { user, isNewUser, tempPassword } = await this.socialAuthService.handleGoogleLogin(code, this.repository);
        if (isNewUser) {
            await this.userProgressService.createUserProgress(user._id);
            if(tempPassword) {
                this.emailService.sendWelcomeWithTempPassword(user.email, user.username, tempPassword).catch(err => console.error("Gửi email thất bại:", err));
            }
            await this.notificationService.createNotification(
                user._id,
                "Chào mừng bạn đến với EasyTalk!",
                "Bạn đã đăng ký tài khoản mới thành công. Hãy bắt đầu học ngay hôm nay nhé!",
                "success"
            );
            await this.notificationService.createNotification(
                user._id,
                "Mật khẩu tạm thời đã gửi tới email!",
                `Khi đăng nhập Google, mật khẩu tạm thời sẽ được gửi đến email ${user.email}. Vui lòng kiểm tra hộp thư email nhé!`,
                "system"
            );
        }
        const { accessToken, refreshToken } = this.authService.generateTokenPair(user);
        await this.repository.update(user._id.toString(), { lastActive: new Date() });
        await this.userProgressService.checkAndResetStreakOnLogin(user._id.toString());
        await this.userProgressService.checkAndUnlockChampionPrizes(user._id.toString());
        const language = await this.userSettingService.getUserLanguage(user._id);
        return { token: accessToken,  refreshToken: refreshToken,  role: user.role, language };
    }

    async loginWithFacebook(code) {
        const { user, isNewUser, tempPassword } = await this.socialAuthService.handleFacebookLogin(code, this.repository);
        if (isNewUser && tempPassword) {
            const mailHtml = `
                <p>Xin chào <strong>${user.username}</strong>,</p>
                <p>Bạn vừa đăng ký tài khoản bằng Facebook trên EasyTalk.</p>
                <p>Đây là mật khẩu tạm thời để bạn có thể đăng nhập bằng email nếu muốn:</p>
                <h3 style="color:#4CAF50;">${tempPassword}</h3>
                <p>Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập.</p>
                <br/>
                <p>Trân trọng,<br>Nhóm hỗ trợ EasyTalk</p>
            `;
            console.log(`✅ Đã gửi mật khẩu tạm thời đến ${user.email}`);
        }
        const { accessToken, refreshToken } = this.authService.generateTokenPair(user);
        await this.repository.update(user._id.toString(), { lastActive: new Date() });
        await this.userProgressService.checkAndResetStreakOnLogin(user._id.toString());
        await this.userProgressService.checkAndUnlockChampionPrizes(user._id.toString());
        return { token: accessToken, refreshToken: refreshToken, role: user.role };
    }

    async refreshAccessToken(refreshToken) {
        const decoded = this.authService.verifyRefreshToken(refreshToken);
        const user = await this.repository.findById(decoded.id);
        if(!user) throw new Error("User không tồn tại");
        if(user.active === "locked") {
            throw new Error("Tài khoản đã bị khóa");
        }
        const newAccessToken = this.authService.generateAccessToken(user);
        return { token: newAccessToken, role: user.role };
    }

    async logout(refreshToken, req = null) {
        this.authService.revokeRefreshToken(refreshToken);
        if(req?.user?.id) {
            await this.repository.update(req.user.id, { lastActive: new Date() });
        }
        return { message: "Đăng xuất thành công" };
    }

    async changePassword(userId, currentPassword, newPassword, confirmNewPassword) {
        if(!currentPassword || !newPassword || !confirmNewPassword) {
            throw new Error("Vui lòng nhập đầy đủ thông tin mật khẩu.");
        }
        if(newPassword !== confirmNewPassword) {
            throw new Error("Mật khẩu mới không khớp.");
        }
        const user = await this.repository.findById(userId);
        if(!user) {
            throw new Error("Không tìm thấy người dùng.");
        }
        const passwordIsValid = await comparePassword(currentPassword, user.password);
        if(!passwordIsValid) {
            throw new Error("Mật khẩu hiện tại không chính xác.");
        }
        const hashedNewPassword = await hashPassword(newPassword);
        await this.repository.updatePassword(userId, hashedNewPassword);
        return { message: "Đổi mật khẩu thành công." };
    }

    async sendForgotPasswordCode(email) {
        const user = await this.repository.findByEmail(email);
        if(!user) {
            throw new Error("Email đã nhập không tồn tại trên hệ thống !!");
        }
        const verificationCode = generateVerificationCode();
        const expiresAt = Date.now() + 60 * 1000;
        tokenManager.storeVerificationCode(email, verificationCode, expiresAt);
        await this.emailService.sendForgotPasswordCode(email, user.username, verificationCode);
        return { 
            success: true, 
            message: "Mã xác thực đã được gửi đến email của bạn!", 
            expiresAt, 
            serverTime: Date.now() 
        };
    }

    verifyForgotPasswordCode(email, code) {
        const record = tokenManager.getVerificationCode(email);
        if(!record) {
            throw new Error("Mã xác thực đã hết hạn hoặc không tồn tại!");
        }
        if(Date.now() > record.expiresAt) {
            tokenManager.deleteVerificationCode(email);
            throw new Error("Mã xác thực đã hết hạn, vui lòng gửi lại mã mới!");
        }
        if(String(record.code) !== String(code)) {
            throw new Error("Mã xác thực không hợp lệ. Vui lòng nhập chính xác!");
        }
        tokenManager.deleteVerificationCode(email);
        return { success: true, message: "Mã xác thực chính xác!" };
    }

    async resetPassword(email, newPassword) {
        const user = await this.repository.findByEmail(email);
        if(!user) {
            throw new Error("User not found");
        }
        const hashedPassword = await hashPassword(newPassword);
        await this.repository.updatePassword(user._id, hashedPassword);
        return { message: "Password reset successful" };
    }

    async resetTempPassword(userId) {
        const user = await this.repository.findById(userId);
        if(!user) throw new Error("Không tìm thấy người dùng!");
        const tempPassword = generateTempPassword();
        const hashedTempPassword = await hashPassword(tempPassword);
        await this.repository.updatePassword(userId, hashedTempPassword);
        await this.emailService.sendTempPassword(user.email, user.username, tempPassword);
        await this.notificationService.createNotification(
            userId,
            "Mật khẩu tạm thời đã được đặt lại",
            `Quản trị viên đã đặt lại mật khẩu tạm thời cho tài khoản của bạn, vui lòng kiểm tra email.`,
            "system"
        );
        return { success: true,message: "Đặt lại mật khẩu tạm thời thành công! Email đã được gửi tới người dùng.",tempPassword };
    }

    async updateProfile(userId, username, email) {
        const updatedUser = await this.repository.update(userId, { username, email });
        if(!updatedUser) {
            throw new Error("Không tìm thấy người dùng !");
        }
        return { success: true, message: "Thông tin của bạn đã được cập nhật thành công !", user: updatedUser };
    }

    async insertUser(user) {
        return await this.repository.insert(user);
    }

    async updateUser(user) {
        const { _id, ...updateFields } = user;
        return await this.repository.update(_id, updateFields);
    }

    async deleteUser(id) {
        const user = await this.repository.findById(id);
        if(!user) throw new Error("Không tìm thấy người dùng.");
        const result = await this.repository.delete(id);
        try {
            await this.notificationService.deleteNotificationsByUser(id);
            await this.userProgressService.deleteUserProgressByUser(id);
            await this.flashcardService.deleteUserFlashcards(id);
        } catch (error) {
            console.error(`Không thể xóa dữ liệu liên quan tới user ${id}:`, error);
        }
        return result;
    }
}

module.exports = UserService;