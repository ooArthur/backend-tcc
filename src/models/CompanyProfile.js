const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

const employerCompanySchema = new Schema({
    cnpj: { type: String, required: true },
    socialReason: { type: String, required: true },
    fantasyName: { type: String, required: true },
});

const crhCompanySchema = new Schema({
    cnpj: { type: String, required: true },
    socialReason: { type: String, required: true },
    fantasyName: { type: String, required: true },
});

const liberalProfessionalSchema = new Schema({
    registrationDocument: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    cpf: { type: String, required: true }
});

const CompanyProfileSchema = new Schema(
    {
        companyName: { type: String, required: true },
        positionInTheCompany: { type: String, required: true },
        branchOfActivity: { type: String, required: true },
        telephone: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: ['Empresa Empregadora', 'Empresa de CRH', 'Profissional Liberal']
        },
        address: {
            cep: { type: String, required: true },
            publicPlace: { type: String, required: true },
            number: { type: String, required: true },
            complement: { type: String },
            city: { type: String, required: true },
            state: { type: String, required: true }
        },
        description: { type: String },
        employeerNumber: { type: Number },
        employerCompanyData: employerCompanySchema,
        crhCompanyData: crhCompanySchema,
        liberalProfessionalData: liberalProfessionalSchema,
        site: { type: String },
        warnings: { type: Number, default: 0 }, // Contador de avisos
        banned: { type: Boolean, default: false }, // Status de banimento
    },
    {
        timestamps: true
    }
);

CompanyProfileSchema.pre('save', function (next) {
    if (this.type === 'Empresa Empregadora' && !this.employerCompanyData) {
        return next(new Error('Dados de empresa empregadora são obrigatórios.'));
    } else if (this.type === 'Empresa de CRH' && !this.crhCompanyData) {
        return next(new Error('Dados de empresa de CRH são obrigatórios.'));
    } else if (this.type === 'Profissional Liberal' && !this.liberalProfessionalData) {
        return next(new Error('Dados de profissional liberal são obrigatórios.'));
    } else {
        next();
    }
});

const Company = User.discriminator('Company', CompanyProfileSchema);

module.exports = Company;