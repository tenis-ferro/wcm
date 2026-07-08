// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// ======================== VARIABLES GLOBALES DINÁMICAS ========================
let currentYear = 2026;  // Por defecto inicializamos con 2026
let ingresosData = [];
let currentMonth = "all";
let generalEvolutionChart, regularEvolutionChart;

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ======================== CACHÉ POR AÑO ========================
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

function getCacheKeys(year) {
    return {
        ingresos: `dashboard_quota_ingresos_${year}`,
        timestamp: `dashboard_quota_timestamp_${year}`
    };
}

function getCachedData(year) {
    const keys = getCacheKeys(year);
    const timestampStr = localStorage.getItem(keys.timestamp);
    if (!timestampStr) return null;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    if (now - timestamp > CACHE_EXPIRATION_MS) {
        return null; // Cache expirado
    }
    
    try {
        const ingresos = JSON.parse(localStorage.getItem(keys.ingresos));
        if (ingresos) {
            return { ingresos };
        }
    } catch (e) {
        console.error(`Error leyendo cache local de cuotas para el año ${year}`, e);
    }
    return null;
}

function setCachedData(year, ingresos) {
    try {
        const keys = getCacheKeys(year);
        localStorage.setItem(keys.ingresos, JSON.stringify(ingresos));
        localStorage.setItem(keys.timestamp, Date.now().toString());
    } catch (e) {
        console.error(`Error guardando en cache local de cuotas para el año ${year}`, e);
    }
}

function clearCachedData(year) {
    const keys = getCacheKeys(year);
    localStorage.removeItem(keys.ingresos);
    localStorage.removeItem(keys.timestamp);
}

// ======================== MÉTODOS DE CÁLCULO Y AGREGACIÓN ========================

