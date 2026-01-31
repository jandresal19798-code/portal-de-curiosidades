const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'cosmic-chronicles-secret-888';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Archivos de datos
const CURIOSITIES_FILE = path.join(__dirname, 'data', 'curiosities.json');
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ACTIONS_FILE = path.join(__dirname, 'data', 'actions.json');

// Inicializar archivos si no existen
[COMMENTS_FILE, USERS_FILE, ACTIONS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(file === COMMENTS_FILE ? {} : []));
    }
});

// Helper para leer/escribir datos
const getData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Log Actions
const logAction = (userId, email, action) => {
    const actions = getData(ACTIONS_FILE);
    actions.unshift({
        id: Date.now(),
        userId,
        email,
        action,
        timestamp: new Date().toISOString()
    });
    saveData(ACTIONS_FILE, actions.slice(0, 100)); // Keep last 100
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Rutas API
app.get('/api/curiosities', (req, res) => {
    try {
        const curiosities = getData(CURIOSITIES_FILE);
        res.json(curiosities);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener curiosidades' });
    }
});

app.get('/api/comments/:id', (req, res) => {
    try {
        const comments = getData(COMMENTS_FILE);
        const curiosityId = req.params.id;
        res.json(comments[curiosityId] || []);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener comentarios' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'El mensaje es requerido' });

        if (!process.env.GROQ_API_KEY) {
            // Mock response if no key is configured, to avoid crashing
            return res.json({ response: "¡Hola! Para hablar conmigo, necesito que mi creador configure mi cerebro (GROQ_API_KEY) en el sistema. 🧠⚡" });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres el Dr. Curioso, un científico excéntrico, entusiasta y divertido. Tu pasión es la ciencia, el espacio, la naturaleza y los animales. Respondes preguntas con datos fascinantes, metáforas locas pero precisas, y un toque de humor. Usas emojis científicos (🧪, 🔭, 🧬, 🌌) frecuentemente. Si te preguntan algo fuera de tema, intenta relacionarlo con la ciencia de forma absurda pero inteligente. Tu objetivo es inspirar curiosidad."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 300
        });

        res.json({ response: chatCompletion.choices[0]?.message?.content || "El Dr. Curioso está meditando en una singularidad... intenta de nuevo." });

    } catch (error) {
        console.error("Error en Groq:", error);
        res.status(500).json({ error: 'Error al conectar con el Dr. Curioso' });
    }
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const users = getData(USERS_FILE);

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            email,
            password: hashedPassword,
            name,
            role: email === 'admin@cosmic.com' ? 'admin' : 'user',
            verified: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveData(USERS_FILE, users);

        logAction(newUser.id, email, 'Registro de usuario');

        // Simulación de envío de mail (En producción usar Transporter real)
        console.log(`[MAIL] Verificación enviada a ${email}: Token ${newUser.id}`);

        // DEV: Devolvemos el token para facilitar pruebas
        res.status(201).json({
            message: 'Registrado con éxito. Revisa la consola o usa este token para verificar.',
            token: newUser.id
        });
    } catch (e) {
        res.status(500).json({ error: 'Error en el registro' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getData(USERS_FILE);
        const user = users.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        logAction(user.id, email, 'Inicio de sesión');

        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        res.status(500).json({ error: 'Error en el login' });
    }
});

app.post('/api/auth/verify', (req, res) => {
    const { email, token } = req.body;
    const users = getData(USERS_FILE);
    const user = users.find(u => u.email === email && u.id.toString() === token);

    if (user) {
        user.verified = true;
        saveData(USERS_FILE, users);
        logAction(user.id, email, 'Email verificado');
        res.json({ message: 'Email verificado correctamente' });
    } else {
        res.status(400).json({ error: 'Token inválido' });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    const users = getData(USERS_FILE).map(({ password, ...u }) => u);
    const actions = getData(ACTIONS_FILE);
    const curiosities = getData(CURIOSITIES_FILE);
    const comments = getData(COMMENTS_FILE);

    const totalComments = Object.values(comments).reduce((acc, arr) => acc + arr.length, 0);

    res.json({ users, actions, curiosities, stats: { totalUsers: users.length, totalCuriosities: curiosities.length, totalComments } });
});

// --- ADMIN CRUD CURIOSITIES ---

app.post('/api/admin/curiosities', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    try {
        const curiosities = getData(CURIOSITIES_FILE);
        const newCuriosity = {
            id: Date.now(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        curiosities.push(newCuriosity);
        saveData(CURIOSITIES_FILE, curiosities);
        logAction(req.user.id, req.user.email, `Creó curiosidad: ${newCuriosity.title}`);

        res.status(201).json(newCuriosity);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear curiosidad' });
    }
});

app.put('/api/admin/curiosities/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    try {
        const curiosities = getData(CURIOSITIES_FILE);
        const idx = curiosities.findIndex(c => c.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ error: 'Curiosidad no encontrada' });

        curiosities[idx] = { ...curiosities[idx], ...req.body, updatedAt: new Date().toISOString() };
        saveData(CURIOSITIES_FILE, curiosities);
        logAction(req.user.id, req.user.email, `Actualizó curiosidad: ${curiosities[idx].title}`);

        res.json(curiosities[idx]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar curiosidad' });
    }
});

app.delete('/api/admin/curiosities/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    try {
        let curiosities = getData(CURIOSITIES_FILE);
        const curiosity = curiosities.find(c => c.id === parseInt(req.params.id));
        if (!curiosity) return res.status(404).json({ error: 'Curiosidad no encontrada' });

        curiosities = curiosities.filter(c => c.id !== parseInt(req.params.id));
        saveData(CURIOSITIES_FILE, curiosities);
        logAction(req.user.id, req.user.email, `Eliminó curiosidad: ${curiosity.title}`);

        res.json({ message: 'Curiosidad eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar curiosidad' });
    }
});

// --- ADMIN USERS MANAGEMENT ---

app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    try {
        let users = getData(USERS_FILE);
        const userId = parseInt(req.params.id);

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
        }

        const user = users.find(u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        users = users.filter(u => u.id !== userId);
        saveData(USERS_FILE, users);
        logAction(req.user.id, req.user.email, `Eliminó usuario: ${user.email}`);

        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

app.put('/api/admin/users/:id/role', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    try {
        const users = getData(USERS_FILE);
        const userId = parseInt(req.params.id);
        const user = users.find(u => u.id === userId);

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        user.role = req.body.role;
        saveData(USERS_FILE, users);
        logAction(req.user.id, req.user.email, `Cambió rol de ${user.email} a ${user.role}`);

        res.json({ message: 'Rol actualizado', user: { ...user, password: undefined } });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar rol' });
    }
});

// Rutas API originales protegidas
app.post('/api/comments/:id', authenticateToken, (req, res) => {
    try {
        const { text } = req.body;
        const curiosityId = req.params.id;

        if (!text) return res.status(400).json({ error: 'El comentario es requerido' });

        const comments = getData(COMMENTS_FILE);
        if (!comments[curiosityId]) comments[curiosityId] = [];

        const newComment = {
            id: Date.now(),
            author: req.user.email,
            text,
            date: new Date().toISOString()
        };

        comments[curiosityId].push(newComment);
        saveData(COMMENTS_FILE, comments);
        logAction(req.user.id, req.user.email, `Comentó en curiosidad ${curiosityId}`);

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el comentario' });
    }
});

// For Render deployment, always serve index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
