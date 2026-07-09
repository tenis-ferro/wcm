// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// ======================== CARGA DE DATOS ========================
let ingresosData = [];
let allIngresosRaw = [];
let sociosData = [];
let filteredSocios = [];
let currentTab = "general";
let listenersBound = false;

// Configuración de fechas para análisis de actividad (Referencia: 7 de Julio de 2026)
const baseDate = new Date("2026-07-07T23:59:59");
const twelveMonthsAgo = new Date(baseDate);
twelveMonthsAgo.setFullYear(baseDate.getFullYear() - 1);
const threeMonthsAgo = new Date(baseDate);
threeMonthsAgo.setMonth(baseDate.getMonth() - 3);

// Cache keys matching consulta-movimientos-05.js
const CACHE_KEY_INGRESOS = "consulta_movimientos_ingresos";
const CACHE_KEY_EGRESOS = "consulta_movimientos_egresos";
const CACHE_KEY_TIMESTAMP = "consulta_movimientos_timestamp";
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

// Elementos DOM
const modal = document.getElementById('socioModal');
const closeModal = document.querySelector('.close-modal');
const modalSocioNombre = document.getElementById('modalSocioNombre');
const modalSocioId = document.getElementById('modalSocioId');
const modalStats = document.getElementById('modalStats');
const modalBody = document.getElementById('modalBody');
const modalCategoryStats = document.getElementById('modalCategoryStats');

const CATEGORIAS_DESGLOSE = ["CUOTA MENSUAL", "CUOTA INCORPORACION", "ARRIENDO", "TORNEO", "CENA ANIVERSARIO"];

// Formateador de moneda CLP local
function formatCLP(value) {
    return Math.round(value).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '-';
    return fechaStr.slice(0, 10);
}

// Obtener fecha como Objeto Date, soportando campos anno/mes si falta fecha
function getDateObj(ing) {
    if (ing.fecha) {
        return new Date(ing.fecha);
    } else if (ing.anno && ing.mes) {
        return new Date(`${ing.anno}-${String(ing.mes).padStart(2, '0')}-15`); // mid-month fallback
    }
    return null;
}

