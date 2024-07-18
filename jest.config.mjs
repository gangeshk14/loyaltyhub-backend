import dotenv from 'dotenv'

dotenv.config({ path: ".env.test" })
export default {
    moduleFileExtensions: [
        "mjs",
        // must include "js" to pass validation https://github.com/facebook/jest/issues/12116
        "js",
    ],
    testRegex: `test\.mjs$`,
    setupFiles: ["dotenv/config"],
    "transform": {},
    testEnvironment: 'jest-environment-node'
};