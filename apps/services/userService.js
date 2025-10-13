const { UserRepository } = require("./../repositories");

class UsersService {
    constructor() {
        this.userRepository = new UserRepository();
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
}

module.exports = UsersService;