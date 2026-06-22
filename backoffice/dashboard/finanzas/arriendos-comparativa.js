// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// ======================== GESTIÓN DE DATOS ========================
let allIngresosRaw = []; // Contiene todos los arriendos filtrados de los socios 86, 158, 269

// Cache keys matching consulta-movimientos-05.js
const CACHE_KEY_INGRESOS = "consulta_movimientos_ingresos";
const CACHE_KEY_TIMESTAMP = "consulta_movimientos_timestamp";
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

// Elementos DOM - Tab 1 (Comparación Profesores)
const profYearFilter = document.getElementById('profYearFilter');
const profTotalAmount = document.getElementById('profTotalAmount');
const profTotalCount = document.getElementById('profTotalCount');
const profMonthlyAvg = document.getElementById('profMonthlyAvg');
const profTableBody = document.getElementById('profTableBody');
const profTableFoot = document.getElementById('profTableFoot');

// Elementos DOM - Tab 2 (Historial)
const histSocioFilter = document.getElementById('histSocioFilter');
const histTotalAmount = document.getElementById('histTotalAmount');
const histTotalCount = document.getElementById('histTotalCount');
const histMonthlyAvg = document.getElementById('histMonthlyAvg');
const histTableBody = document.getElementById('histTableBody');
const histTableFoot = document.getElementById('histTableFoot');

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatCLP(value) {
    return Math.round(value).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// TAB 1: Agrupar datos de profesores (Socio 86, 158, 269) para un año seleccionado
function updateComparativaProfesores(year) {
    const matrix = {};
    for (let m = 1; m <= 12; m++) {
        matrix[m] = {
            86: { total: 0, count: 0 },
            158: { total: 0, count: 0 },
            269: { total: 0, count: 0 }
        };
    }

    let sumAll = 0;
    let countAll = 0;
    let activeMonths = 0;

    allIngresosRaw.forEach(ing => {
        if (Number(ing.anno) !== Number(year)) return;

        const m = ing.mes; // 1-12
        const socio = Number(ing.socio);
        const monto = ing.importe || 0;

        if (matrix[m] && matrix[m][socio]) {
            matrix[m][socio].total += monto;
            matrix[m][socio].count += 1;
            sumAll += monto;
            countAll += 1;
        }
    });

    // Calcular cantidad de meses activos en este año (donde algún profesor tenga actividad)
    for (let m = 1; m <= 12; m++) {
        const row = matrix[m];
        if (row[86].total > 0 || row[158].total > 0 || row[269].total > 0) {
            activeMonths++;
        }
    }

    const monthlyAvg = activeMonths > 0 ? sumAll / activeMonths : 0;

    // Renderizar stats
    profTotalAmount.innerHTML = `$${formatCLP(sumAll)}`;
    profTotalCount.innerText = countAll;
    profMonthlyAvg.innerHTML = `$${formatCLP(monthlyAvg)}`;

    // Renderizar cuerpo
    let tbodyHtml = '';
    for (let m = 1; m <= 12; m++) {
        const row = matrix[m];
        tbodyHtml += `
            <tr>
                <td>${MONTH_NAMES[m - 1]}</td>
                <td class="number-cell">$${formatCLP(row[86].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[86].count}</td>
                <td class="number-cell">$${formatCLP(row[158].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[158].count}</td>
                <td class="number-cell">$${formatCLP(row[269].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[269].count}</td>
            </tr>
        `;
    }
    profTableBody.innerHTML = tbodyHtml;

    // Calcular totales anuales por profesor
    const totals = {
        86: { total: 0, count: 0 },
        158: { total: 0, count: 0 },
        269: { total: 0, count: 0 }
    };
    for (let m = 1; m <= 12; m++) {
        for (const s of [86, 158, 269]) {
            totals[s].total += matrix[m][s].total;
            totals[s].count += matrix[m][s].count;
        }
    }

    profTableFoot.innerHTML = `
        <tr>
            <td>Total Anual</td>
            <td class="number-cell">$${formatCLP(totals[86].total)}</td>
            <td class="number-cell">${totals[86].count}</td>
            <td class="number-cell">$${formatCLP(totals[158].total)}</td>
            <td class="number-cell">${totals[158].count}</td>
            <td class="number-cell">$${formatCLP(totals[269].total)}</td>
            <td class="number-cell">${totals[269].count}</td>
        </tr>
    `;
}

// TAB 2: Agrupar datos de un profesor año a año (2023 a 2026)
function updateComparativaHistorico(socioIdFilter) {
    const matrix = {};
    for (let m = 1; m <= 12; m++) {
        matrix[m] = {
            2023: { total: 0, count: 0 },
            2024: { total: 0, count: 0 },
            2025: { total: 0, count: 0 },
            2026: { total: 0, count: 0 }
        };
    }

    let sumAll = 0;
    let countAll = 0;
    let activeMonths = 0;

    allIngresosRaw.forEach(ing => {
        if (socioIdFilter !== 'all' && Number(ing.socio) !== Number(socioIdFilter)) {
            return;
        }

        const m = ing.mes; // 1-12
        const y = ing.anno; // 2023-2026
        const monto = ing.importe || 0;

        if (matrix[m] && matrix[m][y]) {
            matrix[m][y].total += monto;
            matrix[m][y].count += 1;
            sumAll += monto;
            countAll += 1;
        }
    });

    for (let m = 1; m <= 12; m++) {
        for (const y of [2023, 2024, 2025, 2026]) {
            if (matrix[m][y].total > 0) {
                activeMonths++;
            }
        }
    }

    const monthlyAvg = activeMonths > 0 ? sumAll / activeMonths : 0;

    // Renderizar stats
    histTotalAmount.innerHTML = `$${formatCLP(sumAll)}`;
    histTotalCount.innerText = countAll;
    histMonthlyAvg.innerHTML = `$${formatCLP(monthlyAvg)}`;

    // Renderizar cuerpo
    let tbodyHtml = '';
    for (let m = 1; m <= 12; m++) {
        const row = matrix[m];
        tbodyHtml += `
            <tr>
                <td>${MONTH_NAMES[m - 1]}</td>
                <td class="number-cell">$${formatCLP(row[2023].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[2023].count}</td>
                <td class="number-cell">$${formatCLP(row[2024].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[2024].count}</td>
                <td class="number-cell">$${formatCLP(row[2025].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[2025].count}</td>
                <td class="number-cell">$${formatCLP(row[2026].total)}</td>
                <td class="number-cell" style="color: #5a6e62;">${row[2026].count}</td>
            </tr>
        `;
    }
    histTableBody.innerHTML = tbodyHtml;

    // Calcular totales anuales
    const totals = {
        2023: { total: 0, count: 0 },
        2024: { total: 0, count: 0 },
        2025: { total: 0, count: 0 },
        2026: { total: 0, count: 0 }
    };
    for (let m = 1; m <= 12; m++) {
        for (const y of [2023, 2024, 2025, 2026]) {
            totals[y].total += matrix[m][y].total;
            totals[y].count += matrix[m][y].count;
        }
    }

    histTableFoot.innerHTML = `
        <tr>
            <td>Total Anual</td>
            <td class="number-cell">$${formatCLP(totals[2023].total)}</td>
            <td class="number-cell">${totals[2023].count}</td>
            <td class="number-cell">$${formatCLP(totals[2024].total)}</td>
            <td class="number-cell">${totals[2024].count}</td>
            <td class="number-cell">$${formatCLP(totals[2025].total)}</td>
            <td class="number-cell">${totals[2025].count}</td>
            <td class="number-cell">$${formatCLP(totals[2026].total)}</td>
            <td class="number-cell">${totals[2026].count}</td>
        </tr>
    `;
}

// ======================== CACHÉ Y CARGA DE SUPABASE ========================

async function fetchAllFromTable(tableName, year = null) {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let done = false;
    
    while (!done) {
        let query = db.from(tableName).select('*');
        if (year !== null) {
            query = query.eq('anno', year);
        }
        const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            done = true;
        } else {
            allData.push(...data);
            if (data.length < pageSize) {
                done = true;
            } else {
                page++;
            }
        }
    }
    return allData;
}

