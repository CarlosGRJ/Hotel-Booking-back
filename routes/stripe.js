import express from 'express';

const router = express.Router();

// middleware
import { requireSignin } from '../middlewares';

// controllers
import {
   createConnectAccount,
   getAccountBalance,
   getAccountStatus,
   payoutSetting,
} from '../controllers/stripe';

router.post('/create-connect-account', requireSignin, createConnectAccount);
router.post('/get-account-status', requireSignin, getAccountStatus);
router.post('/get-account-balance', requireSignin, getAccountBalance);
router.post('/payout-setting', requireSignin, payoutSetting);

module.exports = router;
