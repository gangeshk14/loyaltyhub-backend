import express from 'express';
import {
    addVerifiedMembership,
    getVerifiedMembershipByMembershipID,
    getVerifiedMembershipByUser
} from '../controllers/VerifiedMemberships.mjs'
import {authMiddleware} from "../middleware/auth.mjs";

const verifiedMembershipsRouter = express.Router();

verifiedMembershipsRouter.post('/verifiedmemberships/add', authMiddleware, addVerifiedMembership);
verifiedMembershipsRouter.get('/verifiedmemberships/membership/:membershipID', authMiddleware, getVerifiedMembershipByMembershipID);
verifiedMembershipsRouter.get('/verifiedmemberships/user/:userID', authMiddleware, getVerifiedMembershipByUser)

export default verifiedMembershipsRouter;

