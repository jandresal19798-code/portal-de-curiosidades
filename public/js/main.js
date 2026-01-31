// Global Helpers (defined outside to be available immediately)
window.toggleModal = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    if (m.classList.contains('hidden')) {
        m.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        history.pushState({ modalId: id }, "");
    } else {
        window.closeSpecificModal(id);
    }
};

window.closeSpecificModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
        m.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
};

window.closeModal = () => {
    const modal = document.getElementById('modal');
    if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        if (history.state && history.state.modalId === 'modal') history.back();
    }
};

window.toggleTheme = () => {
    const body = document.body;
    const checkbox = document.getElementById('theme-checkbox');
    const isLight = body.classList.toggle('light-mode');
    if (checkbox) checkbox.checked = !isLight; // Checked means dark in our CSS logic usually, let's ensure consistency
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
};

window.updateProgress = () => {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = ((winScroll / height) * 100) + "%";
};

window.randomCuriosity = () => {
    if (window.allCuriosities && window.allCuriosities.length > 0) {
        const random = window.allCuriosities[Math.floor(Math.random() * window.allCuriosities.length)];
        window.openDetail(random.id);
    }
};

window.toggleBot = () => {
    const chat = document.getElementById('bot-chat');
    const container = document.getElementById('bot-messages');
    if (!chat || !container) return;
    chat.classList.toggle('hidden');
    if (!chat.classList.contains('hidden') && container.innerHTML === "") {
        container.innerHTML = `
            <div class="msg-bot flex items-start gap-3">
                <img src="images/dr_curioso_avatar.png" class="w-10 h-10 rounded-full border border-cyan-400" alt="Dr. Curioso">
                <div class="flex-1">
                    <b>Dr. Curioso 🧪:</b> ¡Eureka! ¡Soy el Dr. Curioso! Prepárate para descubrir lo increíble. ¿De qué quieres hablar hoy? ✨
                </div>
            </div>`;
    }
};

window.botMessage = async (e) => {
    if (e.key === 'Enter') {
        const input = e.target;
        const msg = input.value.trim();
        if (!msg) return;

        const container = document.getElementById('bot-messages');

        // Add user message
        container.innerHTML += `<div class="msg-user"><b>Tú:</b> ${msg}</div>`;
        input.value = '';
        container.scrollTop = container.scrollHeight;

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        container.innerHTML += `<div id="${loadingId}" class="msg-bot text-gray-500 italic">Dr. Curioso está pensando... �</div>`;
        container.scrollTop = container.scrollHeight;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });

            const data = await res.json();

            // Remove loading and add response
            document.getElementById(loadingId).remove();

            if (data.error) {
                container.innerHTML += `<div class="msg-bot text-red-400"><b>Error:</b> ${data.error}</div>`;
            } else {
                container.innerHTML += `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ${data.response}</div>`;
            }
        } catch (error) {
            document.getElementById(loadingId).remove();
            container.innerHTML += `<div class="msg-bot text-red-400"><b>Error:</b> No pude conectar con el laboratorio.</div>`;
        }

        container.scrollTop = container.scrollHeight;
    }
};

