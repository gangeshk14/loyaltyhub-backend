import verifiedMemberships from "../models/verifiedMemberships.mjs";
import User from "../models/User.mjs";

export const addVerifiedMembership = async (req, res) => {
    const { userID, loyaltyProgramID, membershipID, date } = req.body;
    try {
        const membership = await verifiedMemberships.create({userID, loyaltyProgramID, membershipID, date});
        res.status(201).json(membership);
    } catch (error) {
        console.error('Error adding verified membership:', error);
        res.status(500).json({error: 'Failed to add verified membership'});
    }
};

export const getVerifiedMembershipByUser = async (req, res) => {
    const { userID } = req.params;
    const user = await User.findById(userID);
    try {
        const membership = await verifiedMemberships.findByUserID(userID);
        if (!membership) {
            return res.status(404).json({error: 'Record not found'});
        }
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        res.status(200).json(membership);
    } catch (err) {
        console.error('Error fetching verified memberships by user ID:', err);
        res.status(500).json({error: 'Failed to fetch verified memberships'});
    }
}