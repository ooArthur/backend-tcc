const mongoose = require('mongoose');
const User = require('./User');

const IdiomSchema = new mongoose.Schema({
    name: { type: String },
    level: { 
        type: String, 
        enum: ['Basico', 'Intermediario', 'Avancado']
    }
});

const CourseSchema = new mongoose.Schema({
    name: { type: String },
    institution: { type: String },
    duration: { type: String },
    conclusionYear: { type: Number }
});

const ExperienceSchema = new mongoose.Schema({
    role: { type: String },
    company: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    salary: { type: String },
    mainActivities: { type: String }
});

const QualificationSchema = new mongoose.Schema({
    description: { type: String }
});

const CandidateProfileSchema = new mongoose.Schema(
    {
        candidateName: { type: String, required: true },
        candidatePhone: { type: String, required: true },
        desiredRole: { type: String, required: true },
        candidateTargetSalary: { type: String },
        desiredState: { type: String, required: true },
        desiredCity: { type: String, required: true },
        candidateCEP: { type: String, required: true },
        candidateAddress: { type: String, required: true },
        candidateComplement: { type: String },
        candidateBirth: { type: Date, required: true },
        candidateGender: { type: String, required: true },
        candidateCivilStatus: { type: String },
        candidateLastJob: { type: String },
        candidateHierarchicalArea: { type: String },
        candidateIdioms: [IdiomSchema],
        candidateCourses: [CourseSchema],
        candidateExperience: [ExperienceSchema],
        candidateQualifications: [QualificationSchema]
    },
    {
        timestamps: true,
    }
);

const Candidate = User.discriminator('Candidate', CandidateProfileSchema);

module.exports = Candidate;