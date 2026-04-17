/**
 * Tenis Ferro v4.0 - Final Version
 * - Nombres responsivos (Full en PC / Inicial en Móvil)
 * - Modal Detalle estilo ATP
 * - Estadísticas y Filtros en tiempo real
 */

const url = "https://script.google.com/macros/s/AKfycbwqKfF8SWCBHTWnnUWXGRBPJc5TKXkKJvzz8qEhBZjmAfaUc_pgIUukU-LMsKWbDFHY/exec?path=Partidos-Grupo&action=read";

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('matchGrid');
    const template = document.getElementById('matchTemplate');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('matchModal');
    
    let allMatches = [];

    /**
     * Inicialización y Carga de Datos
     */
    async function init() {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const json = await response.json();
            
            // Orden descendente (últimos partidos primero)
            allMatches = (json.data || []).sort((a, b) => b.Nro - a.Nro);
            
            renderMatches(allMatches);
            updateStats(allMatches);
        } catch (error) {
            console.error('Error al cargar:', error);
            if (grid) grid.innerHTML = '<div class="p-4">Error al conectar con los resultados.</div>';
        }
    }

    /**
     * Formatea el nombre para versión móvil (J. Olivares)
     */
    function obtenerNombreCorto(nombre) {
        if (!nombre) return "";
        const partes = nombre.trim().split(/\s+/);
        if (partes.length < 2) return nombre;
        return `${partes[0].charAt(0).toUpperCase()}.${partes.slice(1).join(" ")}`;
    }

    /**
     * Actualiza Píldoras de Estadísticas
     */
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

    /**
     * Renderiza la Lista de Partidos
     */
    function renderMatches(data) {
        if (!grid || !template) return;
        grid.innerHTML = '';

        data.forEach(match => {
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('.match-row');

            // 1. Configurar Categoría y Fecha
            const badge = clone.querySelector('.category-badge');
            badge.textContent = match.Categoria;
            
            const cleanCat = match.Categoria.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, '');
            badge.classList.add(`cat-${cleanCat}`);

            if (match.Fecha) {
                const dateObj = new Date(match.Fecha);
                clone.querySelector('.match-date').textContent = dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
            }

            // 2. Configurar Jugadores (Doble versión para CSS responsivo)
            const p1Name = match["Jugador 1"];
            const p2Name = match["Jugador 2"];
            const p1Block = clone.querySelector('.p1');
            const p2Block = clone.querySelector('.p2');

            const crearHtmlNombre = (n) => {
                return `<span class="full-name">${n}</span><span class="short-name">${obtenerNombreCorto(n)}</span>`;
            };

            p1Block.querySelector('.player-name').innerHTML = crearHtmlNombre(p1Name);
            p2Block.querySelector('.player-name').innerHTML = crearHtmlNombre(p2Name);

            // Ganadores
            if (match.Ganador === p1Name) p1Block.classList.add('is-winner');
            if (match.Ganador === p2Name) p2Block.classList.add('is-winner');

            // 3. Resultado
            clone.querySelector('.score-value').textContent = match.Resultado;

            // 4. EVENTO CLICK: Abrir Modal ATP
            row.addEventListener('click', () => abrirModal(match));

            grid.appendChild(clone);
        });
    }

    /**
     * Lógica del Modal Detalle
     */
    function abrirModal(match) {
        if (!modal) return;
        
        document.getElementById('modalCat').textContent = match.Categoria;
        document.getElementById('modalDate').textContent = new Date(match.Fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('p1Name').textContent = match["Jugador 1"];
        document.getElementById('p2Name').textContent = match["Jugador 2"];
        document.getElementById('finalScore').textContent = match.Resultado;

        modal.style.display = 'flex';
    }

    /**
     * Filtro de búsqueda y categoría
     */
    function filterData() {
        const cat = categoryFilter.value.toLowerCase();
        const search = searchInput.value.toLowerCase();

        const filtered = allMatches.filter(m => {
            const matchCat = cat === "" || m.Categoria.toLowerCase() === cat;
            const matchSearch = m["Jugador 1"].toLowerCase().includes(search) || 
                                m["Jugador 2"].toLowerCase().includes(search);
            return matchCat && matchSearch;
        });

        renderMatches(filtered);
        updateStats(filtered);
    }

    // --- EVENT LISTENERS ---
    categoryFilter.addEventListener('change', filterData);
    searchInput.addEventListener('input', filterData);

    // Cerrar Modal
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    init();
});