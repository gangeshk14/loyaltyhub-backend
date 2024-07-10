import RewardsRecord from "../models/RewardsRecord.mjs";

export const createRewardRecord = async (req, res) => {
    const { date, loyaltyProgramID, userID, points, rewardType, status, purpose } = req.body;
    try {
        const newRewardsRecord = await RewardsRecord.create({date, loyaltyProgramID, userID, points, rewardType, status, purpose});
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