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
        container.innerHTML = `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ¡Eureka! ¿En qué locura científica puedo ayudarte hoy? ✨</div>`;
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
    }
};

window.logout = () => { localStorage.clear(); window.location.reload(); };

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
