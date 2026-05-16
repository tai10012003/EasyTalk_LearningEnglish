const { getGoogleUser } = require("../../../shared/utils/googleAuth");
const { getFacebookAccessToken, getFacebookUser } = require("../../../shared/utils/facebookAuth");
const { hashPassword, generateTempPassword } = require("../utils/passwordUtils");

class SocialAuthService {
    async handleGoogleLogin(code, userRepository) {
        const googleUser = await getGoogleUser(code);
        const { email, name } = googleUser;
        let user = await userRepository.findByEmail(email);
        let isNewUser = false;
        let tempPassword = null;
        if(!user) {
            tempPassword = generateTempPassword();
            const hashedPassword = await hashPassword(tempPassword);
            const insertResult = await userRepository.insert({
                username: name || email.split("@")[0],
                password: hashedPassword,
                email,
                role: "user",
                active: "active",
            });
            user = { 
                _id: insertResult.insertedId, 
                username: name || email.split("@")[0], 
                email, 
                role: "user", 
                active: "active" 
            };
            isNewUser = true;
        }
        if(user.active === "locked") {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ!");
        }
        return { user, isNewUser, tempPassword };
    }

    async handleFacebookLogin(code, userRepository) {
        const tokenData = await getFacebookAccessToken(code);
        const accessToken = tokenData.access_token;
        const fbUser = await getFacebookUser(accessToken);
        const { email, name, id: facebookId } = fbUser;
        const userEmail = email || `facebook-${facebookId}@easytalk.com`;
        let user = await userRepository.findByEmail(userEmail);
        let isNewUser = false;
        let tempPassword = null;
        if(!user) {
            tempPassword = generateTempPassword();
            const hashedPassword = await hashPassword(tempPassword);
            await userRepository.insert({
                username: name || userEmail.split("@")[0],
                password: hashedPassword,
                email: userEmail,
                role: "user",
                active: "active",
                facebookId,
            });
            user = await userRepository.findByEmail(userEmail);
            isNewUser = true;
        }
        if(user.active === "locked") {
            throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ!");
        }
        return { user, isNewUser, tempPassword };
    }
}

module.exports = SocialAuthService;