function formatCLP(value) {
    return Math.round(value).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function analyzeQuotaMensual(filteredIngresos) {
    const cuotaMensualItems = filteredIngresos.filter(ing => ing.categoria && ing.categoria.toUpperCase().trim() === "CUOTA MENSUAL");
    let regular = { cantidad: 0, total: 0 };
    let damaEstudiante = { cantidad: 0, total: 0 };
    let pasivo = { cantidad: 0, total: 0 };
    let otros = { cantidad: 0, total: 0 };
    
    cuotaMensualItems.forEach(item => {
        const monto = item.importe;
        if (monto === 43500) { regular.cantidad++; regular.total += monto; }
        else if (monto === 21750) { damaEstudiante.cantidad++; damaEstudiante.total += monto; }
        else if (monto === 13050) { pasivo.cantidad++; pasivo.total += monto; }
        else { otros.cantidad++; otros.total += monto; }
    });
    
    const quotaData = [];
    if (regular.cantidad > 0) quotaData.push({ tipo: "REGULAR", montoUnitario: "$43.500", cantidad: regular.cantidad, total: regular.total });
    if (damaEstudiante.cantidad > 0) quotaData.push({ tipo: "DAMA / ESTUDIANTE", montoUnitario: "$21.750", cantidad: damaEstudiante.cantidad, total: damaEstudiante.total });
    if (pasivo.cantidad > 0) quotaData.push({ tipo: "PASIVO", montoUnitario: "$13.050", cantidad: pasivo.cantidad, total: pasivo.total });
    if (otros.cantidad > 0) quotaData.push({ tipo: "📦 OTROS", montoUnitario: "---", cantidad: otros.cantidad, total: otros.total });
    
    const totalCuotas = regular.total + damaEstudiante.total + pasivo.total + otros.total;
    quotaData.forEach(item => { item.porcentaje = totalCuotas > 0 ? (item.total / totalCuotas) * 100 : 0; });
    return { quotaData, totalCuotas, cantidadRegistros: cuotaMensualItems.length };
}

function getRegularEvolution() {
    const regularMensualCantidad = new Array(12).fill(0);
    const regularMensualMonto = new Array(12).fill(0);
    
    ingresosData.forEach(ing => {
        const categoria = (ing.categoria || "").toUpperCase().trim();
        if (categoria === "CUOTA MENSUAL" && ing.importe === 43500 && ing.mes >= 1 && ing.mes <= 12) {
            regularMensualCantidad[ing.mes - 1]++;
            regularMensualMonto[ing.mes - 1] += ing.importe;
        }
    });
    
    const totalAnualMonto = regularMensualMonto.reduce((a,b) => a + b, 0);
    const totalSocios = regularMensualCantidad.reduce((a,b) => a + b, 0);
    const mesesConSocios = regularMensualCantidad.filter(c => c > 0);
    const promedioSocios = mesesConSocios.length > 0 ? (totalSocios / mesesConSocios.length) : 0;
    const minSocios = Math.min(...regularMensualCantidad);
    const maxSocios = Math.max(...regularMensualCantidad);
    
    return { regularMensualCantidad, regularMensualMonto, totalAnualMonto, promedioSocios, minSocios, maxSocios };
}

function renderQuotaAnalysis(filteredIngresos) {
    const { quotaData, totalCuotas, cantidadRegistros } = analyzeQuotaMensual(filteredIngresos);
    const tbody = document.getElementById('quotaCompositionBody');
    tbody.innerHTML = quotaData.map(item => `<tr>
        <td><strong>${item.tipo}</strong></td>
        <td>${item.montoUnitario}</td>
        <td class="number-cell">${item.cantidad}</td>
        <td class="number-cell">$${formatCLP(item.total)}</td>
        <td class="percentage-cell">${item.porcentaje.toFixed(1)}%</td>
    </tr>`).join('');
    document.getElementById('quotaCompositionFoot').innerHTML = `<tr class="total-row"><td><strong>TOTAL</strong></td><td colspan="2"></td><td class="number-cell"><strong>${cantidadRegistros}</strong></td><td class="number-cell"><strong>$${formatCLP(totalCuotas)}</strong></td><td class="percentage-cell"><strong>100%</strong></td></tr>`;
}

function renderGeneralEvolutionChart() {
    const cuotas = ingresosData.filter(ing => ing.categoria && ing.categoria.toUpperCase().trim() === "CUOTA MENSUAL");
    const generalMensualCantidad = new Array(12).fill(0);
    const generalMensualMonto = new Array(12).fill(0);
    
    cuotas.forEach(ing => {
        if (ing.mes >= 1 && ing.mes <= 12) {
            generalMensualCantidad[ing.mes - 1]++;
            generalMensualMonto[ing.mes - 1] += ing.importe || 0;
        }
    });
    
    const ctx = document.getElementById('generalEvolutionChart').getContext('2d');
    if (generalEvolutionChart) generalEvolutionChart.destroy();
    
    generalEvolutionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mesesCortos,
            datasets: [
                { label: 'Recaudado Total Cuotas ($)', data: generalMensualMonto, type: 'bar', backgroundColor: '#3b82f6', borderRadius: 8, yAxisID: 'y', order: 2 },
                { label: 'Total Transacciones', data: generalMensualCantidad, type: 'line', borderColor: '#1d4ed8', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointBackgroundColor: '#1d4ed8', pointBorderColor: '#fff', pointRadius: 4, fill: false, yAxisID: 'y1', order: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { tooltip: { callbacks: { label: (ctx) => ctx.dataset.label.includes('Recaudado') ? `$${formatCLP(ctx.raw)}` : `${ctx.raw} pagos` } }, legend: { position: 'top', labels: { font: { size: 10 } } } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${formatCLP(v)}` }, title: { display: true, text: 'Monto en CLP', font: { size: 10 } } }, y1: { beginAtZero: true, position: 'right', ticks: { callback: (v) => `${v} pagos` }, title: { display: true, text: 'Transacciones', font: { size: 10 } }, grid: { drawOnChartArea: false } }, x: { title: { display: true, text: 'Mes', font: { size: 10 } } } }
        }
    });
}

function renderRegularEvolutionChart() {
    const { regularMensualCantidad, regularMensualMonto, totalAnualMonto, promedioSocios, minSocios, maxSocios } = getRegularEvolution();
    
    document.getElementById('totalRegularAnual').innerHTML = `$${formatCLP(totalAnualMonto)}`;
    document.getElementById('promedioSociosRegular').innerHTML = promedioSocios.toFixed(1);
    document.getElementById('minSociosRegular').innerHTML = minSocios;
    document.getElementById('maxSociosRegular').innerHTML = maxSocios;
    
    const ctx = document.getElementById('regularEvolutionChart').getContext('2d');
    if (regularEvolutionChart) regularEvolutionChart.destroy();
    
    regularEvolutionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mesesCortos,
            datasets: [
                { label: 'Monto Recaudado Regular ($)', data: regularMensualMonto, type: 'bar', backgroundColor: '#2e9e73', borderRadius: 8, yAxisID: 'y', order: 2 },
                { label: 'Cantidad de Socios Regular', data: regularMensualCantidad, type: 'line', borderColor: '#1e5c3a', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointBackgroundColor: '#1e5c3a', pointBorderColor: '#fff', pointRadius: 4, fill: false, yAxisID: 'y1', order: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { tooltip: { callbacks: { label: (ctx) => ctx.dataset.label.includes('Recaudado') ? `$${formatCLP(ctx.raw)}` : `${ctx.raw} socios` } }, legend: { position: 'top', labels: { font: { size: 10 } } } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${formatCLP(v)}` }, title: { display: true, text: 'Monto en CLP', font: { size: 10 } } }, y1: { beginAtZero: true, position: 'right', ticks: { callback: (v) => `${v} socios` }, title: { display: true, text: 'Cantidad de Socios Regular', font: { size: 10 } }, grid: { drawOnChartArea: false } }, x: { title: { display: true, text: 'Mes', font: { size: 10 } } } }
        }
    });
}

