import dotenv from 'dotenv'

dotenv.config({ path: ".env.test" })
export default {
    moduleFileExtensions: [
        "mjs",
        "js",
    ],
    testRegex: `test\.mjs$`,
    setupFiles: ["dotenv/config"],
    "transform": {},
    testEnvironment: 'jest-environment-node'
};