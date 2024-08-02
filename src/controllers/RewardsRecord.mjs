import RewardsRecord from "../models/RewardsRecord.mjs";
import User from "../models/User.mjs";
import LoyaltyProgram from "../models/LoyaltyProgram.mjs";

export const createRewardRecord = async (req, res) => {
    const {
        loyaltyProgramName,
        points,
        purpose
    } = req.body;
    try {
        const loyaltyProgram = await LoyaltyProgram.getLoyaltyProgramByName(loyaltyProgramName);
        if (!loyaltyProgram){
            return res.status(404).json({error: 'LoyaltyProgram not found'});
        }
        const programID = loyaltyProgram.programID;
        const currencyRate = loyaltyProgram.currencyRate;
        const user = req.user;
        const rewardAmount = points * currencyRate;
        const rewardType = loyaltyProgram.currencyName;
        const userID = user.userID;

        const newRewardsRecord = await RewardsRecord.create({
            userID: userID,
            loyaltyProgramId :programID,
            points: points,
            rewardAmount :rewardAmount,
            rewardType :rewardType,
            purpose :purpose
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
    const  userID = req.user.userID;
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

export const updateNotifStatus = async (req, res) => {
    const { recordID } = req.body;
    try {
        await RewardsRecord.updateNotified(recordID, 1);
        res.status(200).json({message: 'Notif updated successfully'});
    } catch (error) {
        console.error('Error updating Notifications:', error);
        res.status(500).json({error: 'Failed to update Notif'});
    }
};
