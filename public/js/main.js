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
            initMarquee(curiosities);
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
            ${item.links ? `
                <div class="links-section">
                    <h4>Fuentes y Más Información:</h4>
                    <ul>
                        ${item.links.map(link => `<li><a href="${link}" target="_blank" rel="noopener">${link}</a></li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
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


    // Marquee Logic
    function initMarquee(items) {
        const content = document.getElementById('marquee-content');
        const facts = items.map(i => `<div class="marquee-item"><span>💡 SABÍAS QUE:</span> ${i.fact}</div>`).join('');
        // Double the content for smooth infinite loop
        content.innerHTML = facts + facts;
    }

    // Weather Logic
    async function initWeather() {
        const weatherCity = document.getElementById('weather-city');
        const weatherTemp = document.getElementById('weather-temp');
        const weatherDesc = document.getElementById('weather-desc');

        // Fallback to a fixed location if geolocation fails or is denied (e.g. Madrid)
        const defaultLat = 40.4168;
        const defaultLon = -3.7038;

        const updateWeather = async (lat, lon, label = "Tu ubicación") => {
            try {
                const data = await API.getWeather(lat, lon);
                const weather = data.current_weather;
                const codes = {
                    0: '☀️ Despejado', 1: '🌤️ Mayormente despejado', 2: '⛅ Parcialmente nublado', 3: '☁️ Nublado',
                    45: '🌫️ Niebla', 61: '🌦️ Lluvia ligera', 80: '🌧️ Chubascos'
                };

                weatherCity.innerText = label;
                weatherTemp.innerText = `${weather.temperature}°C`;
                weatherDesc.innerText = codes[weather.weathercode] || '☁️ Nublado';
            } catch (e) {
                weatherCity.innerText = "Clima no disponible";
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => updateWeather(position.coords.latitude, position.coords.longitude),
                () => updateWeather(defaultLat, defaultLon, "Madrid (Default)")
            );
        } else {
            updateWeather(defaultLat, defaultLon, "Madrid (Default)");
        }
    }

    // Bot Logic
    window.toggleBot = () => {
        const chat = document.getElementById('bot-chat');
        const container = document.getElementById('bot-messages');
        chat.classList.toggle('active');

        if (chat.classList.contains('active') && container.innerHTML === "") {
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

            if (msg.includes('animal') || msg.includes('bicho'))
                response = "¡Criaturas fascinantes! El oso de agua (tardígrado) puede sobrevivir en el vacío del espacio. ¡He intentado crear uno gigante pero se escapó! 🔬🌌";

            if (msg.includes('historia') || msg.includes('tiempo'))
                response = "¡El tiempo es relativo! ¿Sabías que los vikingos nunca usaron cascos con cuernos? ¡Fue un invento de la ópera del siglo XIX! 🎭🕰️";

            if (msg.includes('hola') || msg.includes('quien'))
                response = "¡Soy el Dr. Curioso! El científico más brillante (y algo despeinado) de este servidor. ¡Pregúntame algo antes de que explote mi laboratorio! 🧪💥";

            const randomIntro = introductions[Math.floor(Math.random() * introductions.length)];

            container.innerHTML += `<div class="msg-user"><b>Tú:</b> ${input.value}</div>`;
            container.innerHTML += `<div class="msg-bot"><b>Dr. Curioso 🧪:</b> ${randomIntro}${response}</div>`;
            input.value = '';
            container.scrollTop = container.scrollHeight;
        }
    }

    initWeather();
    loadCuriosities();
});
