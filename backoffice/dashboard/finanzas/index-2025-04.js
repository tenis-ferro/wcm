// ======================== VARIABLE GLOBAL ========================
// CAMBIA ESTE VALOR SEGÚN EL AÑO QUE QUIERAS ANALIZAR
const YEAR = 2025;  // Cambiar a 2023, 2025, etc. para otros dashboards

// ======================== FIN VARIABLE GLOBAL ========================

// Actualizar el año en el HTML
document.getElementById('yearDisplay').innerText = YEAR;
document.getElementById('yearBadge').innerText = YEAR;
document.getElementById('currentYearForFilter').innerText = YEAR;

let ingresosData = [];
let egresosData = [];
let currentMonth = "all";
let ingresosChart, egresosChart, monthlyChart, quotaChart, remuneracionesChart, regularEvolutionChart;
let ingresosSearchTerm = "", egresosSearchTerm = "";
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Categorías principales
const INGRESOS_CATEGORIAS_PRINCIPALES = ["CUOTA MENSUAL", "ARRIENDO", "TIENDA", "CASILLEROS", "CENA ANIVERSARIO", "CUOTA INCORPORACION", "TORNEO"];
const EGRESOS_CATEGORIAS_PRINCIPALES = ["REMUNERACIONES", "CANCHAS", "SERVICIOS BÁSICOS", "MANTENCION", "PROYECTOS", "ANIVERSARIO"];

