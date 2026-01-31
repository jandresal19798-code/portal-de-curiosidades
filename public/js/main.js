// Global Helpers (defined outside to be available immediately)
window.toggleModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
        const isHidden = m.classList.contains('hidden');
        if (isHidden) {
            m.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            history.pushState({ modalId: id }, "");
        } else {
            window.closeSpecificModal(id);
        }
    }
};

window.closeSpecificModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
        m.classList.add('hidden');
        document.body.style.overflow = 'auto';
        // If we closed it manually, we might want to pop state, but back button handles it
    }
};

window.toggleBot = () => {
    const chat = document.getElementById('bot-chat');
    const container = document.getElementById('bot-messages');
    chat.classList.toggle('hidden');

    if (!chat.classList.contains('hidden') && container.innerHTML === "") {
        const intros = [
            "¡MWAHAHA! ¿Quién osa interrumpir mi fusión nuclear?",
            "¡Eureka! ¡Has llegado justo a tiempo para mi experimento número 402!",
            "¡Por los pelos de Einstein! ¡Un humano ha entrado en mi laboratorio!",
            "¡Cuidado donde pisas! ¡Esa mancha verde es... bueno, mejor no preguntes!",
            "¡Rápido! ¡Pásame la llave de 12 dimensiones! Ah, eres tú..."
        ];
        const welcome = intros[Math.floor(Math.random() * intros.length)];
        container.innerHTML = `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ${welcome} ¿En qué locura científica puedo ayudarte hoy?</div>`;
    }
};

