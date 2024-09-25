const cohere = require('cohere-ai'); // Importando diretamente
const logger = require('../config/logger');

// Função para obter recomendações de vagas usando Cohere
async function getJobRecommendations(candidate) {
    const prompt = `
        Dada as seguintes informações de um candidato:
        Nome: ${candidate.candidateName}
        Cargo Desejado: ${candidate.desiredRole}
        Salário Alvo: ${candidate.candidateTargetSalary || 'Não especificado'}
        Cidade Desejada: ${candidate.desiredCity}
        Estado Desejado: ${candidate.desiredState}
        Experiência: ${candidate.candidateExperience.map(exp => exp.role).join(', ')}
        Área de Interesse: ${candidate.areaOfInterest || 'Não especificado'}

        Recomende 5 vagas que se encaixem nesse perfil, incluindo o título do trabalho, descrição e requisitos.
    `;

    try {
        const response = await cohere.generate({
            model: 'command-xlarge-nightly',  // Modelo mais avançado da Cohere
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.7,
            apiKey: process.env.COHERE_API_KEY  // Passe a chave API aqui
        });

        return response.body.generations[0].text.trim();
    } catch (error) {
        logger.error(`Erro ao buscar recomendações da Cohere: ${error.message}`);
        throw new Error('Erro ao buscar recomendações da Cohere');
    }
}

module.exports = { getJobRecommendations };