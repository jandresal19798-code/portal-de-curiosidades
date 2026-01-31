// --- GLOBAL HELPERS & UI ---
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
    const btn = document.getElementById('theme-btn');
    const isLight = body.classList.toggle('light-mode');
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
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
        container.innerHTML = `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ¡Eureka! ¿En qué locura científica puedo ayudarte hoy? ✨</div>`;
    }
};

window.botMessage = (e) => {
    if (e.key === 'Enter') {
        const input = e.target;
        const msg = input.value.toLowerCase();
        const container = document.getElementById('bot-messages');
        let response = "¡No me interrumpas! Estoy mezclando plutonio. Pregunta sobre átomos, animales o el espacio.";

        if (msg.includes('ciencia')) response = "¡La ciencia es magia que funciona! 🧪";
        if (msg.includes('animal')) response = "¡Los pulpos tienen 3 corazones! 🐙";
        if (msg.includes('espacio')) response = "¡En Marte los atardeceres son azules! 🌌";

        container.innerHTML += `<div class="msg-user"><b>Tú:</b> ${input.value}</div>`;
        container.innerHTML += `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ${response}</div>`;
        input.value = '';
        container.scrollTop = container.scrollHeight;
    }
};

// --- CORE APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('curiosity-grid');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const filters = document.querySelectorAll('.filter-btn');

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

    let curiosities = [];
    window.allCuriosities = [];
    let currentPage = 1;
    const itemsPerPage = 12;

    if (localStorage.getItem('theme') === 'light') window.toggleTheme();
    window.onscroll = () => window.updateProgress();

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

            // Sistema de fallback mejorado para imágenes
            const fallbackImg = `https://source.unsplash.com/800x600/?${encodeURIComponent(item.category.toLowerCase())}`;
            const img = item.image || fallbackImg;

            return `
                <div class="glass-card overflow-hidden flex flex-col animate-in">
                    <div class="h-56 overflow-hidden bg-gray-900 relative">
                        <img src="${img}" 
                             alt="${item.title}"
                             class="w-full h-full object-cover hover:scale-110 transition-transform"
                             onerror="this.onerror=null; this.src='${fallbackImg}'; if(this.src==='${fallbackImg}') this.parentElement.style.background='linear-gradient(135deg, ${bgColor}22, ${bgColor}44)';"
                             loading="lazy">
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

    window.openDetail = async (id) => {
        const item = window.allCuriosities.find(c => c.id === id);
        if (!item) return;

        // Calculate Reading Time (avg 200 words per minute)
        const wordCount = item.fact.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        // Sistema de imágenes mejorado
        const bgColors = { 'Ciencia': '#0891b2', 'Espacio': '#a855f7', 'Animales': '#22c55e', 'Naturaleza': '#f97316', 'Cuerpo Humano': '#ef4444' };
        const bgColor = bgColors[item.category] || '#0891b2';
        const fallbackImg = `https://source.unsplash.com/1200x800/?${encodeURIComponent(item.category.toLowerCase())}`;
        const img = item.image || fallbackImg;

        modalBody.innerHTML = `
            <div class="animate-in">
                <div class="h-[450px] w-[calc(100%+6rem)] -ml-12 -mt-12 mb-10 overflow-hidden relative group/hero" style="background: linear-gradient(135deg, ${bgColor}22, ${bgColor}44);">
                    <img src="${img}" 
                         alt="${item.title}"
                         class="w-full h-full object-cover group-hover/hero:scale-110 transition-transform duration-700"
                         onerror="this.onerror=null; this.src='${fallbackImg}'; if(this.src==='${fallbackImg}') this.style.opacity='0.3';"
                         loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/20 to-transparent"></div>
                    <div class="absolute bottom-8 left-0 px-12">
                         <span class="bg-cyan-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Lectura: ${readingTime} min</span>
                    </div>
                </div>
                
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
    API.getCuriosities().then(data => {
        curiosities = data;
        window.allCuriosities = data;
        renderGrid(data);
        initMarquee(data);
    });
    initWeather();
    window.checkAuth();
});

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
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const weather = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current_weather=true`)).json();
        document.getElementById('nav-weather-city').textContent = data.city;
        document.getElementById('nav-weather-temp').textContent = `${Math.round(weather.current_weather.temperature)}°C`;
    } catch (e) { console.error("Weather error"); }
}

window.checkAuth = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const btns = document.getElementById('auth-buttons');
    const info = document.getElementById('user-info');
    if (user && btns && info) {
        btns.classList.add('hidden');
        info.classList.remove('hidden');
        document.getElementById('user-name').innerText = user.name;
    }
};

window.logout = () => { localStorage.clear(); window.location.reload(); };

// --- GAMES (Simplified) ---
// --- GAMES SUITE ---
const gameBoard = document.getElementById('game-board');
const gameSelection = document.getElementById('game-selection');

