// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// ======================== CARGA DE DATOS ========================
let allIngresosRaw = [];
let sociosData = [];
let filteredSocios = [];

// Cache keys matching consulta-movimientos-05.js
const CACHE_KEY_INGRESOS = "consulta_movimientos_ingresos";
const CACHE_KEY_TIMESTAMP = "consulta_movimientos_timestamp";
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

// Modal
const modal = document.getElementById('socioModal');
const closeModal = document.querySelector('.close-modal');
const modalSocioNombre = document.getElementById('modalSocioNombre');
const modalSocioId = document.getElementById('modalSocioId');
const modalStats = document.getElementById('modalStats');
const modalBody = document.getElementById('modalBody');
const modalCategoryStats = document.getElementById('modalCategoryStats');

const CATEGORIAS_DESGLOSE = ["ARRIENDO"];

function formatCLP(value) {
    return Math.round(value).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '-';
    return fechaStr.slice(0, 10);
}

// Función para abrir modal con movimientos de arriendo del socio
function openSocioModal(socioId, socioNombre) {
    const ingresosSocio = allIngresosRaw.filter(i => i.socio == socioId);
    
    const movimientos = [];
    const porAnno = { 
        2023: { total: 0, count: 0 }, 
        2024: { total: 0, count: 0 }, 
        2025: { total: 0, count: 0 }, 
        2026: { total: 0, count: 0 } 
    };
    
    ingresosSocio.forEach(ing => {
        const monto = ing.importe || 0;
        const anno = ing.anno;
        if (porAnno.hasOwnProperty(anno)) {
            porAnno[anno].total += monto;
            porAnno[anno].count += 1;
        }
        
        movimientos.push({
            id: ing.iding || '-',
            ticket: ing.ticket || '-',
            fecha: ing.fecha ? ing.fecha.slice(0, 10) : `${ing.anno}-${String(ing.mes).padStart(2, '0')}`,
            tipo: ing.tiping || 'Ingreso',
            categoria: ing.categoria,
            subcategoria: ing.subcategoria || '-',
            concepto: ing.nomsocio || ing.tiping || 'Ingreso',
            monto: monto
        });
    });
    
    movimientos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    
    const totalMonto = movimientos.reduce((sum, m) => sum + m.monto, 0);
    const totalMovimientos = movimientos.length;
    const promedio = totalMovimientos > 0 ? totalMonto / totalMovimientos : 0;
    
    modalSocioNombre.innerText = socioNombre;
    modalSocioId.innerText = socioId;
    modalStats.innerHTML = `
        <span><strong>💰 Total Arriendos:</strong> $${formatCLP(totalMonto)}</span>
        <span><strong>📋 Movimientos:</strong> ${totalMovimientos}</span>
        <span><strong>📊 Promedio:</strong> $${formatCLP(promedio)}</span>
    `;
    
    // Generar tarjetas de desglose por año
    let annoCardsHtml = '';
    for (const [anno, data] of Object.entries(porAnno)) {
        annoCardsHtml += `
            <div class="modal-cat-card">
                <div class="cat-name">Año ${anno}</div>
                <div class="cat-amount">$${formatCLP(data.total)}</div>
                <div class="cat-percent">${data.count} movimiento${data.count === 1 ? '' : 's'}</div>
            </div>
        `;
    }
    modalCategoryStats.innerHTML = annoCardsHtml;
    
    if (movimientos.length === 0) {
        modalBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">📭 No hay arriendos registrados para este profesor</td></tr>';
    } else {
        let lastYear = null;
        modalBody.innerHTML = movimientos.map(m => {
            const currentYear = m.fecha ? m.fecha.slice(0, 4) : '-';
            let dividerClass = '';
            if (lastYear !== null && currentYear !== lastYear) {
                dividerClass = 'class="year-divider"';
            }
            lastYear = currentYear;
            
            return `
                <tr ${dividerClass}>
                    <td>${m.id}</td>
                    <td>${m.ticket}</td>
                    <td>${m.fecha}</td>
                    <td style="color:#15803d; font-weight:bold;">${m.tipo}</td>
                    <td>${m.categoria || '-'}</td>
                    <td>${m.subcategoria}</td>
                    <td>${m.concepto}</td>
                    <td class="number-cell">$${formatCLP(m.monto)}</td>
                </tr>
            `;
        }).join('');
    }
    
    modal.style.display = 'flex';
}

