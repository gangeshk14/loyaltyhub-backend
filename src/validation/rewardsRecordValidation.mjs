const {body} = require("express-validator")

const rewardsRecordValidationRules = () => {
    return [
        body("userID")
            .notEmpty()
            .isUUID()
            .withMessage("Invalid user ID"),

        body("loyaltyProgramID")
            .notEmpty()
            .isUUID()
            .withMessage("Invalid loyaltyProgramID"),

        body("date")
            .notEmpty()
            .isISO8601()
            .withMessage("Invalid date format"),

        body("points")
            .notEmpty()
            .isInt({min: 0})
            .withMessage("Invalid points input format"),

        body("rewardType")
            .notEmpty()
            .isString()
            .withMessage("Invalid rewardType format"),

        body("rewardAmount")
            .notEmpty()
            .isInt({min: 0})
            .withMessage("Invalid rewardAmount format"),

        body("status")
            .isIn(['SUBMITTED','PROCESSING','SUCCESSFUL','REJECTED'])
            .withMessage("Invalid status choice"),

        body("purpose")
            .optional()
            .isString()
            .withMessage("Invalid purpose format")
    ];
};

module.exports = {
    rewardsRecordValidationRules
};