function getCachedData() {
    const timestampStr = localStorage.getItem(CACHE_KEY_TIMESTAMP);
    if (!timestampStr) return null;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    if (now - timestamp > CACHE_EXPIRATION_MS) {
        return null;
    }
    
    try {
        const ingresos = JSON.parse(localStorage.getItem(CACHE_KEY_INGRESOS));
        if (ingresos) {
            return { ingresos };
        }
    } catch (e) {
        console.error("Error leyendo cache local", e);
    }
    return null;
}

function pruneIngresos(data) {
    return data.map(i => ({
        iding: i.iding,
        ticket: i.ticket,
        fecha: i.fecha,
        tiping: i.tiping,
        categoria: i.categoria,
        subcategoria: i.subcategoria,
        socio: i.socio,
        nomsocio: i.nomsocio,
        importe: i.importe,
        anno: i.anno,
        mes: i.mes
    }));
}

function setCachedData(ingresos) {
    try {
        const prunedIngresos = pruneIngresos(ingresos);
        localStorage.setItem(CACHE_KEY_INGRESOS, JSON.stringify(prunedIngresos));
        localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    } catch (e) {
        console.warn("Storage quota exceeded, attempting clean up of dashboard cache...", e);
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('dashboard_') || key.startsWith('consulta_movimientos_') || key.startsWith('consulta_'))) {
                    if (key !== CACHE_KEY_INGRESOS && key !== CACHE_KEY_TIMESTAMP) {
                        localStorage.removeItem(key);
                    }
                }
            }
            const prunedIngresos = pruneIngresos(ingresos);
            localStorage.setItem(CACHE_KEY_INGRESOS, JSON.stringify(prunedIngresos));
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
        } catch (e2) {
            console.error("Failed to recover storage cache quota.", e2);
        }
    }
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}