// --- CORE APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('curiosity-grid');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const filters = document.querySelectorAll('.filter-btn');

    let curiosities = [];
    window.allCuriosities = [];
    let currentPage = 1;
    const itemsPerPage = 12;

    if (localStorage.getItem('theme') === 'light') window.toggleTheme();
    window.onscroll = () => window.updateProgress();

    // Update Date
    const updateDate = () => {
        const el = document.getElementById('nav-date');
        if (!el) return;
        const now = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        let dateStr = now.toLocaleDateString('es-ES', options);
        el.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    };
    updateDate();

    function getPlaceholderSVG(category, bgColor, width, height, fontSize) {
        const encodedColor = encodeURIComponent(bgColor);
        return `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22${width}%22 height=%22${height}%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:${encodedColor};stop-opacity:0.3%22/%3E%3Cstop offset=%22100%25%22 style=%22stop-color:${encodedColor};stop-opacity:0.6%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22${width}%22 height=%22${height}%22 fill=%22url(%23grad)%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-family=%22Arial%22 font-size=%22${fontSize}%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 opacity=%220.8%22%3E${encodeURIComponent(category)}%3C/text%3E%3C/svg%3E`;
    }

    function renderGrid(items, append = false) {
        if (!append) grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">No se encontraron curiosidades.</p>';
            return;
        }
        const pageItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        const html = pageItems.map(item => {
            const colors = { 'Ciencia': 'text-cyan-400', 'Espacio': 'text-purple-400', 'Animales': 'text-green-400', 'Naturaleza': 'text-orange-400', 'Cuerpo Humano': 'text-red-400' };
            const bgColors = { 'Ciencia': '#0891b2', 'Espacio': '#a855f7', 'Animales': '#22c55e', 'Naturaleza': '#f97316', 'Cuerpo Humano': '#ef4444' };
            const accent = colors[item.category] || 'text-cyan-400';
            const bgColor = bgColors[item.category] || '#0891b2';

            // Generar placeholder SVG seguro
            const placeholderSVG = getPlaceholderSVG(item.category, bgColor, 600, 400, 24);
            // Support multiple images
            const mainImage = (item.images && item.images.length > 0) ? item.images[0] : (item.image || placeholderSVG);

            return `
                <div class="card-holo h-full flex flex-col animate-in group">
                    <div class="h-56 overflow-hidden relative" style="background: linear-gradient(135deg, ${bgColor}15, ${bgColor}30);">
                        <img src="${mainImage}" 
                             alt="${item.title}"
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                             onerror="this.onerror=null; this.src='${placeholderSVG}';"
                             loading="lazy">
                        ${(item.images && item.images.length > 1) ?
                    `<div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                                <span>📷</span> ${item.images.length}
                             </div>` : ''}
                    </div>
                    <div class="p-6 flex-grow">
                        <span class="${accent} text-[10px] font-bold uppercase tracking-widest mb-2 block">${item.category}</span>
                        <h3 class="text-xl font-bold mb-3">${item.title}</h3>
                        <p class="text-gray-400 text-sm line-clamp-3">${item.fact}</p>
                    </div>
                    <div class="p-6 pt-0 mt-auto">
                        <button onclick="window.openDetail(${item.id})" class="text-white text-sm font-bold flex items-center gap-2 hover:gap-4 transition-all group">Leer más <span class="text-cyan-400">→</span></button>
                    </div>
                </div>`;
        }).join('');

        if (append) grid.insertAdjacentHTML('beforeend', html);
        else grid.innerHTML = html;
        updateLoadMore(items.length);
    }

    function updateLoadMore(total) {
        let btn = document.getElementById('load-more');
        if (currentPage * itemsPerPage < total) {
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'load-more';
                btn.className = 'col-span-full mt-12 py-4 px-10 rounded-full border border-white/10 hover:bg-white/5 font-bold transition-all';
                btn.innerText = 'Cargar más';
                btn.onclick = () => { currentPage++; renderGrid(curiosities.filter(c => document.querySelector('.filter-btn.active').dataset.category === 'all' || c.category === document.querySelector('.filter-btn.active').dataset.category), true); };
                grid.after(btn);
            }
        } else if (btn) btn.remove();
    }

    // Modal Gallery State
    let currentSlide = 0;

    window.changeSlide = (step, total) => {
        currentSlide = (currentSlide + step + total) % total;
        document.getElementById('gallery-track').style.transform = `translateX(-${currentSlide * 100}%)`;
        document.getElementById('slide-counter').innerText = `${currentSlide + 1} / ${total}`;
    };

    window.openDetail = async (id) => {
        const item = window.allCuriosities.find(c => c.id === id);
        if (!item) return;

        const wordCount = item.fact.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        const bgColors = { 'Ciencia': '#0891b2', 'Espacio': '#a855f7', 'Animales': '#22c55e', 'Naturaleza': '#f97316', 'Cuerpo Humano': '#ef4444' };
        const bgColor = bgColors[item.category] || '#0891b2';

        const placeholderSVG = getPlaceholderSVG(item.category, bgColor, 800, 600, 48);

        // Prepare Images
        const images = (item.images && item.images.length > 0) ? item.images : [item.image || placeholderSVG];
        currentSlide = 0;

        // Generate Gallery HTML
        let galleryHTML = '';
        if (images.length > 1) {
            galleryHTML = `
                <div class="h-[450px] w-[calc(100%+6rem)] -ml-12 -mt-12 mb-10 relative group/hero overflow-hidden">
                    <div id="gallery-track" class="flex w-full h-full transition-transform duration-500 ease-out">
                        ${images.map(img => `
                            <div class="w-full h-full flex-shrink-0 relative bg-black/50">
                                <img src="${img}" 
                                     alt="${item.title}" 
                                     class="w-full h-full object-cover"
                                     onerror="this.onerror=null; this.src='${placeholderSVG}';">
                                <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent"></div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Controls -->
                    <button onclick="changeSlide(-1, ${images.length})" class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur transition-all">←</button>
                    <button onclick="changeSlide(1, ${images.length})" class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur transition-all">→</button>
                    
                    <div class="absolute bottom-8 right-12 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                        <span id="slide-counter">1 / ${images.length}</span>
                    </div>

                    <div class="absolute bottom-8 left-0 px-12 z-10">
                         <span class="bg-cyan-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Lectura: ${readingTime} min</span>
                    </div>
                </div>`;
        } else {
            galleryHTML = `
                <div class="h-[450px] w-[calc(100%+6rem)] -ml-12 -mt-12 mb-10 overflow-hidden relative group/hero" style="background: linear-gradient(135deg, ${bgColor}22, ${bgColor}44);">
                    <img src="${images[0]}" 
                         alt="${item.title}"
                         class="w-full h-full object-cover group-hover/hero:scale-110 transition-transform duration-700"
                         onerror="this.onerror=null; this.src='${placeholderSVG}';"
                         loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/20 to-transparent"></div>
                    <div class="absolute bottom-8 left-0 px-12">
                         <span class="bg-cyan-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Lectura: ${readingTime} min</span>
                    </div>
                </div>`;
        }

        modalBody.innerHTML = `
            <div class="animate-in">
                ${galleryHTML}
                
                <button onclick="window.closeModal()" class="mb-6 flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group">
                    <span class="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    <span class="text-sm font-bold uppercase tracking-wider">Volver al Inicio</span>
                </button>

                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
                    <h2 class="text-4xl md:text-6xl font-bold leading-tight m-0">${item.title}</h2>
                    <div class="flex gap-3">
                        <button onclick="window.shareWhatsApp('${item.title}')" class="share-btn">
                            <span>📱</span> WhatsApp
                        </button>
                        <button onclick="window.copyToClipboard('${id}')" class="share-btn">
                            <span>🔗</span> Copiar
                        </button>
                    </div>
                </div>

                <p class="text-xl text-gray-300 leading-relaxed mb-12 font-light">${item.fact}</p>
                
                <div class="flex flex-col items-center gap-6 mb-16 p-8 glass-card no-hover bg-white/5 border-white/10">
                    <p class="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">¿Qué te pareció?</p>
                    <div class="flex gap-6">
                        ${['😲', '🤯', '🤔', '💖'].map(e => `<button onclick="voteEmoji(${id}, '${e}')" class="text-4xl hover:scale-125 transition-transform active:scale-95 duration-200">${e}</button>`).join('')}
                    </div>
                </div>

                <div id="newsletter-segment" class="mb-16 p-8 rounded-3xl bg-gradient-to-br from-cyan-400/10 to-purple-400/10 border border-white/5 text-center">
                    <h4 class="text-xl font-bold mb-2">¿Quieres más curiosidades? 🚀</h4>
                    <p class="text-gray-400 text-sm mb-6">Suscríbete a nuestra "Curiosidad del Viernes". No spam, solo asombro.</p>
                    <div class="flex max-w-md mx-auto gap-2">
                        <input type="email" placeholder="tu@email.com" class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex-grow outline-none focus:border-cyan-400">
                        <button onclick="alert('¡Gracias! Pronto recibirás grandes secretos.')" class="btn-glow px-6 py-2 rounded-xl font-bold text-sm">Unirse</button>
                    </div>
                </div>

                <div class="comments-section border-t border-white/10 pt-12">
                    <h3 class="text-2xl font-bold mb-8 flex items-center gap-3">
                        <span class="w-2 h-8 bg-cyan-400 rounded-full"></span> Comentarios
                    </h3>
                    <div id="comment-list" class="space-y-4">Cargando...</div>
                </div>
            </div>`;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        loadComments(id);
    };

    window.shareWhatsApp = (title) => {
        const url = window.location.href;
        window.open(`https://api.whatsapp.com/send?text=🧪 ¡Mira lo que descubrí en CurioSphere!: ${title} - ${url}`, '_blank');
    };

    window.copyToClipboard = (id) => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("¡Enlace copiado al portapapeles! 🔗");
        });
    };

    async function loadComments(id) {
        const list = document.getElementById('comment-list');
        try {
            const comments = await API.getComments(id);
            list.innerHTML = comments.length ? comments.map(c => `<div class="bg-white/5 p-4 rounded-xl border border-white/5"><div class="flex justify-between text-xs mb-2"><span class="text-cyan-400 font-bold">${c.author}</span><span class="text-gray-500">${new Date(c.date).toLocaleDateString()}</span></div><p class="text-sm text-gray-300">${c.text}</p></div>`).reverse().join('') : '<p class="text-gray-500 text-center">Sin comentarios aún.</p>';
        } catch (e) { list.innerHTML = 'Error al cargar.'; }
    }

    filters.forEach(btn => btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active', 'bg-cyan-400', 'text-black'));
        btn.classList.add('active', 'bg-cyan-400', 'text-black');
        currentPage = 1;
        renderGrid(btn.dataset.category === 'all' ? curiosities : curiosities.filter(c => c.category === btn.dataset.category));
    }));

    // Initial Load
    // Initial Load
    API.getCuriosities().then(data => {
        curiosities = data;
        window.allCuriosities = data;
        renderGrid(data);
        initMarquee(data);
        initSearch(data); // New search function
    });
    initWeather();
    initParticles(); // New particles
    initBackToTop(); // New back to top
    window.checkAuth();
    initAuth();
});

