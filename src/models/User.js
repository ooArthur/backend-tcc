const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            required: true,
            enum: ['admin', 'company', 'candidate'],
            default: 'candidate'
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        discriminatorKey: 'role'
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;