const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Archivos de datos
const CURIOSITIES_FILE = path.join(__dirname, 'data', 'curiosities.json');
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');

// Inicializar archivo de comentarios si no existe
if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify({}));
}

// Helper para leer/escribir datos
const getData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

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

app.post('/api/comments/:id', (req, res) => {
    try {
        const { author, text } = req.body;
        const curiosityId = req.params.id;

        if (!author || !text) {
            return res.status(400).json({ error: 'Autor y comentario son requeridos' });
        }

        const comments = getData(COMMENTS_FILE);
        if (!comments[curiosityId]) {
            comments[curiosityId] = [];
        }

        const newComment = {
            id: Date.now(),
            author,
            text,
            date: new Date().toISOString()
        };

        comments[curiosityId].push(newComment);
        saveData(COMMENTS_FILE, comments);

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