function updateUIAndCharts() {
    let filteredIngresos = ingresosData;
    if (currentMonth !== "all") {
        const monthNum = parseInt(currentMonth);
        filteredIngresos = ingresosData.filter(i => i.mes === monthNum);
    }
    
    // Filtrar solo cuota mensual para KPIs
    const cuotas = filteredIngresos.filter(ing => ing.categoria && ing.categoria.toUpperCase().trim() === "CUOTA MENSUAL");
    const totalQuota = cuotas.reduce((s, i) => s + (i.importe || 0), 0);
    const totalTransactions = cuotas.length;
    
    // Contar socios únicos en el período
    const sociosUnicosSet = new Set(cuotas.map(c => c.socio).filter(s => s));
    const uniqueSociosCount = sociosUnicosSet.size;
    const averagePerSocio = uniqueSociosCount > 0 ? totalQuota / uniqueSociosCount : 0;
    
    document.getElementById('totalQuotaValue').innerHTML = `$${formatCLP(totalQuota)}`;
    document.getElementById('totalQuotaTransactions').innerHTML = totalTransactions.toLocaleString('es-CL');
    document.getElementById('totalQuotaUniqueSocios').innerHTML = uniqueSociosCount.toLocaleString('es-CL');
    document.getElementById('totalQuotaAverage').innerHTML = `$${formatCLP(averagePerSocio)}`;
    
    const periodText = currentMonth === "all" ? `Acumulado ${currentYear}` : monthNames[parseInt(currentMonth)-1];
    document.getElementById('quotaValueSub').innerHTML = periodText;
    document.getElementById('quotaTransSub').innerHTML = periodText;
    document.getElementById('quotaAvgSub').innerHTML = periodText;
    
    renderQuotaAnalysis(filteredIngresos);
    renderQuotaBehaviorTable();
    renderRegularQuotaBehaviorTable();
    renderGeneralEvolutionChart();
    renderRegularEvolutionChart();
}

// Función auxiliar para traer todos los registros paginados por el año especificado
async function fetchAllFromTable(tableName, year) {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let done = false;
    
    while (!done) {
        const { data, error } = await db
            .from(tableName)
            .select('*')
            .eq('anno', year)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
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
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
            loader.style.visibility = 'visible';
        }
        
        // Actualizar etiqueta del año en el título
        document.getElementById('yearDisplay').innerText = currentYear;

        // 1. Intentar cargar desde cache
        const cache = forceReload ? null : getCachedData(currentYear);
        if (cache) {
            console.log(`Cargando cuotas del año ${currentYear} desde cache local.`);
            ingresosData = cache.ingresos;
        } else {
            console.log(`Cache ausente, expirado o forzado. Consultando Supabase para el año ${currentYear}...`);
            
            // Elegir la tabla de Supabase dinámicamente según el año
            const targetIngresosTable = (currentYear === 2026) ? 'ingresos-anno' : 'ingresos-cerrados';

            // Obtenemos todos los registros del año de una sola vez
            const ingresos = await fetchAllFromTable(targetIngresosTable, currentYear);
            ingresosData = ingresos;
            
            // Guardar en cache local
            setCachedData(currentYear, ingresos);
        }
        
        updateUIAndCharts();
        hideLoading();
    } catch (error) {
        hideLoading();
        if (forceReload) {
            alert(`Error al recargar desde Supabase: ${error.message}`);
        } else {
            document.body.innerHTML = `<div style="padding:40px;text-align:center;color:red;font-weight:bold;font-family:sans-serif;">Error al conectar con Supabase para el año ${currentYear}: ${error.message}</div>`;
        }
    }
}

