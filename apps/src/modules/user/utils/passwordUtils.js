const bcrypt = require("bcrypt");

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

function generateTempPassword() {
    return Math.random().toString(36).slice(-8);
}

function generateVerificationCode() {
    return Math.floor(10000 + Math.random() * 90000);
}

module.exports = { hashPassword, comparePassword, generateTempPassword, generateVerificationCode };