// --- AUTHENTICATION LOGIC ---

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = loginForm.querySelectorAll('input');
            const email = inputs[0].value;
            const password = inputs[1].value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    window.location.reload();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                alert('Error de conexión');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = registerForm.querySelectorAll('input');
            const name = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    window.toggleModal('register-modal');
                    window.toggleModal('verify-modal');
                    // Store email for verification
                    localStorage.setItem('pending_email', email);

                    // DEV HELP: Pre-fill token if returned
                    if (data.token) {
                        alert(`¡Modo Pruebas! Tu token de verificación es: ${data.token}`);
                        setTimeout(() => {
                            const tokenInput = document.getElementById('verify-token');
                            if (tokenInput) tokenInput.value = data.token;
                        }, 500);
                    }
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                alert('Error al registrarse');
            }
        });
    }
}

window.verifyEmail = async () => {
    const token = document.getElementById('verify-token').value;
    const email = localStorage.getItem('pending_email');

    if (!token || !email) return alert('Datos incompletos');

    try {
        const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message);
            window.toggleModal('verify-modal');
            window.toggleModal('login-modal');
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Error en verificación');
    }
};

// --- NEW FUNCTIONALITIES ---

function initSearch(items) {
    const searchInput = document.getElementById('main-search');
    const suggestionsBox = document.getElementById('search-suggestions');

    if (!searchInput || !suggestionsBox) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        const matches = items.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        ).slice(0, 5);

        if (matches.length > 0) {
            suggestionsBox.innerHTML = matches.map(item => `
                <div class="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0" onclick="window.openDetail(${item.id}); document.getElementById('search-suggestions').classList.add('hidden');">
                    <img src="${(item.images && item.images.length > 0) ? item.images[0] : item.image}" class="w-8 h-8 rounded-full object-cover">
                    <div>
                        <div class="text-sm font-bold text-white">${item.title}</div>
                        <div class="text-[10px] text-cyan-400 uppercase">${item.category}</div>
                    </div>
                </div>
            `).join('');
            suggestionsBox.classList.remove('hidden');
        } else {
            suggestionsBox.innerHTML = '<div class="px-4 py-3 text-gray-500 text-xs italic">Sin resultados cósmicos...</div>';
            suggestionsBox.classList.remove('hidden');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });
}

function initBackToTop() {
    const btn = document.createElement('button');
    btn.innerHTML = '↑';
    btn.className = 'fixed bottom-8 right-8 bg-cyan-400 text-black w-12 h-12 rounded-full font-bold text-xl shadow-[0_0_20px_rgba(0,242,255,0.6)] z-40 hover:scale-110 transition-all hidden flex items-center justify-center';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    });
}