// ======================== ANÁLISIS DE COMPORTAMIENTO MÁS DETALLADO ========================

function renderQuotaBehaviorTable() {
    const tbody = document.getElementById('quotaBehaviorBody');
    if (!tbody) return;
    
    const cuotas = ingresosData.filter(ing => ing.categoria && ing.categoria.toUpperCase().trim() === "CUOTA MENSUAL");
    
    const statsByMonth = [];
    for (let m = 1; m <= 12; m++) {
        const mRecords = cuotas.filter(x => x.mes === m);
        if (mRecords.length === 0) continue;
        
        const mAmounts = mRecords.map(x => x.importe || 0);
        const mSocios = mRecords.map(x => x.socio).filter(s => s);
        
        const socioCounts = {};
        mSocios.forEach(s => {
            socioCounts[s] = (socioCounts[s] || 0) + 1;
        });
        
        let multiplePayersCount = 0;
        let excessPayments = 0;
        for (const [socioId, cnt] of Object.entries(socioCounts)) {
            if (cnt > 1) {
                multiplePayersCount++;
                excessPayments += (cnt - 1);
            }
        }
        
        statsByMonth.push({
            mesNum: m,
            mesNombre: monthNames[m - 1],
            monto: mAmounts.reduce((a, b) => a + b, 0),
            transacciones: mRecords.length,
            sociosUnicos: Object.keys(socioCounts).length,
            multiplePayers: multiplePayersCount,
            excess: excessPayments
        });
    }
    
    if (statsByMonth.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">📭 No hay datos de cuotas registrados para este año</td></tr>';
        return;
    }
    
    tbody.innerHTML = statsByMonth.map(row => `
        <tr class="clickable-row" onclick="openQuotaBehaviorDetails(${row.mesNum}, false)">
            <td><strong>${row.mesNombre}</strong></td>
            <td class="number-cell">$${formatCLP(row.monto)}</td>
            <td class="number-cell">${row.transacciones}</td>
            <td class="number-cell">${row.sociosUnicos}</td>
            <td class="number-cell">${row.multiplePayers}</td>
            <td class="number-cell">${row.excess}</td>
            <td style="text-align:center; color:#1e5c3a;"><i class="fas fa-search-plus"></i> Ver socios</td>
        </tr>
    `).join('');
}

function renderRegularQuotaBehaviorTable() {
    const tbody = document.getElementById('regularQuotaBehaviorBody');
    if (!tbody) return;
    
    const cuotas = ingresosData.filter(ing => ing.categoria && ing.categoria.toUpperCase().trim() === "CUOTA MENSUAL" && ing.importe === 43500);
    
    const statsByMonth = [];
    for (let m = 1; m <= 12; m++) {
        const mRecords = cuotas.filter(x => x.mes === m);
        if (mRecords.length === 0) continue;
        
        const mAmounts = mRecords.map(x => x.importe || 0);
        const mSocios = mRecords.map(x => x.socio).filter(s => s);
        
        const socioCounts = {};
        mSocios.forEach(s => {
            socioCounts[s] = (socioCounts[s] || 0) + 1;
        });
        
        let multiplePayersCount = 0;
        let excessPayments = 0;
        for (const [socioId, cnt] of Object.entries(socioCounts)) {
            if (cnt > 1) {
                multiplePayersCount++;
                excessPayments += (cnt - 1);
            }
        }
        
        statsByMonth.push({
            mesNum: m,
            mesNombre: monthNames[m - 1],
            monto: mAmounts.reduce((a, b) => a + b, 0),
            transacciones: mRecords.length,
            sociosUnicos: Object.keys(socioCounts).length,
            multiplePayers: multiplePayersCount,
            excess: excessPayments
        });
    }
    
    if (statsByMonth.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">📭 No hay datos de cuotas regulares registrados para este año</td></tr>';
        return;
    }
    
    tbody.innerHTML = statsByMonth.map(row => `
        <tr class="clickable-row" onclick="openQuotaBehaviorDetails(${row.mesNum}, true)">
            <td><strong>${row.mesNombre}</strong></td>
            <td class="number-cell">$${formatCLP(row.monto)}</td>
            <td class="number-cell">${row.transacciones}</td>
            <td class="number-cell">${row.sociosUnicos}</td>
            <td class="number-cell">${row.multiplePayers}</td>
            <td class="number-cell">${row.excess}</td>
            <td style="text-align:center; color:#1e5c3a;"><i class="fas fa-search-plus"></i> Ver socios</td>
        </tr>
    `).join('');
}

