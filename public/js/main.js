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
            const accent = colors[item.category] || 'text-cyan-400';
            const img = item.image || `https://images.unsplash.com/photo-1532187875605-1fc6367b913e?w=800&sig=${item.id}`;
            return `
                <div class="glass-card overflow-hidden flex flex-col animate-in">
                    <div class="h-56 overflow-hidden bg-gray-900"><img src="${img}" class="w-full h-full object-cover hover:scale-110 transition-transform"></div>
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
        modalBody.innerHTML = `
            <div class="animate-in">
                <div class="h-[450px] w-[calc(100%+6rem)] -ml-12 -mt-12 mb-10 overflow-hidden relative"><img src="${item.image || ''}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-gradient-to-t from-[#05070a] to-transparent"></div></div>
                <h2 class="text-4xl md:text-6xl mb-8 font-bold">${item.title}</h2>
                <p class="text-xl text-gray-300 leading-relaxed mb-12">${item.fact}</p>
                <div class="flex gap-4 mb-12 justify-center">${['😲', '🤯', '🤔', '💖'].map(e => `<button onclick="voteEmoji(${id}, '${e}')" class="text-3xl hover:scale-125 transition-transform">${e}</button>`).join('')}</div>
                <div class="comments-section border-t border-white/10 pt-12">
                    <h3 class="text-2xl font-bold mb-8">Comentarios</h3>
                    <div id="comment-list" class="space-y-4">Cargando...</div>
                </div>
            </div>`;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        loadComments(id);
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
window.startQuiz = () => {
    const board = document.getElementById('game-board');
    document.getElementById('game-selection').classList.add('hidden');
    board.classList.remove('hidden');
    board.innerHTML = `<h3>¿Cuántos corazones tiene un pulpo?</h3><div class="flex gap-2 justify-center mt-4"><button onclick="checkAns(true)" class="quiz-option">3</button><button onclick="checkAns(false)" class="quiz-option">1</button></div>`;
};
window.checkAns = (win) => {
    alert(win ? "¡Correcto! 🐙" : "¡Error! 💥");
    location.reload();
};
