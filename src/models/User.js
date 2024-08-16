const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            required: true,
            enum: ['admin', 'company', 'candidate'],
            default: 'candidate'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Users", userSchema);