const showBoard = () => { gameSelection.classList.add('hidden'); gameBoard.classList.remove('hidden'); window.scrollTo({ top: gameBoard.offsetTop - 100, behavior: 'smooth' }); };
window.closeGame = () => { gameBoard.classList.add('hidden'); gameSelection.classList.remove('hidden'); gameBoard.innerHTML = ''; };

window.startQuiz = () => {
    showBoard();
    gameBoard.innerHTML = `
        <div class="text-center animate-in">
            <h3 class="text-2xl font-bold mb-6">Pregunta Galáctica</h3>
            <p class="text-xl mb-8 font-light">¿Qué animal tiene tres corazones y sangre azul?</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <button onclick="checkAns(true, '¡Increíble! Los pulpos son verdaderos alienígenas biológicos.')" class="quiz-option">🐙 Pulpo</button>
                <button onclick="checkAns(false)" class="quiz-option">🦈 Tiburón</button>
                <button onclick="checkAns(false)" class="quiz-option">🐋 Ballena</button>
                <button onclick="checkAns(false)" class="quiz-option">🦑 Calamar Gigante</button>
            </div>
            <button onclick="closeGame()" class="mt-12 text-gray-500 text-xs hover:text-white transition-colors">← Abandonar experimento</button>
        </div>`;
};

window.startMemory = () => {
    showBoard();
    gameBoard.innerHTML = `
        <div class="text-center animate-in">
            <h3 class="text-2xl font-bold mb-6">Bio-Memoria</h3>
            <p class="text-sm text-gray-400 mb-8">Memoriza la secuencia: <span class="text-cyan-400 font-bold">ADN - Ribo - Cito - Mito</span></p>
            <div class="flex flex-wrap justify-center gap-4">
                <button onclick="checkAns(true, '¡Memoria de elefante! ¿Sabías que el ADN humano es 99.9% idéntico en todos?') " class="btn-glow px-6 py-3 rounded-xl font-bold">Resolver Secuencia</button>
            </div>
            <button onclick="closeGame()" class="mt-8 text-xs text-gray-500">Volver</button>
        </div>`;
};

window.startAtomHunter = () => {
    showBoard();
    gameBoard.innerHTML = `
        <div class="text-center animate-in">
            <h3 class="text-2xl font-bold mb-4">Caza-Átomos</h3>
            <p class="mb-8">Haz clic rápido en el electrón para ganar.</p>
            <div class="relative h-48 w-full glass-card overflow-hidden flex items-center justify-center">
                <div onclick="checkAns(true, '¡Reflejos cuánticos! Los electrones se mueven a 2,200 km por segundo.')" class="w-8 h-8 bg-cyan-400 rounded-full shadow-[0_0_20px_#00f2ff] cursor-pointer animate-pulse"></div>
            </div>
        </div>`;
};

window.startMathChallenge = () => {
    showBoard();
    gameBoard.innerHTML = `
        <div class="text-center animate-in">
            <h3 class="text-2xl font-bold mb-4">Rapidez Matemática</h3>
            <p class="text-3xl mb-8">¿Cuánto es 2⁷?</p>
            <div class="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <button onclick="checkAns(false)" class="quiz-option text-center">64</button>
                <button onclick="checkAns(true, '¡Exacto! 128 es una potencia clave en informática.')" class="quiz-option text-center">128</button>
                <button onclick="checkAns(false)" class="quiz-option text-center">256</button>
                <button onclick="checkAns(false)" class="quiz-option text-center">32</button>
            </div>
        </div>`;
};

window.startGravitySort = () => {
    showBoard();
    gameBoard.innerHTML = `
        <div class="text-center animate-in">
            <h3 class="text-2xl font-bold mb-4">Gravedad Zero</h3>
            <p class="mb-8 text-gray-400">¿Qué planeta es más masivo?</p>
            <div class="flex gap-4 justify-center">
                <button onclick="checkAns(false)" class="quiz-option">Tierra</button>
                <button onclick="checkAns(true, '¡Júpiter es tan grande que cabrían 1,300 Tierras dentro!')" class="quiz-option">Júpiter</button>
            </div>
        </div>`;
};

window.checkAns = (win, fact) => {
    if (win) {
        gameBoard.innerHTML = `
            <div class="text-center animate-in">
                <div class="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
                <h3 class="text-2xl font-bold mb-4">¡Experimento Exitoso!</h3>
                <div class="p-6 bg-white/5 rounded-2xl mb-8 border border-white/10 max-w-md mx-auto">
                    <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Dato Secreto Desbloqueado</p>
                    <p class="text-cyan-400">${fact || 'Has demostrado una inteligencia superior.'}</p>
                </div>
                <button onclick="closeGame()" class="btn-glow px-8 py-3 rounded-full font-bold">Continuar Explorando</button>
            </div>`;
    } else {
        alert("¡Fallo en la matriz! Inténtalo de nuevo. 💥");
    }
};