// Función para formatear CLP
function formatCLP(value) {
    return Math.round(value).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Agrupa categorías con cantidad de movimientos
function groupByFixedCategoriesWithCount(filteredData, categoriasPrincipales) {
    const result = new Map();
    for (const cat of categoriasPrincipales) {
        result.set(cat, { total: 0, cantidad: 0 });
    }
    let otrosTotal = 0;
    let otrosCantidad = 0;

    filteredData.forEach(item => {
        const categoriaOriginal = item.categoria || "Sin categoría";
        const upperCat = categoriaOriginal.toUpperCase().trim();
        let encontrada = false;
        for (const principal of categoriasPrincipales) {
            if (upperCat === principal || upperCat.includes(principal) || principal.includes(upperCat)) {
                const current = result.get(principal);
                current.total += item.importe;
                current.cantidad++;
                encontrada = true;
                break;
            }
        }
        if (!encontrada) {
            otrosTotal += item.importe;
            otrosCantidad++;
        }
    });

    const items = [];
    for (const [cat, data] of result.entries()) {
        if (data.cantidad > 0) {
            items.push({
                categoria: cat,
                cantidad: data.cantidad,
                total: data.total
            });
        }
    }
    if (otrosCantidad > 0) {
        items.push({
            categoria: "📦 OTROS",
            cantidad: otrosCantidad,
            total: otrosTotal
        });
    }

    const totalGeneral = items.reduce((sum, item) => sum + item.total, 0);
    items.forEach(item => {
        item.porcentaje = totalGeneral > 0 ? (item.total / totalGeneral) * 100 : 0;
    });
    items.sort((a, b) => b.total - a.total);
    return items;
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

// Corregimos que en getRegularEvolution, getRemuneracionesMensual, getMonthlyStats y loadData se usen las variables locales y globales del script
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

function getRemuneracionesMensual() {
    const remuneracionesMensual = new Array(12).fill(0);
    egresosData.forEach(eg => {
        const categoria = (eg.categoria || "").toUpperCase().trim();
        if (categoria === "REMUNERACIONES" && eg.mes >= 1 && eg.mes <= 12) {
            remuneracionesMensual[eg.mes - 1] += eg.importe || 0;
        }
    });
    const totalAnual = remuneracionesMensual.reduce((a,b) => a + b, 0);
    const mesesConDatos = remuneracionesMensual.filter(v => v > 0);
    const promedioMensual = mesesConDatos.length > 0 ? totalAnual / mesesConDatos.length : 0;
    const maxMensual = Math.max(...remuneracionesMensual);
    return { remuneracionesMensual, totalAnual, promedioMensual, maxMensual };
}

function getMonthlyStats() {
    const ingresosMensual = new Array(12).fill(0);
    const egresosMensual = new Array(12).fill(0);
    
    for (let m = 1; m <= 12; m++) {
        ingresosMensual[m-1] = ingresosData.filter(i => i.mes === m).reduce((s,i) => s + (i.importe||0), 0);
        egresosMensual[m-1] = egresosData.filter(e => e.mes === m).reduce((s,e) => s + (e.importe||0), 0);
    }
    
    const ingresosConDatos = ingresosMensual.filter(v => v > 0);
    const egresosConDatos = egresosMensual.filter(v => v > 0);
    const promedioIngresos = ingresosConDatos.length > 0 ? ingresosConDatos.reduce((a,b) => a + b, 0) / ingresosConDatos.length : 0;
    const promedioEgresos = egresosConDatos.length > 0 ? egresosConDatos.reduce((a,b) => a + b, 0) / egresosConDatos.length : 0;
    const minIngresos = Math.min(...ingresosMensual);
    const maxIngresos = Math.max(...ingresosMensual);
    const minEgresos = Math.min(...egresosMensual);
    const maxEgresos = Math.max(...egresosMensual);
    const minIngresosMes = ingresosMensual.indexOf(minIngresos) + 1;
    const maxIngresosMes = ingresosMensual.indexOf(maxIngresos) + 1;
    const minEgresosMes = egresosMensual.indexOf(minEgresos) + 1;
    const maxEgresosMes = egresosMensual.indexOf(maxEgresos) + 1;
    
    return { 
        promedioIngresos, promedioEgresos,
        minIngresos, maxIngresos, minIngresosMes, maxIngresosMes,
        minEgresos, maxEgresos, minEgresosMes, maxEgresosMes,
        ingresosMensual, egresosMensual
    };
}

function calcularProyecciones() {
    let ingresosReales = 0;
    let egresosReales = 0;
    let mesesConDatosIngresos = 0;
    let mesesConDatosEgresos = 0;
    
    for (let m = 1; m <= 12; m++) {
        const ingresosMes = ingresosData.filter(i => i.mes === m).reduce((s,i) => s + (i.importe||0), 0);
        const egresosMes = egresosData.filter(e => e.mes === m).reduce((s,e) => s + (e.importe||0), 0);
        if (ingresosMes > 0 || egresosMes > 0) {
            ingresosReales += ingresosMes;
            egresosReales += egresosMes;
            if (ingresosMes > 0) mesesConDatosIngresos++;
            if (egresosMes > 0) mesesConDatosEgresos++;
        }
    }
    
    const promedioIngresosMensual = mesesConDatosIngresos > 0 ? ingresosReales / mesesConDatosIngresos : 0;
    const promedioEgresosMensual = mesesConDatosEgresos > 0 ? egresosReales / mesesConDatosEgresos : 0;
    
    const proyeccionIngresosPromedio = promedioIngresosMensual * 12;
    const proyeccionEgresosPromedio = promedioEgresosMensual * 12;
    const proyeccionIngresosOptimista = proyeccionIngresosPromedio * 1.1;
    const proyeccionEgresosOptimista = proyeccionEgresosPromedio * 1.1;
    const proyeccionIngresosConservador = proyeccionIngresosPromedio * 0.9;
    const proyeccionEgresosConservador = proyeccionEgresosPromedio * 0.9;
    const balanceProyectado = proyeccionIngresosPromedio - proyeccionEgresosPromedio;
    const balanceOptimista = proyeccionIngresosOptimista - proyeccionEgresosOptimista;
    const balanceConservador = proyeccionIngresosConservador - proyeccionEgresosConservador;
    const margenProyectado = proyeccionIngresosPromedio > 0 ? (balanceProyectado / proyeccionIngresosPromedio) * 100 : 0;
    
    return {
        ingresosReales, egresosReales,
        promedioIngresosMensual, promedioEgresosMensual,
        proyeccionIngresosPromedio, proyeccionEgresosPromedio,
        proyeccionIngresosOptimista, proyeccionEgresosOptimista,
        proyeccionIngresosConservador, proyeccionEgresosConservador,
        balanceProyectado, balanceOptimista, balanceConservador, margenProyectado
    };
}

function renderProjections() {
    const p = calcularProyecciones();
    document.getElementById('realIngresos').innerHTML = `$${formatCLP(p.ingresosReales)}`;
    document.getElementById('realEgresos').innerHTML = `$${formatCLP(p.egresosReales)}`;
    document.getElementById('promedioIngresosMensual').innerHTML = `$${formatCLP(p.promedioIngresosMensual)}`;
    document.getElementById('promedioEgresosMensual').innerHTML = `$${formatCLP(p.promedioEgresosMensual)}`;
    document.getElementById('proyeccionIngresosPromedio').innerHTML = `$${formatCLP(p.proyeccionIngresosPromedio)}`;
    document.getElementById('proyeccionEgresosPromedio').innerHTML = `$${formatCLP(p.proyeccionEgresosPromedio)}`;
    document.getElementById('proyeccionIngresosOptimista').innerHTML = `$${formatCLP(p.proyeccionIngresosOptimista)}`;
    document.getElementById('proyeccionEgresosOptimista').innerHTML = `$${formatCLP(p.proyeccionEgresosOptimista)}`;
    document.getElementById('proyeccionIngresosConservador').innerHTML = `$${formatCLP(p.proyeccionIngresosConservador)}`;
    document.getElementById('proyeccionEgresosConservador').innerHTML = `$${formatCLP(p.proyeccionEgresosConservador)}`;
    document.getElementById('balanceProyectado').innerHTML = `$${formatCLP(p.balanceProyectado)}`;
    document.getElementById('balanceOptimista').innerHTML = `$${formatCLP(p.balanceOptimista)}`;
    document.getElementById('balanceConservador').innerHTML = `$${formatCLP(p.balanceConservador)}`;
    document.getElementById('margenProyectado').innerHTML = `${p.margenProyectado.toFixed(1)}%`;
}

function renderCompositionTables(fIng, fEgr) {
    // Ingresos
    const ingresosGrouped = groupByFixedCategoriesWithCount(fIng, INGRESOS_CATEGORIAS_PRINCIPALES);
    const ingresosBody = document.getElementById('ingresosCompositionBody');
    ingresosBody.innerHTML = '';
    ingresosGrouped.forEach(item => {
        const row = `<tr>
            <td><strong>${item.categoria}</strong></td>
            <td class="number-cell">${item.cantidad.toLocaleString('es-CL')}</td>
            <td class="number-cell">$${formatCLP(item.total)}</td>
            <td class="percentage-cell">${item.porcentaje.toFixed(1)}%</td>
        </tr>`;
        ingresosBody.insertAdjacentHTML('beforeend', row);
    });

    // Egresos
    const egresosGrouped = groupByFixedCategoriesWithCount(fEgr, EGRESOS_CATEGORIAS_PRINCIPALES);
    const egresosBody = document.getElementById('egresosCompositionBody');
    egresosBody.innerHTML = '';
    egresosGrouped.forEach(item => {
        const row = `<tr>
            <td><strong>${item.categoria}</strong></td>
            <td class="number-cell">${item.cantidad.toLocaleString('es-CL')}</td>
            <td class="number-cell">$${formatCLP(item.total)}</td>
            <td class="percentage-cell">${item.porcentaje.toFixed(1)}%</td>
        </tr>`;
        egresosBody.insertAdjacentHTML('beforeend', row);
    });
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
                { label: 'Monto Recaudado ($)', data: regularMensualMonto, type: 'bar', backgroundColor: '#2e9e73', borderRadius: 8, yAxisID: 'y', order: 2 },
                { label: 'Cantidad de Socios', data: regularMensualCantidad, type: 'line', borderColor: '#1e5c3a', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointBackgroundColor: '#1e5c3a', pointBorderColor: '#fff', pointRadius: 4, fill: false, yAxisID: 'y1', order: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { tooltip: { callbacks: { label: (ctx) => ctx.dataset.label === 'Monto Recaudado ($)' ? `$${formatCLP(ctx.raw)}` : `${ctx.raw} socios` } }, legend: { position: 'top', labels: { font: { size: 10 } } } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${formatCLP(v)}` }, title: { display: true, text: 'Monto en CLP', font: { size: 10 } } }, y1: { beginAtZero: true, position: 'right', ticks: { callback: (v) => `${v} socios` }, title: { display: true, text: 'Cantidad de Socios', font: { size: 10 } }, grid: { drawOnChartArea: false } }, x: { title: { display: true, text: 'Mes', font: { size: 10 } } } }
        }
    });
}

function renderRemuneracionesChart() {
    const { remuneracionesMensual, totalAnual, promedioMensual, maxMensual } = getRemuneracionesMensual();
    document.getElementById('totalRemuneracionesAnual').innerHTML = `$${formatCLP(totalAnual)}`;
    document.getElementById('promedioRemuneracionesMensual').innerHTML = `$${formatCLP(promedioMensual)}`;
    document.getElementById('maxRemuneracionesMensual').innerHTML = `$${formatCLP(maxMensual)}`;
    
    const ctx = document.getElementById('remuneracionesChart').getContext('2d');
    if (remuneracionesChart) remuneracionesChart.destroy();
    remuneracionesChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: mesesCortos, datasets: [{ label: 'REMUNERACIONES (CLP)', data: remuneracionesMensual, backgroundColor: '#b91c1c', borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { tooltip: { callbacks: { label: (ctx) => `$${formatCLP(ctx.raw)}` } }, legend: { position: 'top', labels: { font: { size: 10 } } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${formatCLP(v)}` }, title: { display: true, text: 'Monto en CLP', font: { size: 10 } } }, x: { title: { display: true, text: 'Mes', font: { size: 10 } } } } }
    });
}

