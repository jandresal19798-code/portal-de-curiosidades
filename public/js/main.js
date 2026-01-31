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
        grid.innerHTML = items.slice(0, 8).map(item => `
            <div class="daily-card" onclick="openDetail(${item.id})">
                <img src="${item.image}" alt="${item.title}">
                <h4>${item.title}</h4>
            </div>
        `).join('');

        // Render Trending Sidebar
        const sidebar = document.getElementById('trending-list');
        if (sidebar) {
            sidebar.innerHTML = items.slice(8, 13).map(item => `
                <div class="trending-item">
                    <img src="${item.image}" alt="thumb" class="trending-thumb">
                    <p>${item.title}</p>
                </div>
            `).join('');
        }
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

    initWeather();
    loadCuriosities();
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
