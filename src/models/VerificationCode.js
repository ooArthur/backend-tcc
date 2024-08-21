const mongoose = require('mongoose');

const VerificationCodeSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        isVerified: { type: Boolean, default: false }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);