window.toggleMobileMenu = () => {
    // Basic mobile menu toggle logic
    alert("Menú móvil en desarrollo - Usa la versión de escritorio para mejor experiencia");
};

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('curiosity-grid');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');
    const filters = document.querySelectorAll('.filter-btn');

    let curiosities = [];

    let currentPage = 1;
    const itemsPerPage = 12;

    function renderGrid(items, append = false) {
        if (!append) grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">No se encontraron curiosidades.</p>';
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = items.slice(start, end);

        const html = pageItems.map(item => {
            const colors = {
                'Ciencia': 'text-cyan-400',
                'Espacio': 'text-purple-400',
                'Animales': 'text-green-400',
                'Naturaleza': 'text-orange-400',
                'Cuerpo Humano': 'text-red-400',
                'Matemáticas': 'text-blue-400'
            };
            const accent = colors[item.category] || 'text-cyan-400';
            // Default high-quality fallback image
            const fallbackImg = `https://images.unsplash.com/photo-1532187875605-1fc6367b913e?auto=format&fit=crop&q=80&w=800&sig=${item.id}`;
            const imgUrl = item.image && item.image.includes('unsplash.com') ? item.image : fallbackImg;

            return `
                <div class="glass-card overflow-hidden flex flex-col animate-in">
                    <div class="h-56 overflow-hidden bg-gray-900">
                        <img src="${imgUrl}" 
                             alt="${item.title}" 
                             class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                             onerror="this.onerror=null; this.src='${fallbackImg}';">
                    </div>
                    <div class="p-6 flex-grow">
                        <span class="${accent} text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">${item.category}</span>
                        <h3 class="text-xl font-bold mb-3 leading-snug">${item.title}</h3>
                        <p class="text-gray-400 text-sm leading-relaxed line-clamp-3">${item.fact}</p>
                    </div>
                    <div class="p-6 pt-0 mt-auto">
                        <button onclick="openDetail(${item.id})" class="text-white text-sm font-bold flex items-center gap-2 hover:gap-4 transition-all group">
                            Leer más <span class="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (append) {
            grid.insertAdjacentHTML('beforeend', html);
        } else {
            grid.innerHTML = html;
        }

        // Add "Load More" button if there are more items
        updateLoadMoreButton(items.length);
    }

    function updateLoadMoreButton(totalItems) {
        let btn = document.getElementById('load-more');
        if (currentPage * itemsPerPage < totalItems) {
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'load-more';
                btn.className = 'col-span-full mt-12 py-4 px-10 rounded-full border border-white/10 hover:bg-white/5 font-bold transition-all';
                btn.innerText = 'Cargar más descubrimientos';
                btn.onclick = () => {
                    currentPage++;
                    const cat = document.querySelector('.filter-btn.active').dataset.category;
                    const filtered = cat === 'all' ? curiosities : curiosities.filter(c => c.category === cat);
                    renderGrid(filtered, true);
                };
                grid.after(btn);
            }
        } else {
            if (btn) btn.remove();
        }
    }

    // Load Curiosities with artificial delay for skeleton demo
    async function loadCuriosities() {
        try {
            // Skeleton will show while this waits
            const data = await API.getCuriosities();
            setTimeout(() => {
                curiosities = data;
                renderGrid(curiosities);
            }, 600); // Small delay to appreciate skeletons
        } catch (error) {
            grid.innerHTML = '<p class="error">Error loading chronicles.</p>';
        }
    }

    // Filter Logic
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => {
                b.classList.remove('active', 'bg-cyan-400', 'text-black');
                b.classList.add('bg-white/5', 'text-gray-400');
            });
            btn.classList.add('active', 'bg-cyan-400', 'text-black');
            btn.classList.remove('bg-white/5', 'text-gray-400');

            currentPage = 1; // Reset to page 1
            const cat = btn.dataset.category;
            const filtered = cat === 'all' ? curiosities : curiosities.filter(c => c.category === cat);
            renderGrid(filtered);
        });
    });

    // Open Modal
    window.openDetail = async (id) => {
        const item = curiosities.find(c => c.id === id);
        if (!item) return;

        const colors = {
            'Ciencia': 'text-cyan-400',
            'Espacio': 'text-purple-400',
            'Animales': 'text-green-400',
            'Naturaleza': 'text-orange-400',
            'Cuerpo Humano': 'text-red-400'
        };
        const accent = colors[item.category] || 'text-cyan-400';

        const fallbackImg = `https://images.unsplash.com/photo-1532187875605-1fc6367b913e?auto=format&fit=crop&q=80&w=800&sig=${item.id}`;
        const imgUrl = item.image && item.image.includes('unsplash.com') ? item.image : fallbackImg;

        modalBody.innerHTML = `
            <div class="animate-in">
                <div class="h-80 md:h-[450px] w-[calc(100%+6rem)] -ml-12 -mt-12 mb-10 overflow-hidden relative bg-gray-900">
                    <img src="${imgUrl}" 
                         class="w-full h-full object-cover" 
                         onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent"></div>
                </div>
                <span class="${accent} text-xs font-bold uppercase tracking-[0.3em] mb-4 block">${item.category}</span>
                <h2 class="playfair text-4xl md:text-6xl mb-8 leading-tight">${item.title}</h2>
                <div class="prose prose-invert max-w-none mb-12">
                    <p class="text-xl text-gray-300 leading-relaxed font-light">${item.fact}</p>
                </div>
                
                ${item.links ? `
                    <div class="links-section">
                        <h4 class="text-xs font-extrabold text-cyan-400 uppercase tracking-widest mb-4">Bibliografía y Fuentes</h4>
                        <ul class="space-y-3">
                            ${item.links.map(link => `
                                <li>
                                    <a href="${link}" target="_blank" rel="noopener" class="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                        <span class="text-cyan-400">⚡</span> ${new URL(link).hostname}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            
            <div class="comments-section mt-12 pt-12 border-t border-white/10">
                <h3 class="text-2xl font-bold mb-8">Comentarios</h3>
                <div id="comment-auth-msg" class="bg-cyan-400/10 text-cyan-400 p-6 rounded-2xl mb-8 hidden">
                    Necesitas <button onclick="toggleModal('login-modal')" class="font-bold underline">Iniciar Sesión</button> para compartir tus pensamientos.
                </div>
                <form id="comment-form" class="space-y-4 mb-12">
                    <textarea id="text" placeholder="Escribe tu pensamiento..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 h-32 outline-none focus:border-cyan-400" required></textarea>
                    <button type="submit" class="btn-glow px-8 py-3 rounded-full font-bold w-full md:w-auto">Publicar Pensamiento</button>
                </form>
                <div id="comment-list" class="space-y-6">
                    Cargando comentarios...
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Back button support for curiosity detail
        history.pushState({ modalId: 'detail-modal' }, "");

        // Check Auth for Comments
        const user = localStorage.getItem('user');
        const authMsg = document.getElementById('comment-auth-msg');
        const commentForm = document.getElementById('comment-form');

        if (!user) {
            authMsg.classList.remove('hidden');
            commentForm.classList.add('hidden');
        }

        // Load existing comments
        loadComments(id);

        // Handle Comment Submission
        commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const text = document.getElementById('text').value;
            const token = localStorage.getItem('token');

            try {
                const res = await fetch(`/api/comments/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text })
                });

                if (res.ok) {
                    commentForm.reset();
                    loadComments(id);
                } else {
                    const data = await res.json();
                    alert(data.error || 'Error al publicar');
                }
            } catch (error) {
                alert('Error de conexión');
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

    window.closeModal = () => {
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            if (history.state && (history.state.modalId === 'modal' || history.state.modalId === 'detail-modal')) {
                history.back();
            }
        }
    };

    window.onpopstate = (event) => {
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        if (modal) modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            window.closeSpecificModal(e.target.id);
            if (history.state) history.back();
        }
        if (e.target === modal) {
            window.closeModal();
        }
    };


    // Marquee Logic
    function initMarquee(items) {
        const content = document.getElementById('marquee-content');
        if (!content) return;

        // Take a random sample of 20 items to keep it readable and performant
        const sample = [...items].sort(() => 0.5 - Math.random()).slice(0, 20);

        const facts = sample.map(i => `<div class="marquee-item"><span>💡 SABÍAS QUE:</span> ${i.fact}</div>`).join('');
        // Double the content for smooth infinite loop
        content.innerHTML = facts + facts;
    }

    // Weather Logic (Open-Meteo + Reverse Geocoding)
    const DEFAULT_CITY = 'Montevideo';
    const DEFAULT_LAT = -34.9011;
    const DEFAULT_LON = -56.1645;

    async function fetchWeather(lat, lon, overrideCity = null) {
        const finalLat = (lat !== null && lat !== undefined) ? lat : DEFAULT_LAT;
        const finalLon = (lon !== null && lon !== undefined) ? lon : DEFAULT_LON;
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m`;

        console.log(`Buscando clima en coord: ${finalLat}, ${finalLon}`);

        // Try to get city name in parallel or use default
        let cityName = overrideCity || DEFAULT_CITY;

        const weatherPromise = fetch(apiUrl).then(r => r.json());

        // Geocoding promise (parallel)
        const geoPromise = (lat !== null && lon !== null && !overrideCity)
            ? fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CurioSphere/1.1' }
            }).then(r => r.json()).catch(() => null)
            : Promise.resolve(null);

        try {
            const [weatherData, geoData] = await Promise.all([weatherPromise, geoPromise]);

            if (geoData && !geoData.error && geoData.address) {
                const a = geoData.address;
                // Prioritize city-level labels over street-level labels
                cityName = a.city || a.town || a.village || a.municipality || a.suburb || a.county ||
                    geoData.display_name?.split(',')[0] || cityName;
            } else if (geoData && geoData.error) {
                console.warn("Nominatim error:", geoData.error);
            }

            if (weatherData && (weatherData.current_weather || weatherData.weather_code !== undefined)) {
                updateWeatherUI(weatherData, cityName);
                console.log(`Clima cargado en ${cityName}`);
            }
        } catch (error) {
            console.error("Error en servicio meteorológico:", error);
            const tempEl = document.getElementById('nav-weather-temp');
            if (tempEl && tempEl.textContent === '--°C') {
                tempEl.textContent = 'Error';
            }
        }
    }

    function updateWeatherUI(data, cityName) {
        const weather = data.current_weather || data;
        if (!weather || (weather.temperature === undefined && data.temperature === undefined)) return;

        const temp = weather.temperature !== undefined ? weather.temperature : data.temperature;
        const t = Math.round(temp);
        const wCode = (weather.weathercode !== undefined) ? weather.weathercode : weather.weather_code;

        // Mapping Open-Meteo codes to icons
        const iconMap = {
            0: '01d', 1: '02d', 2: '03d', 3: '04d',
            45: '50d', 48: '50d',
            51: '09d', 53: '09d', 55: '09d',
            61: '10d', 63: '10d', 65: '10d',
            71: '13d', 73: '13d', 75: '13d',
            80: '09d', 81: '09d', 82: '09d',
            95: '11d'
        };
        const iconCode = iconMap[wCode] || '03d';
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        // Nav Widget
        const navIcon = document.getElementById('nav-weather-icon');
        if (navIcon) {
            navIcon.src = iconUrl;
            navIcon.classList.remove('hidden');
        }
        document.getElementById('nav-weather-city').textContent = cityName;
        document.getElementById('nav-weather-temp').textContent = `${t}°C`;

        // Full Widget
        const fullIcon = document.getElementById('icono-full');
        if (fullIcon) {
            fullIcon.src = iconUrl;
            document.getElementById('ciudad-full').textContent = cityName.toUpperCase();
            document.getElementById('temp-full').textContent = `${t}°C`;

            const descMap = { 0: 'Despejado', 1: 'Casi despejado', 2: 'Algo nublado', 3: 'Nublado', 45: 'Niebla', 61: 'Lluvia leve', 95: 'Tormenta' };
            document.getElementById('desc-full').textContent = descMap[wCode] || 'Condiciones variables';

            // Getting humidity from hourly (approx)
            const humidity = data.hourly ? data.hourly.relativehumidity_2m[0] : '--';
            document.getElementById('humedad-full').textContent = `${humidity}%`;
            document.getElementById('viento-full').textContent = `${weather.windspeed} km/h`;

            // Dynamic Background based on temp
            const glow = document.getElementById('widget-glow');
            if (t <= 13) glow.style.background = 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)';
            else if (t <= 22) glow.style.background = 'linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)';
            else if (t <= 29) glow.style.background = 'linear-gradient(180deg, #f6d365 0%, #fda085 100%)';
            else glow.style.background = 'linear-gradient(180deg, #ff0844 0%, #ffb199 100%)';
            glow.style.opacity = '0.3';
        }
    }

    function initWeather() {
        console.log("Iniciando servicio de clima...");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log(`Coords obtenidas: ${pos.coords.latitude}, ${pos.coords.longitude}`);
                    fetchWeather(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn("Geolocalización rechazada o fallida:", err.message);
                    fetchWeather(null, null, DEFAULT_CITY);
                },
                { timeout: 10000 }
            );
        } else {
            console.warn("Navegador no soporta geolocalización");
            fetchWeather(null, null, DEFAULT_CITY);
        }

        // Refresh every 15 mins
        setInterval(() => {
            const currentCity = document.getElementById('nav-weather-city').textContent;
            fetchWeather(null, null, currentCity);
        }, 900000);
    }



    window.botMessage = (e) => {
        if (e.key === 'Enter') {
            const input = e.target;
            const msg = input.value.toLowerCase();
            const container = document.getElementById('bot-messages');

            // Mad Scientist logic
            const introductions = [
                "¡MWAHAHA! ¡Mis experimentos dicen que... ",
                "¡Eureka! ¡Has activado mi comunicador cuántico! ",
                "¡Cuidado con las pociones! Pero mira esto: ",
                "¡Por los pelos de Einstein! Escucha bien: "
            ];

            let response = "¡No me interrumpas, estoy mezclando plutonio! Pero si insistes... pregunta sobre átomos, viajes en el tiempo o bichejos raros.";

            if (msg.includes('ciencia') || msg.includes('atomo'))
                response = "¡Átomos! ¿Sabías que somos un 99% espacio vacío? Si quitáramos el espacio, ¡toda la humanidad cabría en una manzana! 🍎⚡";

            if (msg.includes('animal') || msg.includes('bicho') || msg.includes('mar'))
                response = "¡Bestias fascinantes! ¿Sabías que los pulpos tienen 3 corazones y sangre azul? ¡Y la medusa inmortal puede resetear su vida! ¡He intentado inyectarme su ADN pero solo me dio hambre de plancton! 🐙💧";

            if (msg.includes('espacio') || msg.includes('marte') || msg.includes('luna'))
                response = "¡El cosmos es aterrador! En Marte los atardeceres son azules y en la Luna tus huellas durarán millones de años porque no hay viento. ¡MWAHAHA! 🌌🌚";

            if (msg.includes('cuerpo') || msg.includes('bio'))
                response = "¡Máquinas biológicas! Generas electricidad suficiente para una bombilla y tus ácidos estomacales podrían disolver metal. ¡Impresionante! 🧠⚡";

            if (msg.includes('historia') || msg.includes('tiempo'))
                response = "¡El tiempo es relativo! ¿Sabías que los vikingos nunca usaron cascos con cuernos? ¡Fue un invento de la ópera del siglo XIX! 🎭🕰️";

            if (msg.includes('hola') || msg.includes('quien'))
                response = "¡Soy el Dr. Curioso! El científico más brillante (y algo despeinado) de este servidor. ¡Pregúntame sobre el espacio, animales o el cuerpo humano! 🧪💥";

            const randomIntro = introductions[Math.floor(Math.random() * introductions.length)];

            container.innerHTML += `<div class="msg-user"><b>Tú:</b> ${input.value}</div>`;
            container.innerHTML += `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ${randomIntro}${response}</div>`;
            input.value = '';
            container.scrollTop = container.scrollHeight;
        }
    }

    // --- AUTH FRONTEND ---
    const checkAuth = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const btns = document.getElementById('auth-buttons');
        const info = document.getElementById('user-info');
        const nameText = document.getElementById('user-name');
        const adminBtn = document.getElementById('admin-btn');

        if (user) {
            btns.classList.add('hidden');
            info.classList.remove('hidden');
            nameText.innerText = user.name;
            if (user.role === 'admin') adminBtn.classList.remove('hidden');
        } else {
            btns.classList.remove('hidden');
            info.classList.add('hidden');
            adminBtn.classList.add('hidden');
        }
    };

    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    };

    // Forms
    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const [name, email, password] = e.target.querySelectorAll('input');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.value, email: email.value, password: password.value })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                localStorage.setItem('temp_email', email.value);
                toggleModal('register-modal');
                toggleModal('verify-modal');
            } else alert(data.error);
        } catch (err) { alert('Error al registrar'); }
    };

    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const [email, password] = e.target.querySelectorAll('input');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.value, password: password.value })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.reload();
            } else alert(data.error);
        } catch (err) { alert('Error al entrar'); }
    };

    window.verifyEmail = async () => {
        const email = localStorage.getItem('temp_email');
        const token = document.getElementById('verify-token').value;
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                toggleModal('verify-modal');
                toggleModal('login-modal');
            } else alert(data.error);
        } catch (err) { alert('Error al verificar'); }
    };

    // Admin
    window.openAdmin = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                renderAdmin(data);
                toggleModal('admin-modal');
            } else alert(data.error);
        } catch (err) { alert('Error al cargar dashboard'); }
    };

    const renderAdmin = (data) => {
        const uList = document.getElementById('admin-users-list');
        const aList = document.getElementById('admin-actions-list');

        uList.innerHTML = data.users.map(u => `
            <div class="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                <div>
                    <p class="font-bold">${u.name}</p>
                    <p class="text-[10px] text-gray-500">${u.email}</p>
                </div>
                <div class="flex gap-2">
                    <span class="text-[8px] px-2 py-1 rounded ${u.verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">${u.verified ? 'VERIFICADO' : 'PENDIENTE'}</span>
                    <span class="text-[8px] px-2 py-1 rounded bg-red-400 text-black font-bold">${u.role}</span>
                </div>
            </div>
        `).join('');

        aList.innerHTML = data.actions.map(a => `
            <div class="border-l border-white/10 pl-3 py-1 mb-2">
                <span class="text-gray-500">${new Date(a.timestamp).toLocaleTimeString()}</span>
                <span class="text-cyan-400 mx-2">${a.email}:</span>
                <span class="text-gray-300">${a.action}</span>
            </div>
        `).join('');
    };

    checkAuth();
    initWeather();
    loadCuriosities();

    // Auto-update Marquee every few items
    API.getCuriosities().then(data => initMarquee(data));
});

// --- GAMES LOGIC ---
function startQuiz() {
    const board = document.getElementById('game-board');
    const selection = document.getElementById('game-selection');
    selection.classList.add('hidden');
    board.classList.remove('hidden');

    const questions = [
        { q: "¿Cuántos corazones tiene un pulpo?", a: ["1", "2", "3", "4"], correct: 2 },
        { q: "¿Qué planeta tiene un día más largo que su año?", a: ["Marte", "Venus", "Júpiter", "Saturno"], correct: 1 },
        { q: "¿De qué color es el atardecer en Marte?", a: ["Rojo", "Verde", "Azul", "Amarillo"], correct: 2 }
    ];

    let current = 0;

    const showQuestion = () => {
        if (current >= questions.length) {
            const secretFacts = [
                "¡DATO SECRETO! ¿Sabías que los astronautas crecen hasta 5 cm en el espacio? 👨‍🚀",
                "¡DATO SECRETO! Existe una nube de alcohol en el espacio que mide 463 mil millones de km. 🍺🌌",
                "¡DATO SECRETO! Las ovejas pueden reconocer caras humanas. 🐑📸"
            ];
            const reward = secretFacts[Math.floor(Math.random() * secretFacts.length)];
            board.innerHTML = `
                <h3 style="color:#22c55e">¡EUREKA! HAS GANADO</h3>
                <div class="links-section" style="margin-top:1rem">
                    <p><b>Recompensa del Dr. Curioso:</b></p>
                    <p>${reward}</p>
                </div>
                <button onclick="location.reload()" class="btn-game" style="margin-top:1rem">Volver al Inicio</button>
            `;
            return;
        }
        const q = questions[current];
        board.innerHTML = `
            <h3>${q.q}</h3>
            ${q.a.map((opt, i) => `<button class="quiz-option" onclick="checkAnswer(${i}, ${q.correct})">${opt}</button>`).join('')}
        `;
    };

    window.checkAnswer = (idx, correct) => {
        if (idx === correct) {
            alert("¡EUREKA! Correcto.");
            current++;
            showQuestion();
        } else {
            alert("¡BOOM! Error. Inténtalo de nuevo, humano.");
        }
    };

    showQuestion();
}

function startMemory() {
    const board = document.getElementById('game-board');
    const selection = document.getElementById('game-selection');
    selection.classList.add('hidden');
    board.classList.remove('hidden');

    const icons = ['🧬', '🧬', '🧪', '🧪', '🧠', '🧠', '🌌', '🌌', '🐙', '🐙', '🦖', '🦖'];
    const shuffled = icons.sort(() => Math.random() - 0.5);

    board.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            ${shuffled.map((icon, i) => `
                <div class="card glass memory-card" style="height: 100px; display: flex; align-items: center; justify-content: center; font-size: 2rem; cursor: pointer;" onclick="flipCard(this, '${icon}')">
                    ❓
                </div>
            `).join('')}
        </div>
        <button onclick="location.reload()" class="btn-game" style="margin-top:20px">Reiniciar</button>
    `;

    let flipped = [];
    window.flipCard = (el, icon) => {
        if (flipped.length < 2 && !el.classList.contains('matched')) {
            el.innerText = icon;
            flipped.push({ el, icon });
            if (flipped.length === 2) {
                if (flipped[0].icon === flipped[1].icon) {
                    flipped.forEach(f => f.el.classList.add('matched'));
                    flipped = [];
                    checkWin();
                } else {
                    setTimeout(() => {
                        flipped.forEach(f => f.el.innerText = '❓');
                        flipped = [];
                    }, 1000);
                }
            }
        }
    };

    const checkWin = () => {
        const remaining = document.querySelectorAll('.memory-card:not(.matched)');
        if (remaining.length === 0) {
            const biologoySecrets = [
                "¡DATO SECRETO! Las vacas tienen mejores amigas y se estresan si las separan. 🐄❤️",
                "¡DATO SECRETO! Los lobos aúllan con tonos diferentes para que otros lobos sepan quiénes son. 🐺🎶",
                "¡DATO SECRETO! Las ratas se ríen cuando les haces cosquillas. 🐀😂"
            ];
            const reward = biologoySecrets[Math.floor(Math.random() * biologoySecrets.length)];
            board.innerHTML = `
                <h3 style="color:#22c55e">¡MEMORIA DE ELEFANTE!</h3>
                <div class="links-section" style="margin-top:1rem">
                    <p><b>Recompensa biológica:</b></p>
                    <p>${reward}</p>
                </div>
                <button onclick="location.reload()" class="btn-game" style="margin-top:1rem">Volver al Inicio</button>
            `;
        }
    };
}

