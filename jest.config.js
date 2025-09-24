// jest.config.js (global for all Lambdas)
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/aws-backend/src/**/*.js",
    "!<rootDir>/aws-backend/src/**/__tests__/**"
  ],
  coverageDirectory: "<rootDir>/coverage",
  testEnvironment: "node"
};