function openQuotaBehaviorDetails(monthNum, regularOnly = false) {
    let cuotas = ingresosData.filter(ing => ing.categoria && ing.categoria.toUpperCase().trim() === "CUOTA MENSUAL" && ing.mes === monthNum);
    if (regularOnly) {
        cuotas = cuotas.filter(x => x.importe === 43500);
    }
    
    const socioCounts = {};
    const socioNames = {};
    const socioTotals = {};
    
    cuotas.forEach(x => {
        const s_id = x.socio;
        if (!s_id) return;
        socioCounts[s_id] = (socioCounts[s_id] || 0) + 1;
        socioNames[s_id] = x.nomsocio || `Socio ${s_id}`;
        socioTotals[s_id] = (socioTotals[s_id] || 0) + (x.importe || 0);
    });
    
    const list = [];
    for (const [s_id, cnt] of Object.entries(socioCounts)) {
        if (cnt > 1) {
            list.push({
                id: s_id,
                nombre: socioNames[s_id],
                cantidad: cnt,
                total: socioTotals[s_id]
            });
        }
    }
    
    list.sort((a, b) => b.cantidad - a.cantidad);
    
    const mName = monthNames[monthNum - 1];
    document.getElementById('behaviorModalMonth').innerText = `${mName} ${currentYear} (${regularOnly ? 'Solo Cuota Regular $43.500' : 'Todas las Cuotas'})`;
    
    const tbody = document.getElementById('behaviorModalBody');
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">🎉 No hay socios con pagos múltiples en este mes</td></tr>';
    } else {
        tbody.innerHTML = list.map(item => `
            <tr>
                <td><strong>${item.id}</strong></td>
                <td>${item.nombre}</td>
                <td class="number-cell">${item.cantidad}</td>
                <td class="number-cell">$${formatCLP(item.total)}</td>
            </tr>
        `).join('');
    }
    
    document.getElementById('behaviorModal').style.display = 'flex';
}

async function init() {
    document.getElementById('monthFilter').addEventListener('change', (e) => { currentMonth = e.target.value; updateUIAndCharts(); });
    
    // Configurar cambio de año dinámico
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.addEventListener('change', async (e) => {
        currentYear = parseInt(e.target.value);
        currentMonth = "all";
        document.getElementById('monthFilter').value = "all";
        await loadData();
    });

    const reloadDbBtn = document.getElementById('reloadDbBtn');
    if (reloadDbBtn) {
        reloadDbBtn.addEventListener('click', () => {
            clearCachedData(currentYear);
            loadData(true);
        });
    }

    const resetBtn = document.getElementById('resetAllBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('monthFilter').value = 'all';
            currentMonth = 'all';
            updateUIAndCharts();
        });
    }

    // Cerrar modal
    const behaviorModal = document.getElementById('behaviorModal');
    const closeBehaviorModal = document.getElementById('closeBehaviorModal');
    if (closeBehaviorModal) {
        closeBehaviorModal.onclick = () => { behaviorModal.style.display = 'none'; };
    }
    window.addEventListener('click', (event) => {
        if (event.target === behaviorModal) {
            behaviorModal.style.display = 'none';
        }
    });
    
    await loadData();
}

// Exponer globalmente para la llamada inline
window.openQuotaBehaviorDetails = openQuotaBehaviorDetails;

init();