function startAtomHunter() {
    const board = document.getElementById('game-board');
    const selection = document.getElementById('game-selection');
    selection.classList.add('hidden');
    board.classList.remove('hidden');

    let score = 0;
    let totalAtoms = 10;

    board.innerHTML = `
        <h3 class="text-cyan-400 font-bold mb-4">Caza 10 Átomos Inestables</h3>
        <p class="text-sm text-gray-500 mb-4">¡Rápido, antes de que desaparezcan!</p>
        <div id="atom-field" class="relative w-full h-[300px] bg-black/20 rounded-2xl overflow-hidden cursor-crosshair">
            <div id="atom" class="absolute w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,242,255,0.5)] transition-all duration-200" onclick="hitAtom()">⚛️</div>
        </div>
        <p class="mt-4">Puntuación: <span id="atom-score">0</span> / ${totalAtoms}</p>
    `;

    const atom = document.getElementById('atom');
    const field = document.getElementById('atom-field');

    function moveAtom() {
        const x = Math.random() * (field.clientWidth - 50);
        const y = Math.random() * (field.clientHeight - 50);
        atom.style.left = `${x}px`;
        atom.style.top = `${y}px`;
    }

    window.hitAtom = () => {
        score++;
        document.getElementById('atom-score').innerText = score;
        if (score >= totalAtoms) {
            board.innerHTML = `
                <h3 class="text-cyan-400 text-3xl font-bold mb-4">¡REFLEJOS CUÁNTICOS!</h3>
                <div class="links-section">
                    <p><b>Dato Químico Secreto:</b></p>
                    <p>¡Eres más rápido que un neutrón! ¿Sabías que los átomos son 99.99% espacio vacío? Si quitáramos el espacio de todos los humanos, cabríamos en un terrón de azúcar.</p>
                </div>
                <button onclick="location.reload()" class="btn-glow px-8 py-3 rounded-full mt-6">Volver</button>
            `;
        } else {
            moveAtom();
        }
    };
    moveAtom();
}