// Calcular diferencia en meses con la fecha base
function calcularMesesDiferencia(fechaStr) {
    if (!fechaStr) return null;
    const lastDate = new Date(fechaStr);
    const diffTime = Math.abs(baseDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    return diffMonths;
}

// Comprobar si el socio no tiene pagos en los últimos 3 meses
function isSocioInactive(s) {
    if (!s.ultimaCuotaMensual) return true; // Nunca ha pagado
    const lastDate = new Date(s.ultimaCuotaMensual);
    return lastDate < threeMonthsAgo;
}

// Función para abrir modal con movimientos del socio
function openSocioModal(socioId, socioNombre) {
    const ingresosSocio = allIngresosRaw.filter(i => i.socio == socioId || i.iding == socioId);
    
    const movimientos = [];
    const porCategoria = {};
    CATEGORIAS_DESGLOSE.forEach(cat => { porCategoria[cat] = 0; });
    
    ingresosSocio.forEach(ing => {
        const monto = ing.importe || 0;
        const cat = ing.categoria;
        if (porCategoria.hasOwnProperty(cat)) {
            porCategoria[cat] += monto;
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
        <span><strong>💰 Total:</strong> $${formatCLP(totalMonto)}</span>
        <span><strong>📋 Movimientos:</strong> ${totalMovimientos}</span>
        <span><strong>📊 Promedio:</strong> $${formatCLP(promedio)}</span>
    `;
    
    // Generar tarjetas de desglose
    let catCardsHtml = '';
    for (const [cat, monto] of Object.entries(porCategoria)) {
        if (monto > 0 || totalMovimientos === 0) {
            const porcentaje = totalMonto > 0 ? (monto / totalMonto) * 100 : 0;
            catCardsHtml += `
                <div class="modal-cat-card">
                    <div class="cat-name">${cat}</div>
                    <div class="cat-amount">$${formatCLP(monto)}</div>
                    <div class="cat-percent">${porcentaje.toFixed(1)}% del total</div>
                </div>
            `;
        }
    }
    modalCategoryStats.innerHTML = catCardsHtml;
    
    if (movimientos.length === 0) {
        modalBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">📭 No hay movimientos para este socio</td></tr>';
    } else {
        modalBody.innerHTML = movimientos.map(m => `
            <tr>
                <td>${m.id}</td>
                <td>${m.ticket}</td>
                <td>${m.fecha}</td>
                <td style="color:#15803d; font-weight:bold;">${m.tipo}</td>
                <td>${m.categoria || '-'}</td>
                <td>${m.subcategoria}</td>
                <td>${m.concepto}</td>
                <td class="number-cell">$${formatCLP(m.monto)}</td>
            </tr>
        `).join('');
    }
    
    modal.style.display = 'flex';
}

// Procesar los ingresos y agrupar por socio con cálculos de cuotas
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
                total2023: 0,
                total2024: 0,
                total2025: 0,
                total2026: 0,
                ultimaCuotaMensual: null,
                montoCuotaMensual12M: 0,
                cantidadCuotas12M: 0
            });
        }
        
        const socio = sociosMap.get(socioId);
        socio.total += monto;
        
        if (anno === 2023) socio.total2023 += monto;
        if (anno === 2024) socio.total2024 += monto;
        if (anno === 2025) socio.total2025 += monto;
        if (anno === 2026) socio.total2026 += monto;
        
        if (categoria === "CUOTA MENSUAL") {
            const dateObj = getDateObj(ing);
            if (dateObj) {
                // Actualizar último pago
                if (!socio.ultimaCuotaMensual || dateObj > new Date(socio.ultimaCuotaMensual)) {
                    socio.ultimaCuotaMensual = fecha || `${anno}-${String(ing.mes).padStart(2, '0')}-15`;
                }
                
                // Calcular últimos 12 meses
                if (dateObj >= twelveMonthsAgo && dateObj <= baseDate) {
                    socio.montoCuotaMensual12M += monto;
                    socio.cantidadCuotas12M++;
                }
            }
        }
    });
    
    const socios = Array.from(sociosMap.values());
    socios.sort((a, b) => b.id - a.id);
    
    return socios;
}

function renderEstadisticas(socios) {
    const totalSocios = socios.length;
    let statsHtml = '';
    
    if (currentTab === "general") {
        const totalGeneral = socios.reduce((sum, s) => sum + s.total, 0);
        statsHtml = `
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-users"></i> Total Socios</div>
                <div class="stat-number">${totalSocios}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-dollar-sign"></i> Ingresos Totales</div>
                <div class="stat-number">$${formatCLP(totalGeneral)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-chart-line"></i> Promedio por Socio</div>
                <div class="stat-number">$${formatCLP(totalSocios > 0 ? totalGeneral / totalSocios : 0)}</div>
            </div>
        `;
    } else if (currentTab === "last12") {
        const list12M = socios.filter(s => s.cantidadCuotas12M > 0);
        const activos12M = list12M.length;
        const totalRecaudado12M = list12M.reduce((sum, s) => sum + s.montoCuotaMensual12M, 0);
        const totalCuotas12M = list12M.reduce((sum, s) => sum + s.cantidadCuotas12M, 0);
        statsHtml = `
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-user-check"></i> Socios Activos (12M)</div>
                <div class="stat-number">${activos12M}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-hand-holding-usd"></i> Recaudado Cuotas (12M)</div>
                <div class="stat-number">$${formatCLP(totalRecaudado12M)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-tags"></i> Total Cuotas Pagadas</div>
                <div class="stat-number">${totalCuotas12M}</div>
            </div>
        `;
    } else if (currentTab === "inactive") {
        const totalAnalizados = socios.filter(s => s.cantidadCuotas12M > 0).length;
        const inactivos = socios.filter(s => isSocioInactive(s) && s.cantidadCuotas12M > 0).length;
        const tasaInactividad = totalAnalizados > 0 ? (inactivos / totalAnalizados) * 100 : 0;
        statsHtml = `
            <div class="stat-card" style="border-left-color: #b91c1c;">
                <div class="stat-label" style="color: #991b1b;"><i class="fas fa-user-clock"></i> Socios Inactivos (3M)</div>
                <div class="stat-number" style="color: #991b1b;">${inactivos}</div>
            </div>
            <div class="stat-card" style="border-left-color: #b91c1c;">
                <div class="stat-label" style="color: #991b1b;"><i class="fas fa-percent"></i> Tasa de Inactividad</div>
                <div class="stat-number" style="color: #991b1b;">${tasaInactividad.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label"><i class="fas fa-users"></i> Socios Analizados (12M)</div>
                <div class="stat-number">${totalAnalizados}</div>
            </div>
        `;
    }
    
    document.getElementById('statsRow').innerHTML = statsHtml;
}

function renderTablaGeneral(socios) {
    const tbody = document.getElementById('tableBody');
    if (socios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">📭 No hay socios registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = socios.map(s => `
        <tr>
            <td class="number-cell"><span class="socio-link" onclick="openSocioModal('${s.id}', '${escapeHtml(s.nombre)}')">${s.id}</span></td>
            <td>${escapeHtml(s.nombre)}</td>
            <td class="number-cell">$${formatCLP(s.total)}</td>
            <td class="number-cell">$${formatCLP(s.total2023)}</td>
            <td class="number-cell">$${formatCLP(s.total2024)}</td>
            <td class="number-cell">$${formatCLP(s.total2025)}</td>
            <td class="number-cell">$${formatCLP(s.total2026)}</td>
            <td>${formatFecha(s.ultimaCuotaMensual)}</td>
        </tr>
    `).join('');
}

function renderTablaLast12(socios) {
    const tbody = document.getElementById('last12Body');
    const filteredList = socios.filter(s => s.cantidadCuotas12M > 0);
    
    if (filteredList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">📭 No hay socios con pagos en los últimos 12 meses</td></tr>';
        return;
    }
    
    // Ordenar por N° Cuotas Pagadas (12M) de menor a mayor
    filteredList.sort((a, b) => a.cantidadCuotas12M - b.cantidadCuotas12M);
    
    tbody.innerHTML = filteredList.map(s => {
        const badge = `<span class="active-badge"><i class="fas fa-check"></i> Activo (${s.cantidadCuotas12M} cuotas)</span>`;
            
        return `
            <tr>
                <td class="number-cell"><span class="socio-link" onclick="openSocioModal('${s.id}', '${escapeHtml(s.nombre)}')">${s.id}</span></td>
                <td>${escapeHtml(s.nombre)}</td>
                <td class="number-cell">$${formatCLP(s.montoCuotaMensual12M)}</td>
                <td class="number-cell">${s.cantidadCuotas12M}</td>
                <td>${formatFecha(s.ultimaCuotaMensual)}</td>
                <td>${badge}</td>
            </tr>
        `;
    }).join('');
}

function renderTablaInactive(socios) {
    const tbody = document.getElementById('inactiveBody');
    const inactiveList = socios.filter(s => isSocioInactive(s) && s.cantidadCuotas12M > 0);
    
    if (inactiveList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;">🎉 ¡Excelente! No hay socios inactivos en este período</td></tr>';
        return;
    }
    
    // Ordenar por tiempo transcurrido de menor a mayor (fecha de pago más reciente a más antigua)
    inactiveList.sort((a, b) => {
        const dateA = new Date(a.ultimaCuotaMensual);
        const dateB = new Date(b.ultimaCuotaMensual);
        return dateB - dateA;
    });
    
    tbody.innerHTML = inactiveList.map(s => {
        const meses = calcularMesesDiferencia(s.ultimaCuotaMensual);
        const timeText = meses === null ? "Nunca ha pagado" : (meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`);
        const badge = `<span class="inactive-badge"><i class="fas fa-exclamation-triangle"></i> Inactivo</span>`;
        
        return `
            <tr>
                <td class="number-cell"><span class="socio-link" onclick="openSocioModal('${s.id}', '${escapeHtml(s.nombre)}')">${s.id}</span></td>
                <td>${escapeHtml(s.nombre)}</td>
                <td>${formatFecha(s.ultimaCuotaMensual)}</td>
                <td class="number-cell">${timeText}</td>
                <td>${badge}</td>
            </tr>
        `;
    }).join('');
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
    renderTablaGeneral(filteredSocios);
    renderTablaLast12(filteredSocios);
    renderTablaInactive(filteredSocios);
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

function pruneEgresos(data) {
    return data.map(e => ({
        fecha: e.fecha,
        categoria: e.categoria,
        nomproveedor: e.nomproveedor,
        nomconcepto: e.nomconcepto,
        motivo: e.motivo,
        importe: e.importe,
        anno: e.anno,
        mes: e.mes
    }));
}

function setCachedData(ingresos, egresos) {
    try {
        const prunedIngresos = pruneIngresos(ingresos);
        const prunedEgresos = pruneEgresos(egresos);
        
        localStorage.setItem(CACHE_KEY_INGRESOS, JSON.stringify(prunedIngresos));
        localStorage.setItem(CACHE_KEY_EGRESOS, JSON.stringify(prunedEgresos));
        localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    } catch (e) {
        console.warn("Storage quota exceeded, attempting to clear old dashboard/query keys...", e);
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('dashboard_') || key.startsWith('consulta_movimientos_') || key.startsWith('consulta_'))) {
                    if (key !== CACHE_KEY_INGRESOS && key !== CACHE_KEY_EGRESOS && key !== CACHE_KEY_TIMESTAMP) {
                        localStorage.removeItem(key);
                    }
                }
            }
            const prunedIngresos = pruneIngresos(ingresos);
            const prunedEgresos = pruneEgresos(egresos);
            localStorage.setItem(CACHE_KEY_INGRESOS, JSON.stringify(prunedIngresos));
            localStorage.setItem(CACHE_KEY_EGRESOS, JSON.stringify(prunedEgresos));
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
            console.log("Storage recovered and cache saved successfully after cleanup.");
        } catch (e2) {
            console.error("Failed to recover storage cache quota. Data will not be cached.", e2);
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

async function loadData(forceReload = false) {
    try {
        if (forceReload) {
            const loader = document.getElementById('loadingOverlay');
            if (loader) {
                loader.style.display = 'flex';
                loader.style.opacity = '1';
                loader.style.visibility = 'visible';
            }
        }
        
        const cache = forceReload ? null : getCachedData();
        if (cache) {
            console.log("Cargando ingresos desde cache local.");
            allIngresosRaw = cache.ingresos;
            ingresosData = cache.ingresos;
        } else {
            console.log("Cache ausente, expirado o forzado. Consultando Supabase...");
            const [ingresosCerrados, egresosCerrados, ingresosAnno, egresosAnno] = await Promise.all([
                fetchAllFromTable('ingresos-cerrados'),
                fetchAllFromTable('egresos-cerrados'),
                fetchAllFromTable('ingresos-anno'),
                fetchAllFromTable('egresos-anno')
            ]);
            
            allIngresosRaw = [...ingresosCerrados, ...ingresosAnno];
            ingresosData = allIngresosRaw.filter(i => i.anno >= 2023 && i.anno <= 2026);
            const egresosData = [...egresosCerrados, ...egresosAnno].filter(e => e.anno >= 2023 && e.anno <= 2026);
            
            setCachedData(ingresosData, egresosData);
        }
        
        sociosData = procesarSocios(ingresosData);
        filteredSocios = [...sociosData];
        
        renderEstadisticas(filteredSocios);
        renderTablaGeneral(filteredSocios);
        renderTablaLast12(filteredSocios);
        renderTablaInactive(filteredSocios);
        
        if (!listenersBound) {
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', (e) => {
                filterSocios(e.target.value);
            });
            
            // Configurar modal
            closeModal.onclick = () => { modal.style.display = 'none'; };
            window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
            
            // Configurar pestañas
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('data-tab');
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                    
                    currentTab = tabId;
                    renderEstadisticas(filteredSocios);
                });
            });
            
            // Reload button listener
            const reloadDbBtn = document.getElementById('reloadDbBtn');
            if (reloadDbBtn) {
                reloadDbBtn.addEventListener('click', () => loadData(true));
            }
            
            listenersBound = true;
        }
        
        hideLoading();
    } catch (error) {
        console.error(error);
        hideLoading();
        if (forceReload) {
            alert(`Error al recargar desde Supabase: ${error.message}`);
        } else {
            document.getElementById('tableBody').innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; padding:40px;">❌ Error al cargar datos: ${error.message}</td></tr>`;
        }
    }
}

// Exponer función global para el onclick
window.openSocioModal = openSocioModal;

// Carga inicial
loadData();
