const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['vacancy', 'company', 'candidate'],
            required: true
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'type'
        },
        description: {
            type: String,
            required: true
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Report', reportSchema);