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
        reportReason: {
            type: String,
            enum: [
                'Conteúdo Inadequado',
                'Discriminação ou Assédio',
                'Informações Falsas',
                'Spam ou Golpe',
                'Atividade Suspeita',
                'Linguagem Ofensiva',
                'Violação de Privacidade',
                'Violência ou Ameaça',
                'Falsificação de Identidade',
                'Fraude ou Informações Enganosas',
                'Comportamento Desrespeitoso',
                'Vaga Enganosa',
                'Conteúdo Ilegal',
                'Outro'    
            ],
            required: true
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