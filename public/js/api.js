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
    }
};
