import express from "express";
import { authorizeSubscribers, isAuthenticated } from "../middlewares/isAuthenticated.js";
import { buySubscription, cancelSubscription, getRazorPayKey, paymentVerification } from "../controllers/paymentController.js";

const router = express.Router();

//buy subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);

//payment verification
router.route("/paymentverification").post(isAuthenticated, paymentVerification);

//get api key
router.route("/razorpaykey").get(getRazorPayKey);

//cancel subscription
router.route("subscribe/cancel").delete(isAuthenticated, authorizeSubscribers ,cancelSubscription);

export default router;