function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2;
            this.color = Math.random() > 0.5 ? 'rgba(0, 242, 255, ' : 'rgba(112, 0, 255, ';
            this.alpha = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = this.color + this.alpha + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create particles
    for (let i = 0; i < 100; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- UTILS & GAMES ---
window.voteEmoji = (id, emoji) => {
    const target = event.target;
    target.classList.add('animate-bounce');
    setTimeout(() => target.classList.remove('animate-bounce'), 1000);
    const votes = JSON.parse(localStorage.getItem(`votes_${id}`) || '[]');
    votes.push({ emoji, date: new Date().toISOString() });
    localStorage.setItem(`votes_${id}`, JSON.stringify(votes));
};

function initMarquee(items) {
    const content = document.getElementById('marquee-content');
    if (!content) return;
    const facts = items.slice(0, 10).map(i => `<div class="marquee-item"><span>💡 SABÍAS QUE:</span> ${i.fact}</div>`).join('');
    content.innerHTML = facts + facts;
}

async function initWeather() {
    const cityEl = document.getElementById('nav-weather-city');
    const tempEl = document.getElementById('nav-weather-temp');
    const iconEl = document.getElementById('nav-weather-icon');

    let lat = -34.9011;
    let lon = -56.1645;
    let cityName = 'Montevideo';

    const getWeatherIcon = (code) => {
        const icons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '⛈️',
            71: '🌨️', 73: '🌨️', 75: '❄️',
            80: '🌦️', 81: '⛈️', 82: '⛈️',
            95: '⛈️'
        };
        return icons[code] || '🌤️';
    };

    const getWeatherImage = (code) => {
        const imageMap = {
            0: '01d', 1: '02d', 2: '03d', 3: '04d',
            45: '50d', 48: '50d',
            51: '09d', 53: '09d', 55: '10d',
            61: '10d', 63: '10d', 65: '11d',
            71: '13d', 73: '13d', 75: '13d',
            80: '09d', 81: '11d', 82: '11d',
            95: '11d'
        };
        const iconCode = imageMap[code] || '02d';
        return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    };

    const getWeatherDescription = (code) => {
        const descriptions = {
            0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
            45: 'Niebla', 48: 'Niebla con escarcha',
            51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
            61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
            71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa',
            80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos intensos',
            95: 'Tormenta'
        };
        return descriptions[code] || 'Desconocido';
    };

    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
        const response = await fetch(weatherUrl);

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;
        const windSpeed = Math.round(data.current_weather.windspeed);
        const humidity = data.hourly.relativehumidity_2m[0] || 0;
        const icon = getWeatherIcon(weatherCode);
        const weatherImage = getWeatherImage(weatherCode);
        const description = getWeatherDescription(weatherCode);

        if (cityEl) cityEl.textContent = cityName;
        if (tempEl) tempEl.textContent = `${temp}°C`;
        if (iconEl) {
            iconEl.textContent = icon;
            iconEl.classList.remove('hidden');
        }

        // Actualizar modal expandido
        const ciudadFull = document.getElementById('ciudad-full');
        const tempFull = document.getElementById('temp-full');
        const descFull = document.getElementById('desc-full');
        const iconoFull = document.getElementById('icono-full');
        const humedadEl = document.getElementById('humedad-full');
        const vientoEl = document.getElementById('viento-full');

        if (ciudadFull) ciudadFull.textContent = cityName.toUpperCase();
        if (tempFull) tempFull.textContent = `${temp}°C`;
        if (descFull) descFull.textContent = description;
        if (iconoFull) {
            iconoFull.src = weatherImage;
            iconoFull.alt = description;
        }
        if (humedadEl) humedadEl.textContent = `${humidity}%`;
        if (vientoEl) vientoEl.textContent = `${windSpeed} KM/H`;

        console.log('✅ Clima cargado:', cityName, temp + '°C', `Humedad: ${humidity}%`, `Viento: ${windSpeed} km/h`);

    } catch (error) {
        console.error('❌ Error al cargar clima:', error);
        if (cityEl) cityEl.textContent = 'Montevideo';
        if (tempEl) tempEl.textContent = '20°C';
        if (iconEl) {
            iconEl.textContent = '🌤️';
            iconEl.classList.remove('hidden');
        }
    }
}

