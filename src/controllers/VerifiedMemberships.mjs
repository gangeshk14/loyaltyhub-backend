import verifiedMemberships from "../models/VerifiedMemberships.mjs";
import User from "../models/User.mjs";
import dbPool from "../config/database.mjs";

export const addVerifiedMembership = async (req, res) => {
    const {
        loyaltyProgramID, //also requires update
        membershipID
    } = req.body;
    try {
        const user = req.user;
        const userID = user.userID;
        const date = new Date();
        const firstName = user.firstName;
        const lastName = user.lastName;

        const [existingMembership] = await dbPool.query('SELECT * FROM VerifiedLoyaltyID WHERE membershipID = ?', [membershipID]);
        if (existingMembership.length > 0) {
            return res.status(200).json({
                message: "Membership already verified",
                data: existingMembership
            })
        }

        const membership = await verifiedMemberships.create({userID, loyaltyProgramID, membershipID, date, firstName, lastName});
        res.status(201).json(membership);
    } catch (error) {
        console.error('Error adding verified membership:', error);
        res.status(500).json({error: 'Failed to add verified membership'});
    }
};

export const getVerifiedMembershipByUser = async (req, res) => {
    const { userID } = req.params;
    try {
        const user = await User.findById(userID);
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

export const getVerifiedMembershipByMembershipID = async (req, res) => {
    const { membershipID } = req.params;
    try {
        const membership = await verifiedMemberships.findByMembershipID(membershipID);
        if (!membership) {
            return res.status(404).json({error: 'Record not found'});
        }
    } catch (err) {
        console.error('Error fetching verified membership by ID:', err);
        res.status(500).json({error: 'Failed to fetch verified memberships'})
    }
}