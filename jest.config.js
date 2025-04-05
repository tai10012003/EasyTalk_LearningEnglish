module.exports = {
    transform: {'^.+\\.m?js$': 'babel-jest',}, 
    testEnvironment: 'node',
    setupFiles: ['./Test/jest.setup.js'],
};