// Búsqueda manual de clima
window.manualWeatherSearch = async () => {
    const input = document.getElementById('weather-search-input');
    const cityQuery = input.value.trim();

    if (!cityQuery) {
        alert('Por favor ingresa una ciudad');
        return;
    }

    try {
        // Geocodificación usando Open-Meteo
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=es&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert('Ciudad no encontrada. Intenta con otra.');
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const cityName = location.name;
        const country = location.country || '';

        // Obtener clima
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        const temp = Math.round(weatherData.current_weather.temperature);
        const weatherCode = weatherData.current_weather.weathercode;
        const windSpeed = Math.round(weatherData.current_weather.windspeed);
        const humidity = weatherData.hourly.relativehumidity_2m[0] || 0;

        const getWeatherIcon = (code) => {
            const icons = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️',
                51: '🌦️', 53: '🌦️', 55: '🌧️',
                61: '🌧️', 63: '🌧️', 65: '⛈️',
                71: '🌨️', 73: '🌨️', 75: '❄️',
                80: '🌦️', 81: '⛈️', 82: '⛈️',
                95: '⛈️'
            };
            return icons[code] || '🌤️';
        };

        const getWeatherDescription = (code) => {
            const descriptions = {
                0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
                45: 'Niebla', 48: 'Niebla con escarcha',
                51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
                61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
                71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa',
                80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos intensos',
                95: 'Tormenta'
            };
            return descriptions[code] || 'Desconocido';
        };

        const getWeatherImage = (code) => {
            const imageMap = {
                0: '01d', 1: '02d', 2: '03d', 3: '04d',
                45: '50d', 48: '50d',
                51: '09d', 53: '09d', 55: '10d',
                61: '10d', 63: '10d', 65: '11d',
                71: '13d', 73: '13d', 75: '13d',
                80: '09d', 81: '11d', 82: '11d',
                95: '11d'
            };
            const iconCode = imageMap[code] || '02d';
            return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        };

        const icon = getWeatherIcon(weatherCode);
        const description = getWeatherDescription(weatherCode);
        const weatherImage = getWeatherImage(weatherCode);

        // Actualizar modal expandido
        const ciudadFull = document.getElementById('ciudad-full');
        const tempFull = document.getElementById('temp-full');
        const descFull = document.getElementById('desc-full');
        const iconoFull = document.getElementById('icono-full');
        const humedadEl = document.getElementById('humedad-full');
        const vientoEl = document.getElementById('viento-full');

        if (ciudadFull) ciudadFull.textContent = `${cityName.toUpperCase()}, ${country}`;
        if (tempFull) tempFull.textContent = `${temp}°C`;
        if (descFull) descFull.textContent = description;
        if (iconoFull) {
            iconoFull.src = weatherImage;
            iconoFull.alt = description;
        }
        if (humedadEl) humedadEl.textContent = `${humidity}%`;
        if (vientoEl) vientoEl.textContent = `${windSpeed} KM/H`;

        // Actualizar widget de navegación
        const cityEl = document.getElementById('nav-weather-city');
        const tempEl = document.getElementById('nav-weather-temp');
        const iconEl = document.getElementById('nav-weather-icon');

        if (cityEl) cityEl.textContent = cityName;
        if (tempEl) tempEl.textContent = `${temp}°C`;
        if (iconEl) iconEl.textContent = icon;

        input.value = '';

    } catch (error) {
        console.error('Error en búsqueda manual:', error);
        alert('Error al buscar el clima. Intenta nuevamente.');
    }
};

window.checkAuth = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const btns = document.getElementById('auth-buttons');
    const info = document.getElementById('user-info');
    if (user && btns && info) {
        btns.classList.add('hidden');
        info.classList.remove('hidden');
        document.getElementById('user-name').innerText = user.name;
        if (user.role === 'admin') {
            document.getElementById('admin-btn').classList.remove('hidden');
            document.getElementById('user-role-badge').innerText = 'Administrador';
            document.getElementById('user-role-badge').className = 'text-[8px] bg-red-600/30 text-red-400 px-2 rounded uppercase tracking-tighter border border-red-600/50';
        }
    }
};

window.logout = () => { localStorage.clear(); window.location.reload(); };

window.openAdmin = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión como administrador');
        return;
    }

    try {
        const res = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            alert('Acceso denegado. No tienes permisos de administrador.');
            return;
        }

        const data = await res.json();
        renderAdminDashboard(data);
        toggleModal('admin-modal');
    } catch (err) {
        console.error('Error al cargar dashboard:', err);
        alert('Error al cargar el panel de administración');
    }
};

