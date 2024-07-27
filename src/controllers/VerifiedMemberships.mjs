import verifiedMemberships from "../models/VerifiedMemberships.mjs";
import User from "../models/User.mjs";
import dbPool from "../config/database.mjs";
import loyaltyProgram from "../models/LoyaltyProgram.mjs";
import LoyaltyProgram from "../models/LoyaltyProgram.mjs";

export const addVerifiedMembership = async (req, res) => {
    const {
        loyaltyProgramName,
        membershipID
    } = req.body;
    try {
        const userID = req.user.userID;
        const loyaltyProgram = await LoyaltyProgram.getLoyaltyProgramByName(loyaltyProgramName);
        if (!(loyaltyProgram)) {
            throw new Error('LoyaltyProgram not found');
        }
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const [existingMembership] = await dbPool.query('SELECT * FROM VerifiedLoyaltyID WHERE membershipID = ?', [membershipID]);
        if (existingMembership.length > 0) {
            return res.status(200).json({
                message: "Membership already verified",
                data: existingMembership
            })
        }

        const membership = await verifiedMemberships.create({userID:user.userID, loyaltyProgramID:loyaltyProgram.programID, membershipID: membershipID, firstName: user.firstName, lastName: user.lastName});
        res.status(201).json(membership);
    } catch (error) {
        console.error('Error adding verified membership:', error);
        res.status(500).json({error: 'Failed to add verified membership'});
    }
};

export const getVerifiedMembershipByUser = async (req, res) => {
    const {userID}  = req.params;
    try {
        const user = await User.findById(userID);
        const membership = await verifiedMemberships.findByUserID(userID);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        const mappedMemberships = membership.map(membership => ({
            userID: membership.userID,
            loyaltyProgramID: membership.loyaltyProgramID,
            membershipID: membership.membershipID,
            date: membership.date,
            firstName: membership.firstName,
            lastName: membership.lastName,
            loyaltyProgramName: membership.loyaltyProgramName,
            loyaltyProgramImage: membership.loyaltyProgramImage.toString('base64'),
        }))
        res.status(200).json(mappedMemberships || []);
    } catch (err) {
        console.error('Error fetching verified memberships by user ID:', err);
        res.status(500).json({error: 'Failed to fetch verified memberships'});
    }
}

export const getVerifiedMembershipByMembershipID = async (req, res) => {
    const { loyaltyProgramID, userID } = req.body;
    try {
        const user = await User.findById(userID);
        const program = await loyaltyProgram.getLoyaltyProgramById(loyaltyProgramID)
        const membership = await verifiedMemberships.findByMembershipID(loyaltyProgramID, userID);
        if (!user) {
            return res.status(404).json({error: 'User not found'})
        }
        if (!program) {
            return res.status(404).json({error: 'Program not found'})
        }
        if (!membership) {
            return res.status(404).json({error: 'Record not found'});
        }
    } catch (err) {
        console.error('Error fetching verified membership by LP and User ID:', err);
        res.status(500).json({error: 'Failed to fetch verified memberships'})
    }
}
