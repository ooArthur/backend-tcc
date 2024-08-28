 const { Router } = require("express");

const userRoutes = require("./userRoutes");
const emailVerificationRoutes = require("./emailVerificationRoutes");
const authRoutes = require('./authRoutes');

const router = Router();
router.use("/user", userRoutes);
router.use("/verify", emailVerificationRoutes);
router.use("/auth", authRoutes);

module.exports = router;