function renderAdminDashboard(data) {
    const usersList = document.getElementById('admin-users-list');
    const actionsList = document.getElementById('admin-actions-list');

    usersList.innerHTML = data.users.map(user => `
        <div class="glass-card p-4 flex justify-between items-center">
            <div>
                <div class="font-bold text-sm">${user.name}</div>
                <div class="text-xs text-gray-500">${user.email}</div>
                <div class="text-[10px] mt-1 ${user.role === 'admin' ? 'text-red-400' : 'text-cyan-400'}">${user.role.toUpperCase()}</div>
            </div>
            <div class="text-right">
                <div class="text-[10px] text-gray-500">${new Date(user.createdAt).toLocaleDateString()}</div>
                <div class="text-[10px] ${user.verified ? 'text-green-400' : 'text-yellow-400'}">
                    ${user.verified ? '✓ Verificado' : 'Pendiente'}
                </div>
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 text-sm">No hay usuarios registrados.</p>';

    actionsList.innerHTML = data.actions.map(action => `
        <div class="p-2 border-b border-white/5 hover:bg-white/5">
            <span class="text-cyan-400">[${new Date(action.timestamp).toLocaleTimeString()}]</span>
            <span class="text-gray-300">${action.email}</span>
            <span class="text-gray-500">- ${action.action}</span>
        </div>
    `).join('') || '<p class="text-gray-500 text-sm">No hay acciones registradas.</p>';
}

// --- GAMES SUITE (ENHANCED) ---
const gameBoard = document.getElementById('game-board');
const gameSelection = document.getElementById('game-selection');

const showBoard = () => {
    gameSelection.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    window.scrollTo({ top: gameBoard.offsetTop - 100, behavior: 'smooth' });
};

window.closeGame = () => {
    gameBoard.classList.add('hidden');
    gameSelection.classList.remove('hidden');
    gameBoard.innerHTML = '';
};

// 1. Quiz Galáctico
window.startQuiz = () => {
    showBoard();
    let score = 0;
    const questions = [
        { q: "¿Qué animal tiene 3 corazones?", ans: "Pulpo", opts: ["Tiburón", "Pulpo", "Ballena", "Calamar"] },
        { q: "¿Cuál es el planeta más grande?", ans: "Júpiter", opts: ["Tierra", "Marte", "Júpiter", "Saturno"] },
        { q: "¿La velocidad de la luz?", ans: "300,000 km/s", opts: ["150,000 km/s", "300,000 km/s", "1,000 km/s", "Infinita"] }
    ];
    let qIdx = 0;

    const renderQ = () => {
        if (qIdx >= questions.length) return endGame(score, questions.length);
        const q = questions[qIdx];
        gameBoard.innerHTML = `
            <div class="text-center animate-in max-w-2xl mx-auto">
                <div class="mb-4 flex justify-between text-xs text-cyan-400 font-bold tracking-widest">
                    <span>PREGUNTA ${qIdx + 1}/${questions.length}</span>
                    <span>PUNTOS: ${score}</span>
                </div>
                <h3 class="text-3xl font-bold mb-8 playfair leading-tight">${q.q}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${q.opts.map(o => `<button onclick="handleQ('${o}', '${q.ans}')" class="quiz-option p-6 text-lg hover:scale-105 transition-transform">${o}</button>`).join('')}
                </div>
            </div>`;
    };

    window.handleQ = (selected, correct) => {
        if (selected === correct) score++;
        qIdx++;
        renderQ();
    };

    renderQ();
};

// 2. Bio-Memoria
window.startMemory = () => {
    showBoard();
    const emojis = ['🧬', '🦠', '🧪', '🔭', '🪐', '🦕', '🧬', '🦠', '🧪', '🔭', '🪐', '🦕'];
    let shuffled = emojis.sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;

    gameBoard.innerHTML = `
        <div class="max-w-xl mx-auto text-center animate-in">
            <h3 class="text-2xl font-bold mb-6 text-purple-400">Bio-Memoria</h3>
            <div class="grid grid-cols-4 gap-4" id="mem-grid">
                ${shuffled.map((e, i) => `
                    <div onclick="flipCard(${i}, '${e}')" id="card-${i}" class="aspect-square bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-all flex items-center justify-center text-4xl card-holo">
                        <span class="opacity-0 transition-opacity duration-300 select-none">${e}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;

    window.flipCard = (i, e) => {
        const el = document.getElementById(`card-${i}`);
        if (el.classList.contains('flipped') || flipped.length >= 2) return;

        el.classList.add('flipped', 'bg-cyan-900/50', 'border-cyan-400');
        el.querySelector('span').classList.remove('opacity-0');
        flipped.push({ i, e });

        if (flipped.length === 2) {
            setTimeout(() => {
                const [c1, c2] = flipped;
                if (c1.e === c2.e) {
                    matched++;
                    if (matched === emojis.length / 2) endGame(100, 100);
                } else {
                    [c1, c2].forEach(c => {
                        const cell = document.getElementById(`card-${c.i}`);
                        cell.classList.remove('flipped', 'bg-cyan-900/50', 'border-cyan-400');
                        cell.querySelector('span').classList.add('opacity-0');
                    });
                }
                flipped = [];
            }, 800);
        }
    };
};

// 3. Caza-Átomos
window.startAtomHunter = () => {
    showBoard();
    let score = 0;
    let timeLeft = 10;

    gameBoard.innerHTML = `
        <div class="max-w-2xl mx-auto text-center animate-in">
            <h3 class="text-2xl font-bold mb-2 text-cyan-400">Caza-Átomos</h3>
            <div class="flex justify-between mb-4 font-mono text-sm">
                <span id="atom-time">TIEMPO: ${timeLeft}s</span>
                <span id="atom-score">ÁTOMOS: 0</span>
            </div>
            <div id="atom-zone" class="relative h-96 w-full card-holo overflow-hidden cursor-crosshair"></div>
        </div>`;

    const zone = document.getElementById('atom-zone');

    const spawnAtom = () => {
        if (timeLeft <= 0) return;
        const atom = document.createElement('div');
        atom.className = 'absolute w-12 h-12 bg-cyan-400 rounded-full shadow-[0_0_30px_#00f2ff] animate-ping cursor-pointer';
        atom.style.top = Math.random() * (zone.clientHeight - 50) + 'px';
        atom.style.left = Math.random() * (zone.clientWidth - 50) + 'px';
        atom.onclick = (e) => {
            e.stopPropagation();
            score++;
            document.getElementById('atom-score').innerText = `ÁTOMOS: ${score}`;
            atom.remove();
            spawnAtom();
        };
        zone.appendChild(atom);
    };

    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('atom-time').innerText = `TIEMPO: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame(score, 10); // Target score 10
        }
    }, 1000);

    spawnAtom();
};

// 4. Rapidez Matemática
window.startMathChallenge = () => {
    showBoard();
    // Simplified visuals for brevity
    gameBoard.innerHTML = `<div class="text-center"><h3 class="text-2xl mb-4">Calculando...</h3><p class="text-gray-400">Próximamente: Desafío de cálculo cuántico.</p><button onclick="closeGame()" class="btn-galaxy mt-4">Volver</button></div>`;
};

// 5. Gravedad Zero
window.startGravitySort = () => {
    showBoard();
    // Simplified visuals for brevity
    gameBoard.innerHTML = `<div class="text-center"><h3 class="text-2xl mb-4">Ordenando Planetas...</h3><p class="text-gray-400">Próximamente: Arrastra planetas a su órbita.</p><button onclick="closeGame()" class="btn-galaxy mt-4">Volver</button></div>`;
};

// 6. NEW GAME: Crono-Explorador
window.startChronoExplorer = () => {
    showBoard();
    const events = [
        { y: -13800000000, t: "Big Bang" },
        { y: -4500000000, t: "Formación Tierra" },
        { y: -65000000, t: "Extinción Dinosaurios" },
        { y: 1969, t: "Hombre en la Luna" }
    ];
    // Simple verification simulation for visual mockup
    gameBoard.innerHTML = `
        <div class="max-w-xl mx-auto text-center animate-in">
            <h3 class="text-2xl font-bold mb-2 text-yellow-400">Crono-Explorador</h3>
            <p class="mb-8 text-sm text-gray-400">Ordena los eventos del más antiguo al más reciente.</p>
            <div class="space-y-3 mb-8">
                ${events.sort(() => Math.random() - 0.5).map(e => `
                    <div class="p-4 card-holo text-left flex justify-between items-center group cursor-move">
                        <span class="font-bold">${e.t}</span>
                        <span class="text-xs text-gray-500 group-hover:text-cyan-400">↕</span>
                    </div>
                `).join('')}
            </div>
            <button onclick="endGame(4,4)" class="btn-galaxy w-full">Verificar Línea Temporal</button>
        </div>`;
};

