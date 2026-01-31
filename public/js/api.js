const API = {
    async getCuriosities() {
        const res = await fetch('/api/curiosities');
        return res.json();
    },

    async getComments(id) {
        const res = await fetch(`/api/comments/${id}`);
        return res.json();
    },

    async postComment(id, text) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/comments/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });
        return res.json();
    },

    async getWeather(lat, lon) {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        return res.json();
    },

    async getAdminDashboard() {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    async addCuriosity(curiosity) {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/curiosities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(curiosity)
        });
        return res.json();
    },

    async updateCuriosity(id, curiosity) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/curiosities/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(curiosity)
        });
        return res.json();
    },

    async deleteCuriosity(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/curiosities/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    async deleteUser(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }
};
