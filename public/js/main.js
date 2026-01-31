document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('curiosity-grid');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');
    const filters = document.querySelectorAll('.filter-btn');

    let curiosities = [];

    // Load Curiosities
    async function loadCuriosities() {
        try {
            curiosities = await API.getCuriosities();
            renderGrid(curiosities);
        } catch (error) {
            grid.innerHTML = '<p class="error">Error al cargar curiosidades. Inténtalo de nuevo más tarde.</p>';
        }
    }

    function renderGrid(items) {
        grid.innerHTML = items.map(item => `
            <div class="card" onclick="openDetail(${item.id})">
                <img src="${item.image}" alt="${item.title}" class="card-image">
                <span class="card-category">${item.category}</span>
                <h3>${item.title}</h3>
                <div class="card-footer">
                    <span>${item.likes} ❤️</span>
                    <span>Ver más &rarr;</span>
                </div>
            </div>
        `).join('');
    }

    // Filter Logic
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.dataset.category;
            const filtered = cat === 'all' ? curiosities : curiosities.filter(c => c.category === cat);
            renderGrid(filtered);
        });
    });

    // Open Modal
    window.openDetail = async (id) => {
        const item = curiosities.find(c => c.id === id);
        if (!item) return;

        modalBody.innerHTML = `
            <img src="${item.image}" alt="${item.title}" style="width:100%; border-radius:1rem; margin-bottom:2rem; height:300px; object-fit:cover;">
            <span class="card-category">${item.category}</span>
            <h2>${item.title}</h2>
            <p class="full-fact">${item.fact}</p>
            
            <div class="comments-section">
                <h3>Comentarios</h3>
                <form id="comment-form" class="comment-form">
                    <input type="text" id="author" placeholder="Tu nombre" required>
                    <textarea id="text" placeholder="Escribe tu pensamiento..." required></textarea>
                    <button type="submit" class="btn-primary">Publicar Comentario</button>
                </form>
                <div id="comment-list" class="comment-list">
                    Cargando comentarios...
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Load Comments
        loadComments(id);

        // Handle Comment Submission
        const form = document.getElementById('comment-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const author = document.getElementById('author').value;
            const text = document.getElementById('text').value;

            try {
                await API.postComment(id, author, text);
                form.reset();
                loadComments(id);
            } catch (error) {
                alert('Error al publicar comentario');
            }
        };
    };

    async function loadComments(id) {
        const commentList = document.getElementById('comment-list');
        try {
            const comments = await API.getComments(id);
            if (comments.length === 0) {
                commentList.innerHTML = '<p style="color: var(--text-dim)">No hay comentarios todavía. ¡Sé el primero!</p>';
                return;
            }
            commentList.innerHTML = comments.map(c => `
                <div class="comment">
                    <div>
                        <span class="comment-author">${c.author}</span>
                        <span class="comment-date">${new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <p>${c.text}</p>
                </div>
            `).reverse().join('');
        } catch (error) {
            commentList.innerHTML = 'Error al cargar comentarios.';
        }
    }

    // Close Modal
    closeModal.onclick = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    window.onclick = (e) => {
        if (e.target === modal) closeModal.onclick();
    };

    loadCuriosities();
});