function endGame(score, total) {
    const isWin = score >= total * 0.7; // 70% to win
    gameBoard.innerHTML = `
        <div class="text-center animate-in max-w-md mx-auto">
            <div class="text-6xl mb-6">${isWin ? '🏆' : '🧪'}</div>
            <h2 class="text-3xl font-bold mb-2">${isWin ? '¡Misión Cumplida!' : 'Resultados Preliminares'}</h2>
            <p class="text-xl mb-8 text-cyan-400 font-mono">Puntuación: ${score}</p>
            <p class="text-gray-400 mb-8">${isWin ? 'Has demostrado ser un verdadero explorador del conocimiento.' : 'No te rindas. La ciencia requiere perseverancia.'}</p>
            <button onclick="closeGame()" class="btn-galaxy px-8">Volver al Laboratorio</button>
        </div>`;
}

// Global user rankings marquee
function renderUserRankings() {
    const marquee = document.createElement('div');
    marquee.className = 'fixed top-20 right-0 w-64 bg-black/40 backdrop-blur border-l border-white/10 p-4 hidden xl:block z-40 rounded-l-2xl';
    marquee.innerHTML = `
        <h4 class="text-xs font-bold text-cyan-400 tracking-widest mb-3 uppercase border-b border-white/10 pb-2">Top Exploradores</h4>
        <div class="space-y-3 text-xs font-mono h-48 overflow-hidden relative">
            <div class="animate-marquee-vertical space-y-3">
                ${[
            { n: 'AstroGirl_99', s: 4500 }, { n: 'QuantumBob', s: 4200 }, { n: 'NeutronStar', s: 3950 },
            { n: 'BioHacker', s: 3800 }, { n: 'LunarWalker', s: 3600 }, { n: 'DinoFan', s: 3100 }
        ].map((u, i) => `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">#${i + 1} ${u.n}</span>
                        <span class="text-yellow-400">${u.s} XP</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(marquee);

    // Add CSS for vertical marquee
    const style = document.createElement('style');
    style.textContent = `
        @keyframes marquee-vertical {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
        }
        .animate-marquee-vertical { animation: marquee-vertical 10s linear infinite; }
    `;
    document.head.appendChild(style);
}

// Add ranking to initialization
window.addEventListener('load', renderUserRankings);

// --- ADMIN FUNCTIONS ---

window.switchAdminTab = (tabName) => {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active', 'border-cyan-400', 'text-cyan-400');
        tab.classList.add('text-gray-500');
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    event.target.classList.add('active', 'border-cyan-400', 'text-cyan-400');
    event.target.classList.remove('text-gray-500');
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
};

let adminData = null;
let editingCuriosityId = null;

