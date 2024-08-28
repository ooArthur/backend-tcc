const mongoose = require('mongoose');

const JobVacancySchema = mongoose.Schema(
    {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
        jobTitle: { type: String, required: true },
        jobDescription: { type: String, required: true },
        salary: { type: String },
        jobLocation: {
            city: { type: String, required: true },
            state: { type: String, required: true },
        },
        workSchedule: {
            workingHours: { type: String },
            workingDays: {
                type: [String],
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            }
        },
        requiredQualifications: [{ type: String }],
        desiredSkills: [{ type: String }],
        employmentType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Temporary'],
            required: true
        },
        applicationDeadline: { type: Date },
        interestedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }] // Adicionando a lista de candidatos interessados
    },
    {
        timestamps: true,
    }
);

const JobVacancy = mongoose.model('JobVacancy', JobVacancySchema);

module.exports = JobVacancy;
