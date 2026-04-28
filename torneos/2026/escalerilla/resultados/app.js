const url = "https://script.google.com/macros/s/AKfycbwqKfF8SWCBHTWnnUWXGRBPJc5TKXkKJvzz8qEhBZjmAfaUc_pgIUukU-LMsKWbDFHY/exec?path=Partidos-Grupo&action=read";

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('matchGrid');
    const template = document.getElementById('matchTemplate');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('matchModal');
    
    let allMatches = [];

    async function init() {
        try {
            const response = await fetch(url);
            const json = await response.json();

            const rawData = json.data || [];
                    
            allMatches = rawData
                .filter(match => {
                    // Verificamos que todos los campos requeridos existan y no estén vacíos
                    return match.Nro && 
                        match["Jugador 1"] && 
                        match["Jugador 2"] && 
                        match.Ganador && 
                        match.Resultado &&
                        match["Jugador 1"].trim() !== "" &&
                        match["Jugador 2"].trim() !== "" &&
                        match.Resultado.trim() !== "";
                })
                .sort((a, b) => b.Nro - a.Nro);

            console.log(allMatches);
            renderMatches(allMatches);
            updateStats(allMatches);
        } catch (error) {
            console.error('Error:', error);
            if (grid) grid.innerHTML = '<div>Error al cargar resultados.</div>';
        }
    }

    function obtenerNombreCorto(nombre) {
        if (!nombre) return "";
        const partes = nombre.trim().split(/\s+/);
        return partes.length < 2 ? nombre : `${partes[0].charAt(0)}.${partes.slice(1).join(" ")}`;
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

    function renderMatches(data) {
        if (!grid || !template) return;
        grid.innerHTML = '';
        data.forEach(match => {
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('.match-row');
            
            const badge = clone.querySelector('.category-badge');
            badge.textContent = match.Categoria;
            const cleanCat = match.Categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
            badge.classList.add(`cat-${cleanCat}`);

            if (match.Fecha) {
                const dateObj = new Date(match.Fecha);
                clone.querySelector('.match-date').textContent = dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
            }

            const p1Block = clone.querySelector('.p1');
            const p2Block = clone.querySelector('.p2');
            const p1Name = match["Jugador 1"];
            const p2Name = match["Jugador 2"];

            const htmlNombre = (n) => `<span class="full-name">${n}</span><span class="short-name">${obtenerNombreCorto(n)}</span>`;
            p1Block.querySelector('.player-name').innerHTML = htmlNombre(p1Name);
            p2Block.querySelector('.player-name').innerHTML = htmlNombre(p2Name);

            if (match.Ganador === p1Name) p1Block.classList.add('is-winner');
            if (match.Ganador === p2Name) p2Block.classList.add('is-winner');

            clone.querySelector('.score-value').textContent = match.Resultado;
            row.addEventListener('click', () => abrirModal(match));
            grid.appendChild(clone);
        });
    }

    function abrirModal(match) {
        document.getElementById('modalCat').textContent = match.Categoria;
        document.getElementById('modalDate').textContent = new Date(match.Fecha).toLocaleDateString('es-CL', { dateStyle: 'full' });
        document.getElementById('p1Name').textContent = match["Jugador 1"];
        document.getElementById('p2Name').textContent = match["Jugador 2"];
        document.getElementById('finalScore').textContent = match.Resultado;
        modal.style.display = 'flex';
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
    }

    categoryFilter.addEventListener('change', filterData);
    searchInput.addEventListener('input', filterData);
    document.querySelector('.close-modal')?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    init();
});