function renderAdminDashboard(data) {
    adminData = data;

    document.getElementById('stat-users').textContent = data.stats?.totalUsers || data.users?.length || 0;
    document.getElementById('stat-curiosities').textContent = data.stats?.totalCuriosities || data.curiosities?.length || 0;
    document.getElementById('stat-comments').textContent = data.stats?.totalComments || 0;
    document.getElementById('stat-actions').textContent = data.actions?.length || 0;

    const users = data.users || [];
    document.getElementById('users-count').textContent = `${users.length} usuarios`;

    const usersList = document.getElementById('admin-users-list');
    usersList.innerHTML = users.length ? users.map(user => `
        <div class="glass-card p-3 flex justify-between items-center hover:bg-white/5 transition-colors ${user.blocked ? 'opacity-60 border border-red-500/30' : ''}">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br ${user.blocked ? 'from-red-500 to-red-700' : 'from-cyan-400 to-purple-500'} flex items-center justify-center font-bold text-black text-sm relative">
                    ${user.name?.charAt(0).toUpperCase() || '?'}
                    ${user.blocked ? '<span class="absolute -top-1 -right-1 text-red-500 text-xs">🚫</span>' : ''}
                </div>
                <div>
                    <div class="font-bold text-sm flex items-center gap-2">
                        ${user.name || 'Sin nombre'}
                        ${user.role === 'admin' ? '<span class="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">ADMIN</span>' : ''}
                        ${user.blocked ? '<span class="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">BLOQUEADO</span>' : ''}
                    </div>
                    <div class="text-xs text-gray-500">${user.email}</div>
                    ${user.blocked ? `<div class="text-[10px] text-red-400 mt-0.5">Bloqueado: ${new Date(user.blockedAt).toLocaleDateString()}</div>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${user.role !== 'admin' ? `
                    <button onclick="resetUserPassword(${user.id})" title="Resetear contraseña" class="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-500/30 hover:bg-yellow-500/10 transition-colors">🔑</button>
                    <button onclick="toggleUserBlock(${user.id}, ${!user.blocked})" title="${user.blocked ? 'Desbloquear' : 'Bloquear'}" class="${user.blocked ? 'text-green-400 hover:text-green-300 border-green-500/30 hover:bg-green-500/10' : 'text-orange-400 hover:text-orange-300 border-orange-500/30 hover:bg-orange-500/10'} text-xs px-2 py-1 rounded border transition-colors">${user.blocked ? '✓' : '🚫'}</button>
                    <button onclick="deleteUser(${user.id})" title="Eliminar usuario" class="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors">✕</button>
                ` : ''}
            </div>
        </div>
    `).join('') : '<p class="text-gray-500 text-sm text-center py-8">No hay usuarios registrados.</p>';

    const curiosities = data.curiosities || [];
    const curiositiesList = document.getElementById('admin-curiosities-list');
    curiositiesList.innerHTML = curiosities.length ? curiosities.map(c => `
        <div class="glass-card p-3 flex justify-between items-center hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-3">
                <img src="${c.image || c.images?.[0] || ''}" class="w-12 h-12 rounded-lg object-cover bg-white/10"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect width=%2248%22 height=%2248%22 fill=%22%23000%22 opacity=%220.3%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-family=%22Arial%22 font-size=%2210%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E${c.category?.charAt(0) || '?'}%3C/text%3E%3C/svg%3E'">
                <div>
                    <div class="font-bold text-sm">${c.title}</div>
                    <div class="text-[10px] text-gray-500 flex items-center gap-2">
                        <span class="text-cyan-400">${c.category}</span>
                        <span>•</span>
                        <span>ID: ${c.id}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="editCuriosity(${c.id})" class="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors">Editar</button>
                <button onclick="deleteCuriosity(${c.id})" class="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors">✕</button>
            </div>
        </div>
    `).join('') : '<p class="text-gray-500 text-sm text-center py-8">No hay curiosidades. ¡Agrega la primera!</p>';

    const actions = data.actions || [];
    document.getElementById('actions-count').textContent = `${actions.length} acciones`;

    const actionsList = document.getElementById('admin-actions-list');
    actionsList.innerHTML = actions.length ? actions.map(action => `
        <div class="p-2 border-b border-white/5 hover:bg-white/5 flex items-start gap-2">
            <span class="text-cyan-400 whitespace-nowrap">${new Date(action.timestamp).toLocaleTimeString()}</span>
            <span class="text-purple-400">${action.email || 'Sistema'}</span>
            <span class="text-gray-400">- ${action.action}</span>
        </div>
    `).join('') : '<p class="text-gray-500 text-sm text-center py-8">No hay acciones registradas.</p>';
}

window.openAddCuriosityModal = () => {
    editingCuriosityId = null;
    document.getElementById('curiosity-form-title').textContent = 'Nueva Curiosidad';
    document.getElementById('curiosity-form').reset();
    toggleModal('curiosity-form-modal');
};

window.editCuriosity = (id) => {
    const curiosity = adminData.curiosities.find(c => c.id === id);
    if (!curiosity) return;

    editingCuriosityId = id;
    document.getElementById('curiosity-form-title').textContent = 'Editar Curiosidad';
    document.getElementById('curiosity-title').value = curiosity.title || '';
    document.getElementById('curiosity-category').value = curiosity.category || 'Ciencia';
    document.getElementById('curiosity-fact').value = curiosity.fact || '';
    document.getElementById('curiosity-image').value = curiosity.image || curiosity.images?.[0] || '';
    document.getElementById('curiosity-link').value = curiosity.links?.[0] || '';
    toggleModal('curiosity-form-modal');
};

window.deleteCuriosity = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta curiosidad?')) return;

    try {
        const res = await API.deleteCuriosity(id);
        if (res.error) {
            alert('Error: ' + res.error);
        } else {
            toggleModal('curiosity-form-modal');
            window.openAdmin();
            window.allCuriosities = null;
            API.getCuriosities().then(data => {
                window.allCuriosities = data;
                renderGrid(data);
            });
        }
    } catch (err) {
        alert('Error al guardar');
    }
});

window.resetUserPassword = async (id) => {
    if (!confirm('¿Restablecer la contraseña de este usuario? Se generará una nueva contraseña.')) return;

    try {
        const res = await API.resetUserPassword(id);
        if (res.error) {
            alert('Error: ' + res.error);
        } else {
            alert(`✅ Contraseña restablecida\n\nNueva contraseña: ${res.newPassword}\n\n⚠️ Comparte esta contraseña con el usuario de forma segura.`);
            window.openAdmin();
        }
    } catch (err) {
        alert('Error al restablecer contraseña');
    }
};

window.toggleUserBlock = async (id, block) => {
    const action = block ? 'bloquear' : 'desbloquear';
    if (!confirm(`¿Estás seguro de ${action} a este usuario?`)) return;

    try {
        const res = await API.blockUser(id, block);
        if (res.error) {
            alert('Error: ' + res.error);
        } else {
            alert(block ? '🚫 Usuario bloqueado' : '✅ Usuario desbloqueado');
            window.openAdmin();
        }
    } catch (err) {
        alert('Error al procesar solicitud');
    }
};

window.deleteUser = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
        const res = await API.deleteUser(id);
        if (res.error) {
            alert('Error: ' + res.error);
        } else {
            window.openAdmin();
        }
    } catch (err) {
        alert('Error al eliminar usuario');
    }
};

document.getElementById('curiosity-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const curiosity = {
        title: document.getElementById('curiosity-title').value,
        category: document.getElementById('curiosity-category').value,
        fact: document.getElementById('curiosity-fact').value,
        image: document.getElementById('curiosity-image').value || `https://picsum.photos/seed/${Date.now()}/800/600`,
        links: document.getElementById('curiosity-link').value ? [document.getElementById('curiosity-link').value] : []
    };

    try {
        let res;
        if (editingCuriosityId) {
            res = await API.updateCuriosity(editingCuriosityId, curiosity);
        } else {
            res = await API.addCuriosity(curiosity);
        }

        if (res.error) {
            alert('Error: ' + res.error);
        } else {
            toggleModal('curiosity-form-modal');
            window.openAdmin();
            window.allCuriosities = null;
            API.getCuriosities().then(data => {
                window.allCuriosities = data;
                renderGrid(data);
            });
        }
    } catch (err) {
        alert('Error al guardar');
    }
});
