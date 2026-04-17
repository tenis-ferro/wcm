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
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function renderMatches(data) {
        grid.innerHTML = '';
        data.forEach(match => {
            const clone = template.content.cloneNode(true);
            
            const badge = clone.querySelector('.category-badge');
            badge.textContent = match.Categoria;

            const cleanCat = match.Categoria.toLowerCase().trim();
            badge.className = `category-badge cat-${cleanCat}`;           

            badge.classList.add(`cat-${match.Categoria.toLowerCase().replace(/\s/g, '')}`);
            
            clone.querySelector('.match-date').textContent = new Date(match.Fecha).toLocaleDateString('es-CL', {day:'2-digit', month:'short'});
            
            const p1 = clone.querySelector('.p1');
            const p2 = clone.querySelector('.p2');
            p1.querySelector('.player-name').textContent = match["Jugador 1"];
            p2.querySelector('.player-name').textContent = match["Jugador 2"];

            if (match.Ganador === match["Jugador 1"]) p1.classList.add('is-winner');
            if (match.Ganador === match["Jugador 2"]) p2.classList.add('is-winner');

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
        const filtered = allMatches.filter(m => {
            const mCat = cat === "" || m.Categoria.toLowerCase() === cat;
            const mSearch = m["Jugador 1"].toLowerCase().includes(search) || m["Jugador 2"].toLowerCase().includes(search);
            return mCat && mSearch;
        });
        renderMatches(filtered);
        updateStats(filtered);
    }

    categoryFilter.addEventListener('change', filterData);
    searchInput.addEventListener('input', filterData);
    init();
});