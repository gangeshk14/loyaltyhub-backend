import RewardsRecord from "../models/RewardsRecord.mjs";
import User from "../models/User.mjs";

export const createRewardRecord = async (req, res) => {
    const {
        loyaltyProgramID, // remove after model update
        points,
        status,
        purpose
    } = req.body;
    try {
        const user = req.user;
        const rewardAmount = points; //this will have to be updated with currencyRate from loyalty programs model
        // also require getting loyalty program id from model
        const rewardType = user.membershipType;
        const userID = user.userID;
        const date = new Date();
        const newRewardsRecord = await RewardsRecord.create({
            date,
            loyaltyProgramID,
            userID,
            points,
            rewardType,
            rewardAmount,
            status,
            purpose
        });
        res.status(201).json(newRewardsRecord);
    } catch (error) {
        console.error('Error creating rewards record:', error);
        res.status(500).json({error: 'Failed to create rewards record'});
    }
};

export const getRewardRecordById = async (req, res) => {
    const { recordID } = req.params;
    try {
        const record = await RewardsRecord.findById(recordID);
        if (!record) {
            return res.status(404).json({error: 'Record not found'});
        }
        res.status(200).json(record);
    } catch (error) {
        console.error('Error fetching rewards record by ID:', error);
        res.status(500).json({error: 'Failed to fetch rewards record'});
    }
};

export const getRewardRecordByUserID = async (req, res) => {
    const { userID } = req.params;
    try {
        const record = await RewardsRecord.findByUserID(userID);
        const user = await User.findById(userID);
        if (!record) {
            return res.status(404).json({error: 'Record not found'});
        }
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        res.status(200).json(record);
    } catch (error) {
        console.error('Error fetching rewards record by user ID:', error);
        res.status(500).json({error: 'Failed to fetch rewards record'});
    }
}

export const updateRewardsRecordStatus = async (req, res) => {
    const { recordID } = req.params;
    const { status } = req.body;
    try {
        await RewardsRecord.updateStatus(recordID, status);
        res.status(200).json({message: 'Status updated successfully'});
    } catch (error) {
        console.error('Error updating Rewards record:', error);
        res.status(500).json({error: 'Failed to update status'});
    }
};