function startMathChallenge() {
    const board = document.getElementById('game-board');
    const selection = document.getElementById('game-selection');
    selection.classList.add('hidden');
    board.classList.remove('hidden');

    let current = 0;
    let questions = [];
    for (let i = 0; i < 5; i++) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        questions.push({ q: `${a} + ${b} = ?`, s: a + b });
    }

    function showMath() {
        if (current >= questions.length) {
            board.innerHTML = `
                <h3 class="text-orange-400 text-3xl font-bold mb-4">¡GENIO MATEMÁTICO!</h3>
                <div class="links-section text-left">
                    <p><b>Dato Matemático Secreto:</b></p>
                    <p>¿Sabías que el número 0 fue inventado independientemente por los Mayas y los Indios? Sin él, ¡la computación moderna no existiría!</p>
                </div>
                <button onclick="location.reload()" class="btn-glow px-8 py-3 rounded-full mt-6 text-white">Volver</button>
            `;
            return;
        }
        const q = questions[current];
        board.innerHTML = `
            <h3 class="text-2xl font-bold mb-6">${q.q}</h3>
            <input type="number" id="math-ans" class="bg-white/10 border border-cyan-400 p-4 rounded-xl text-center mb-6" autofocus>
            <br>
            <button onclick="checkMath(${q.s})" class="btn-glow px-10 py-3 rounded-full">Responder</button>
        `;
        document.getElementById('math-ans').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkMath(q.s);
        });
    }

    window.checkMath = (answer) => {
        const input = document.getElementById('math-ans').value;
        if (parseInt(input) === answer) {
            current++;
            showMath();
        } else {
            alert("¡Error de cálculo! Reintenta.");
        }
    };
    showMath();
}

