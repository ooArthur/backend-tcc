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
        refreshToken: { // Novo campo para armazenar o token de atualização
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        discriminatorKey: 'role' // Define o campo de discriminação para diferenciar os tipos de usuário
    }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;