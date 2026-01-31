const API = {
    async getCuriosities() {
        const res = await fetch('/api/curiosities');
        return res.json();
    },

    async getComments(id) {
        const res = await fetch(`/api/comments/${id}`);
        return res.json();
    },

    async postComment(id, author, text) {
        const res = await fetch(`/api/comments/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, text })
        });
        return res.json();
    },

    async getWeather(lat, lon) {
        // Using a public API like Open-Meteo which doesn't require a key for simple use
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        return res.json();
    }
};