async function loadData() {
    try {
        const cache = getCachedData();
        let rawData = [];
        if (cache) {
            console.log("Cargando ingresos desde cache local.");
            rawData = cache.ingresos;
        } else {
            console.log("Cache ausente o expirado. Consultando Supabase...");
            const [ingresosCerrados, ingresosAnno] = await Promise.all([
                fetchAllFromTable('ingresos-cerrados'),
                fetchAllFromTable('ingresos-anno')
            ]);
            
            rawData = [...ingresosCerrados, ...ingresosAnno];
            
            const ingresosDataFull = rawData.filter(i => i.anno >= 2023 && i.anno <= 2026);
            setCachedData(ingresosDataFull);
            rawData = ingresosDataFull;
        }
        
        // Filtrar inmediatamente por la categoría = "ARRIENDO" y los 3 socios
        const targetSocios = [86, 158, 269];
        allIngresosRaw = rawData.filter(i => 
            targetSocios.includes(Number(i.socio)) && 
            i.categoria === "ARRIENDO"
        );
        
        // Inicializar ambos paneles
        updateComparativaProfesores(profYearFilter.value);
        updateComparativaHistorico(histSocioFilter.value);
        
        // Listeners para filtros
        profYearFilter.addEventListener('change', (e) => {
            updateComparativaProfesores(e.target.value);
        });
        histSocioFilter.addEventListener('change', (e) => {
            updateComparativaHistorico(e.target.value);
        });
        
        // Gestión de Pestañas
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        hideLoading();
    } catch (error) {
        console.error(error);
        hideLoading();
        document.getElementById('profTableBody').innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding:40px;">❌ Error al cargar datos: ${error.message}</td></tr>`;
        document.getElementById('histTableBody').innerHTML = `<tr><td colspan="9" style="text-align:center; color:red; padding:40px;">❌ Error al cargar datos: ${error.message}</td></tr>`;
    }
}

// Carga inicial
loadData();