function renderMonthlyStatsAndChart() {
    const stats = getMonthlyStats();
    
    document.getElementById('promedioIngresosAnual').innerHTML = `$${formatCLP(stats.promedioIngresos)}`;
    document.getElementById('promedioEgresosAnual').innerHTML = `$${formatCLP(stats.promedioEgresos)}`;
    document.getElementById('minIngresosMensual').innerHTML = `$${formatCLP(stats.minIngresos)}`;
    document.getElementById('minIngresosMes').innerHTML = stats.minIngresosMes > 0 ? monthNames[stats.minIngresosMes - 1] : '-';
    document.getElementById('maxIngresosMensual').innerHTML = `$${formatCLP(stats.maxIngresos)}`;
    document.getElementById('maxIngresosMes').innerHTML = stats.maxIngresosMes > 0 ? monthNames[stats.maxIngresosMes - 1] : '-';
    document.getElementById('minEgresosMensual').innerHTML = `$${formatCLP(stats.minEgresos)}`;
    document.getElementById('minEgresosMes').innerHTML = stats.minEgresosMes > 0 ? monthNames[stats.minEgresosMes - 1] : '-';
    document.getElementById('maxEgresosMensual').innerHTML = `$${formatCLP(stats.maxEgresos)}`;
    document.getElementById('maxEgresosMes').innerHTML = stats.maxEgresosMes > 0 ? monthNames[stats.maxEgresosMes - 1] : '-';
    
    const ctx = document.getElementById('monthlyComparisonChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctx, { 
        type: 'bar', 
        data: { labels: mesesCortos, datasets: [
            { label: 'Ingresos', data: stats.ingresosMensual, backgroundColor: '#2e7d64', borderRadius: 6 },
            { label: 'Egresos', data: stats.egresosMensual, backgroundColor: '#c96b4a', borderRadius: 6 }
        ]},
        options: { responsive: true, maintainAspectRatio: true, plugins: { tooltip: { callbacks: { label: (ctx) => `$${formatCLP(ctx.raw)}` } }, legend: { position: 'top', labels: { font: { size: 10 } } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${formatCLP(v)}` }, title: { display: true, text: 'Monto en CLP', font: { size: 10 } } }, x: { title: { display: true, text: 'Mes', font: { size: 10 } } } } }
    });
}

function renderDetailTables(fIng, fEgr) {
    let ingresos = [...fIng].sort((a,b) => (b.fecha || '').localeCompare(a.fecha || ''));
    document.getElementById('ingresosTableBody').innerHTML = ingresos.length ? ingresos.slice(0, 100).map(ing => `<tr>
        <td>${ing.iding || '-'}</td>
        <td>${ing.ticket || '-'}</td>
        <td>${ing.fecha ? ing.fecha.slice(0,10) : `${ing.anno}-${String(ing.mes).padStart(2,'0')}`}</td>
        <td>${ing.nomsocio || ing.tiping || '-'}</td>
        <td>${ing.categoria || '-'}</td>
        <td>${ing.subcategoria || '-'}</td>
        <td class="number-cell">$${formatCLP(ing.importe)}</td>
    </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;">📭 No hay ingresos para el año seleccionado</td></tr>';
    
    let egresos = [...fEgr].sort((a,b) => (b.fecha || '').localeCompare(a.fecha || ''));
    document.getElementById('egresosTableBody').innerHTML = egresos.length ? egresos.slice(0, 100).map(eg => `<tr>
        <td>${eg.fecha ? eg.fecha.slice(0,10) : `${eg.anno}-${String(eg.mes).padStart(2,'0')}`}</td>
        <td>${eg.categoria || '-'}</td>
        <td>${eg.subcategoria || '-'}</td>
        <td>${eg.nomproveedor || '-'}</td>
        <td>${eg.nomconcepto || '-'}</td>
        <td>${eg.motivo || '-'}</td>
        <td class="number-cell">$${formatCLP(eg.importe)}</td>
    </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;">📭 No hay egresos para el año seleccionado</td></tr>';
}

function updateUIAndCharts() {
    let filteredIngresos = ingresosData;
    let filteredEgresos = egresosData;
    if (currentMonth !== "all") {
        const monthNum = parseInt(currentMonth);
        filteredIngresos = ingresosData.filter(i => i.mes === monthNum);
        filteredEgresos = egresosData.filter(e => e.mes === monthNum);
    }
    const totalIng = filteredIngresos.reduce((s,i) => s + (i.importe||0), 0);
    const totalEgr = filteredEgresos.reduce((s,e) => s + (e.importe||0), 0);
    const balance = totalIng - totalEgr;
    const margen = totalIng > 0 ? ((balance / totalIng) * 100).toFixed(1) : 0;
    
    document.getElementById('balanceValue').innerHTML = `$${formatCLP(balance)}`;
    document.getElementById('totalIngresos').innerHTML = `$${formatCLP(totalIng)}`;
    document.getElementById('totalEgresos').innerHTML = `$${formatCLP(totalEgr)}`;
    document.getElementById('margenValue').innerHTML = `${margen}%`;
    const periodText = currentMonth === "all" ? `Acumulado ${YEAR}` : monthNames[parseInt(currentMonth)-1];
    document.getElementById('balanceSub').innerHTML = periodText;
    document.getElementById('ingresosSub').innerHTML = periodText;
    document.getElementById('egresosSub').innerHTML = periodText;
    document.getElementById('tablePeriodLabel').innerHTML = `(${periodText})`;
    
    renderProjections();
    renderCompositionTables(filteredIngresos, filteredEgresos);
    renderQuotaAnalysis(filteredIngresos);
    renderRegularEvolutionChart();
    renderRemuneracionesChart();
    renderMonthlyStatsAndChart();
    renderDetailTables(filteredIngresos, filteredEgresos);
}

function setupSearchHandlers() {
    const searchIngresos = document.getElementById('searchIngresos');
    const clearIngresos = document.getElementById('clearSearchIngresos');
    const searchEgresos = document.getElementById('searchEgresos');
    const clearEgresos = document.getElementById('clearSearchEgresos');
    searchIngresos.addEventListener('input', (e) => {
        ingresosSearchTerm = e.target.value.toLowerCase();
        let filteredIngresos = ingresosData;
        if (currentMonth !== "all") filteredIngresos = ingresosData.filter(i => i.mes === parseInt(currentMonth));
        filteredIngresos = filteredIngresos.filter(i => (i.nomsocio || i.tiping || '').toLowerCase().includes(ingresosSearchTerm) || (i.categoria || '').toLowerCase().includes(ingresosSearchTerm) || (i.ticket || '').toString().includes(ingresosSearchTerm));
        document.getElementById('ingresosTableBody').innerHTML = filteredIngresos.length ? filteredIngresos.slice(0,100).map(ing => `<tr>
            <td>${ing.iding || '-'}</td>
            <td>${ing.ticket || '-'}</td>
            <td>${ing.fecha ? ing.fecha.slice(0,10) : `${ing.anno}-${String(ing.mes).padStart(2,'0')}`}</td>
            <td>${ing.nomsocio || ing.tiping || '-'}</td>
            <td>${ing.categoria || '-'}</td>
            <td>${ing.subcategoria || '-'}</td>
            <td class="number-cell">$${formatCLP(ing.importe)}</td>
        </tr>`).join('') : '<tr><td colspan="7">📭 No hay ingresos</td></tr>';
    });
    clearIngresos.addEventListener('click', () => { searchIngresos.value = ''; ingresosSearchTerm = ''; updateUIAndCharts(); });
    searchEgresos.addEventListener('input', (e) => {
        egresosSearchTerm = e.target.value.toLowerCase();
        let filteredEgresos = egresosData;
        if (currentMonth !== "all") filteredEgresos = egresosData.filter(e => e.mes === parseInt(currentMonth));
        filteredEgresos = filteredEgresos.filter(e => (e.nomproveedor || '').toLowerCase().includes(egresosSearchTerm) || (e.nomconcepto || '').toLowerCase().includes(egresosSearchTerm) || (e.motivo || '').toLowerCase().includes(egresosSearchTerm) || (e.categoria || '').toLowerCase().includes(egresosSearchTerm));
        document.getElementById('egresosTableBody').innerHTML = filteredEgresos.length ? filteredEgresos.slice(0,100).map(eg => `<tr>
            <td>${eg.fecha ? eg.fecha.slice(0,10) : `${eg.anno}-${String(eg.mes).padStart(2,'0')}`}</td>
            <td>${eg.categoria || '-'}</td>
            <td>${eg.subcategoria || '-'}</td>
            <td>${eg.nomproveedor || '-'}</td>
            <td>${eg.nomconcepto || '-'}</td>
            <td>${eg.motivo || '-'}</td>
            <td class="number-cell">$${formatCLP(eg.importe)}</td>
        </tr>`).join('') : '<tr><td colspan="7">📭 No hay egresos</td></tr>';
    });
    clearEgresos.addEventListener('click', () => { searchEgresos.value = ''; egresosSearchTerm = ''; updateUIAndCharts(); });
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }));
}

// Configuración de los componentes visuales activados/desactivados por defecto
function setupToggleButtons() {
    const toggles = [
        { btnId: 'toggleKpiBtn', componentId: 'kpiSection' },
        { btnId: 'toggleCompositionBtn', componentId: 'compositionSection' },
        { btnId: 'toggleQuotaBtn', componentId: 'quotaSection' },
        { btnId: 'toggleRegularEvolutionBtn', componentId: 'regularEvolutionSection' },
        { btnId: 'toggleRemuneracionesBtn', componentId: 'remuneracionesSection' },
        { btnId: 'toggleMonthlyChartBtn', componentId: 'monthlyChartSection' },
        { btnId: 'toggleDetailTableBtn', componentId: 'detailTableSection' }
    ];

    toggles.forEach(t => {
        const btn = document.getElementById(t.btnId);
        const comp = document.getElementById(t.componentId);
        
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                btn.classList.add('inactive');
                comp.classList.add('hidden-component');
                if (comp.classList.contains('kpi-grid')) comp.classList.add('hidden-card');
            } else {
                btn.classList.remove('inactive');
                btn.classList.add('active');
                comp.classList.remove('hidden-component');
                if (comp.classList.contains('kpi-grid')) comp.classList.remove('hidden-card');
                
                // Redibujar gráficos si se vuelven visibles
                if (t.componentId === 'regularEvolutionSection' && regularEvolutionChart) {
                    regularEvolutionChart.resize();
                }
                if (t.componentId === 'remuneracionesSection' && remuneracionesChart) {
                    remuneracionesChart.resize();
                }
                if (t.componentId === 'monthlyChartSection' && monthlyChart) {
                    monthlyChart.resize();
                }
            }
        });
    });

    const resetBtn = document.getElementById('resetAllBtn');
    resetBtn.addEventListener('click', () => {
        document.getElementById('monthFilter').value = 'all';
        currentMonth = 'all';
        
        toggles.forEach(t => {
            const btn = document.getElementById(t.btnId);
            const comp = document.getElementById(t.componentId);
            btn.classList.remove('inactive');
            btn.classList.add('active');
            comp.classList.remove('hidden-component');
            if (comp.classList.contains('kpi-grid')) comp.classList.remove('hidden-card');
        });
        
        updateUIAndCharts();
    });
}

async function loadData() {
    try {
        const [ingresosResp, egresosResp] = await Promise.all([
            fetch(`./../data/ingresos-${YEAR}.json`), 
            fetch(`./../data/egresos-${YEAR}.json`)
        ]);
        if (!ingresosResp.ok || !egresosResp.ok) throw new Error('No se pudieron cargar los JSON');
        const ingresosJson = await ingresosResp.json();
        const egresosJson = await egresosResp.json();
        ingresosData = (ingresosJson.Ingresos || ingresosJson).filter(item => item.anno === YEAR);
        egresosData = (egresosJson.Egresos || egresosJson).filter(item => item.anno === YEAR);
        document.getElementById('monthFilter').addEventListener('change', (e) => { currentMonth = e.target.value; updateUIAndCharts(); });
        
        setupTabs();
        setupSearchHandlers();
        setupToggleButtons();
        updateUIAndCharts();
    } catch (error) {
        document.body.innerHTML = `<div style="padding:40px;text-align:center;color:red;">Error: ${error.message}<br>Verifica que los JSON tengan datos con anno=${YEAR}</div>`;
    }
}

loadData();