function startGravitySort() {
    const board = document.getElementById('game-board');
    const selection = document.getElementById('game-selection');
    selection.classList.add('hidden');
    board.classList.remove('hidden');

    const planets = [
        { name: 'Sol', mass: 1000 },
        { name: 'Júpiter', mass: 500 },
        { name: 'Tierra', mass: 100 },
        { name: 'Marte', mass: 50 },
        { name: 'Luna', mass: 10 }
    ];
    let shuffled = [...planets].sort(() => Math.random() - 0.5);
    let userOrder = [];

    function renderSort() {
        board.innerHTML = `
            <h3 class="text-blue-400 font-bold mb-4">Gravedad Zero: Ordena por Masa</h3>
            <p class="text-xs text-gray-500 mb-6">(De menor a mayor peso)</p>
            <div class="flex flex-wrap justify-center gap-4 mb-8">
                ${shuffled.map(p => `<button onclick="pickPlanet('${p.name}')" class="px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-cyan-400 hover:text-black transition-all">${p.name}</button>`).join('')}
            </div>
            <div class="text-cyan-400 font-bold min-h-[40px]">
                ${userOrder.join(' < ')}
            </div>
            ${userOrder.length > 0 ? `<button onclick="resetSort()" class="text-xs text-red-400 mt-4 underline">Reiniciar selección</button>` : ''}
        `;

        if (userOrder.length === planets.length) {
            const correct = planets.slice().sort((a, b) => a.mass - b.mass).map(p => p.name).join(',');
            const user = userOrder.join(',');
            if (correct === user) {
                board.innerHTML = `
                    <h3 class="text-blue-400 text-3xl font-bold mb-4">¡MAESTRO ESTELAR!</h3>
                    <div class="links-section">
                        <p><b>Dato Cósmico Secreto:</b></p>
                        <p>¿Sabías que Júpiter es tan grande que dentro de él cabrían todos los demás planetas del sistema solar dos veces? ¡Es el rey de la gravedad!</p>
                    </div>
                    <button onclick="location.reload()" class="btn-glow px-8 py-3 rounded-full mt-6">Volver</button>
                `;
            } else {
                alert("El orden no es correcto... ¡La gravedad te ha fallado!");
                resetSort();
            }
        }
    }

    window.pickPlanet = (name) => {
        if (!userOrder.includes(name)) {
            userOrder.push(name);
            shuffled = shuffled.filter(p => p.name !== name);
            renderSort();
        }
    };

    window.resetSort = () => {
        userOrder = [];
        shuffled = [...planets].sort(() => Math.random() - 0.5);
        renderSort();
    };

    renderSort();
}
