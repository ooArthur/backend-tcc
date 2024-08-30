exports.authorizeUser = (req, res, next) => {
    try {
        // Verifica se o usuário está autenticado
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Obtém o ID do usuário da URL, do corpo da requisição ou da query string
        const userId = req.params.id || req.body.userId || req.query.userId;

        // Verifica se o ID do usuário foi fornecido na requisição
        if (!userId) {
            return res.status(400).json({ message: 'ID do usuário não fornecido.' });
        }

        // Log de depuração (opcional)
        console.log("ID da requisição:", userId);
        console.log("ID do usuário autenticado:", req.user.id);

        // Verifica se o usuário tem permissão para acessar o perfil (mesmo ID ou administrador)
        if (req.user.id.toString() === userId.toString() || req.user.role === 'admin') {
            return next(); // Permite a continuação da requisição
        }

        // Se o usuário não tiver permissão, retorna um erro de acesso proibido
        return res.status(403).json({ message: 'Você não tem permissão para acessar este perfil.' });
    } catch (error) {
        console.error('Erro no middleware de autorização:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};