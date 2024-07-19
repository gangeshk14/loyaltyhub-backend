import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.mjs';
import {verifyToken} from "../controllers/User.mjs";
const verifyRouter = express.Router();

verifyRouter.get('/verifytoken',authMiddleware,verifyToken)

export default verifyRouter;
