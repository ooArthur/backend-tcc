 const { Router } = require("express");

const userRoutes = require("./userRoutes");
const emailVerificationRoutes = require("./emailVerificationRoutes");

const router = Router();
router.use("/user", userRoutes);
router.use("/verify", emailVerificationRoutes);

module.exports = router;