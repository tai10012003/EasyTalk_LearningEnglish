module.exports = {
    mongodb: {
        username: process.env.MONGODB_USERNAME,
        password: process.env.MONGODB_PASSWORD,
        database: process.env.MONGODB_DATABASE
    },
    jwt: {
        secret: process.env.JWT_SECRET
    },
    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};