// Procesar los ingresos y agrupar por socio
function procesarSocios(ingresos) {
    const sociosMap = new Map();

    ingresos.forEach(ing => {
        const socioId = ing.socio;
        if (!socioId || socioId <= 0) return;
        
        const nombre = ing.nomsocio || `Socio ${socioId}`;
        const monto = ing.importe || 0;
        const anno = ing.anno;
        const categoria = ing.categoria;
        const fecha = ing.fecha;
        
        if (!sociosMap.has(socioId)) {
            sociosMap.set(socioId, {
                id: socioId,
                nombre: nombre,
                total: 0,
                totalCount: 0,
                total2023: 0,
                total2023Count: 0,
                total2024: 0,
                total2024Count: 0,
                total2025: 0,
                total2025Count: 0,
                total2026: 0,
                total2026Count: 0,
                ultimoArriendo: null
            });
        }
        
        const socio = sociosMap.get(socioId);
        socio.total += monto;
        socio.totalCount += 1;
        
        if (anno === 2023) { socio.total2023 += monto; socio.total2023Count += 1; }
        if (anno === 2024) { socio.total2024 += monto; socio.total2024Count += 1; }
        if (anno === 2025) { socio.total2025 += monto; socio.total2025Count += 1; }
        if (anno === 2026) { socio.total2026 += monto; socio.total2026Count += 1; }
        
        if (categoria === "ARRIENDO" && fecha) {
            const fechaActual = new Date(fecha);
            if (!socio.ultimoArriendo || fechaActual > new Date(socio.ultimoArriendo)) {
                socio.ultimoArriendo = fecha;
            }
        }
    });
    
    const socios = Array.from(sociosMap.values());
    socios.sort((a, b) => a.id - b.id);
    
    return socios;
}

function renderEstadisticas(socios) {
    const totalSocios = socios.length;
    const totalGeneral = socios.reduce((sum, s) => sum + s.total, 0);
    
    const statsHtml = `
        <div class="stat-card">
            <div class="stat-label"><i class="fas fa-users"></i> Profesores Filtrados</div>
            <div class="stat-number">${totalSocios}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label"><i class="fas fa-dollar-sign"></i> Total Arriendos</div>
            <div class="stat-number">$${formatCLP(totalGeneral)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label"><i class="fas fa-chart-line"></i> Promedio Arriendos</div>
            <div class="stat-number">$${formatCLP(totalSocios > 0 ? totalGeneral / totalSocios : 0)}</div>
        </div>
    `;
    document.getElementById('statsRow').innerHTML = statsHtml;
}

function renderTabla(socios) {
    const tbody = document.getElementById('tableBody');
    if (socios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">📭 No hay datos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = socios.map(s => `
        <tr>
            <td class="number-cell"><span class="socio-link" onclick="openSocioModal('${s.id}', '${escapeHtml(s.nombre)}')">${s.id}</span></td>
            <td>${escapeHtml(s.nombre)}</td>
            <td class="number-cell">$${formatCLP(s.total)} (${s.totalCount})</td>
            <td class="number-cell">$${formatCLP(s.total2023)} (${s.total2023Count})</td>
            <td class="number-cell">$${formatCLP(s.total2024)} (${s.total2024Count})</td>
            <td class="number-cell">$${formatCLP(s.total2025)} (${s.total2025Count})</td>
            <td class="number-cell">$${formatCLP(s.total2026)} (${s.total2026Count})</td>
            <td>${formatFecha(s.ultimoArriendo)}</td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function filterSocios(searchTerm) {
    if (!searchTerm) {
        filteredSocios = [...sociosData];
    } else {
        const term = searchTerm.toLowerCase();
        filteredSocios = sociosData.filter(s => 
            s.nombre.toLowerCase().includes(term) || 
            s.id.toString().includes(term)
        );
    }
    renderEstadisticas(filteredSocios);
    renderTabla(filteredSocios);
}

// ======================== CACHÉ Y CARGA DE SUPABASE ========================

// Función auxiliar para traer todos los registros paginados
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
        return null; // Cache expirado
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
            
            // Filtrar años 2023 a 2026 para cachear
            const ingresosDataFull = rawData.filter(i => i.anno >= 2023 && i.anno <= 2026);
            setCachedData(ingresosDataFull);
            rawData = ingresosDataFull;
        }
        
        // Filtrar inmediatamente por los ID Socio (86, 97, 158, 269) y Categoría = "ARRIENDO"
        const targetSocios = [86, 97, 158, 269];
        allIngresosRaw = rawData.filter(i => 
            targetSocios.includes(Number(i.socio)) && 
            i.categoria === "ARRIENDO"
        );
        
        sociosData = procesarSocios(allIngresosRaw);
        filteredSocios = [...sociosData];
        
        renderEstadisticas(filteredSocios);
        renderTabla(filteredSocios);
        
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            filterSocios(e.target.value);
        });
        
        // Configurar modal
        closeModal.onclick = () => { modal.style.display = 'none'; };
        window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
        
        hideLoading();
    } catch (error) {
        console.error(error);
        hideLoading();
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; padding:40px;">❌ Error al cargar datos: ${error.message}</td></tr>`;
    }
}

// Exponer función global para el onclick
window.openSocioModal = openSocioModal;

// Carga inicial
loadData();
