const url = "https://script.google.com/macros/s/AKfycbwqKfF8SWCBHTWnnUWXGRBPJc5TKXkKJvzz8qEhBZjmAfaUc_pgIUukU-LMsKWbDFHY/exec?path=Partidos-Grupo&action=read";

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('matchGrid');
    const template = document.getElementById('matchTemplate');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    let allMatches = [];

    async function init() {
        try {
            const response = await fetch(url);
            const json = await response.json();
            allMatches = (json.data || []).sort((a, b) => b.Nro - a.Nro);
            renderMatches(allMatches);
            updateStats(allMatches);
        } catch (e) {
            console.error("Error en init:", e);
        }
    }

    function obtenerNombreCorto(nombre) {
        if (!nombre) return "";
        const partes = nombre.trim().split(/\s+/);
        if (partes.length < 2) return nombre;
        return `${partes[0].charAt(0)}.${partes.slice(1).join(" ")}`;
    }

    function renderMatches(data) {
        if (!grid) return;
        grid.innerHTML = '';
        data.forEach(match => {
            const clone = template.content.cloneNode(true);
            
            // Categoría
            const badge = clone.querySelector('.category-badge');
            badge.textContent = match.Categoria;
            const cleanCat = match.Categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
            badge.classList.add(`cat-${cleanCat}`);
            
            // Fecha
            clone.querySelector('.match-date').textContent = new Date(match.Fecha).toLocaleDateString('es-CL', {day:'2-digit', month:'short'});

            // Jugadores (Lógica Responsiva)
            const p1 = clone.querySelector('.p1');
            const p2 = clone.querySelector('.p2');
            const name1 = match["Jugador 1"];
            const name2 = match["Jugador 2"];

            const crearHtmlNombre = (n) => {
                return `<span class="full-name">${n}</span><span class="short-name">${obtenerNombreCorto(n)}</span>`;
            };

            p1.querySelector('.player-name').innerHTML = crearHtmlNombre(name1);
            p2.querySelector('.player-name').innerHTML = crearHtmlNombre(name2);

            if (match.Ganador === name1) p1.classList.add('is-winner');
            if (match.Ganador === name2) p2.classList.add('is-winner');

            clone.querySelector('.score-value').textContent = match.Resultado;
            grid.appendChild(clone);
        });
    }

    function updateStats(data) {
        const container = document.getElementById('statsContainer');
        if (!container) return;
        const counts = data.reduce((acc, m) => {
            acc[m.Categoria] = (acc[m.Categoria] || 0) + 1;
            return acc;
        }, {});

        let html = `<div class="stat-card"><h3>Total</h3><p>${data.length}</p></div>`;
        Object.entries(counts).forEach(([cat, count]) => {
            html += `<div class="stat-card"><h3>${cat}</h3><p>${count}</p></div>`;
        });
        container.innerHTML = html;
    }

    function filterData() {
        const cat = categoryFilter.value.toLowerCase();
        const search = searchInput.value.toLowerCase();
        const filtered = allMatches.filter(m => 
            (cat === "" || m.Categoria.toLowerCase() === cat) &&
            (m["Jugador 1"].toLowerCase().includes(search) || m["Jugador 2"].toLowerCase().includes(search))
        );
        renderMatches(filtered);
        updateStats(filtered);
    }

    categoryFilter.addEventListener('change', filterData);
    searchInput.addEventListener('input', filterData);
    init();
});