// ======================== CARGA Y GESTIÓN DE DATOS ========================
let ingresosData = [];
let egresosData = [];
let allIngresosRaw = [];

// Conjuntos filtrados actuales para exportación
let currentFilteredIngresos = [];
let currentFilteredEgresos = [];

// Elementos DOM
const ingYear = document.getElementById('ingYearFilter');
const ingMonth = document.getElementById('ingMonthFilter');
const ingCategory = document.getElementById('ingCategoryFilter');
const ingSearch = document.getElementById('ingSearch');
const resetIng = document.getElementById('resetIngresos');

const egrYear = document.getElementById('egrYearFilter');
const egrMonth = document.getElementById('egrMonthFilter');
const egrCategory = document.getElementById('egrCategoryFilter');
const egrSearch = document.getElementById('egrSearch');
const resetEgr = document.getElementById('resetEgresos');

const ingTotalSpan = document.getElementById('ingTotalAmount');
const ingCountSpan = document.getElementById('ingCount');
const ingAvgSpan = document.getElementById('ingAvgTicket');
const ingBody = document.getElementById('ingresosBody');

const egrTotalSpan = document.getElementById('egrTotalAmount');
const egrCountSpan = document.getElementById('egrCount');
const egrAvgSpan = document.getElementById('egrAvgTicket');
const egrBody = document.getElementById('egresosBody');

// Modal
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

function isValidSocio(socioId) {
    return socioId && socioId !== 0 && socioId !== '0' && socioId !== 'null' && socioId !== '';
}

// Abrir modal con movimientos detallados del socio seleccionado
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
            fecha: ing.fecha ? ing.fecha.slice(0,10) : `${ing.anno}-${String(ing.mes).padStart(2,'0')}`,
            tipo: ing.tiping || 'Ingreso',
            categoria: ing.categoria,
            subcategoria: ing.subcategoria || '-',
            concepto: ing.nomsocio || ing.tiping || 'Ingreso',
            monto: monto
        });
    });
    
    movimientos.sort((a,b) => (b.fecha || '').localeCompare(a.fecha || ''));
    
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
    
    // Generar tarjetas de desglose por categoría en el modal
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

function renderIngresosTable(data) {
    if (data.length === 0) {
        ingBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">📭 No hay ingresos para los filtros seleccionados</td></tr>';
        return;
    }
    
    ingBody.innerHTML = data.map(i => {
        const idSocio = i.socio;
        const nombreSocio = i.nomsocio || i.tiping || '-';
        let socioDisplay = '';
        
        if (isValidSocio(idSocio)) {
            socioDisplay = `<span class="socio-link" onclick="openSocioModal('${idSocio}', '${nombreSocio.replace(/'/g, "\\'")}')">${idSocio}</span>`;
        } else {
            socioDisplay = '<span class="socio-empty">—</span>';
        }
        
        return `<tr>
            <td>${i.iding || '-'}</td>
            <td>${i.ticket || '-'}</td>
            <td>${i.fecha ? i.fecha.slice(0,10) : `${i.anno}-${String(i.mes).padStart(2,'0')}`}</td>
            <td>${i.tiping || '-'}</td>
            <td>${i.categoria || '-'}</td>
            <td>${socioDisplay}</td>
            <td>${nombreSocio}</td>
            <td class="number-cell">$${formatCLP(i.importe)}</td>
        </tr>`;
    }).join('');
}

function renderEgresosTable(data) {
    if (data.length === 0) {
        egrBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">📭 No hay egresos para los filtros seleccionados</td></tr>';
        return;
    }
    
    egrBody.innerHTML = data.map(e => `<tr>
        <td>${e.fecha ? e.fecha.slice(0,10) : `${e.anno}-${String(e.mes).padStart(2,'0')}`}</td>
        <td>${e.categoria || '-'}</td>
        <td>${e.nomproveedor || '-'}</td>
        <td>${e.nomconcepto || '-'}</td>
        <td>${e.motivo || '-'}</td>
        <td class="number-cell">$${formatCLP(e.importe)}</td>
    </tr>`).join('');
}

function updateCategoryFilters() {
    const ingCats = new Set();
    const egrCats = new Set();
    ingresosData.forEach(i => { if (i.categoria) ingCats.add(i.categoria); });
    egresosData.forEach(e => { if (e.categoria) egrCats.add(e.categoria); });
    
    const sortedIng = Array.from(ingCats).sort();
    const sortedEgr = Array.from(egrCats).sort();
    
    ingCategory.innerHTML = '<option value="all">Todas</option>';
    sortedIng.forEach(cat => { ingCategory.innerHTML += `<option value="${cat}">${cat}</option>`; });
    
    egrCategory.innerHTML = '<option value="all">Todas</option>';
    sortedEgr.forEach(cat => { egrCategory.innerHTML += `<option value="${cat}">${cat}</option>`; });
}

function filterIngresos() {
    const year = ingYear.value;
    const month = ingMonth.value;
    const category = ingCategory.value;
    const searchText = ingSearch.value.toLowerCase().trim();
    
    let filtered = [...ingresosData];
    if (year !== 'all') filtered = filtered.filter(i => i.anno === parseInt(year));
    if (month !== 'all') filtered = filtered.filter(i => i.mes === parseInt(month));
    if (category !== 'all') filtered = filtered.filter(i => i.categoria === category);
    if (searchText) {
        filtered = filtered.filter(i => 
            (i.nomsocio || '').toLowerCase().includes(searchText) ||
            (i.categoria || '').toLowerCase().includes(searchText) ||
            (i.tiping || '').toLowerCase().includes(searchText)
        );
    }
    
    filtered.sort((a,b) => (b.fecha || '').localeCompare(a.fecha || ''));
    
    // Guardar en la variable de exportación actual
    currentFilteredIngresos = filtered;
    
    const total = filtered.reduce((sum, i) => sum + (i.importe || 0), 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;
    
    ingTotalSpan.innerHTML = `$${formatCLP(total)}`;
    ingCountSpan.innerText = count;
    ingAvgSpan.innerHTML = `$${formatCLP(avg)}`;
    
    renderIngresosTable(filtered);
}

function filterEgresos() {
    const year = egrYear.value;
    const month = egrMonth.value;
    const category = egrCategory.value;
    const searchText = egrSearch.value.toLowerCase().trim();
    
    let filtered = [...egresosData];
    if (year !== 'all') filtered = filtered.filter(e => e.anno === parseInt(year));
    if (month !== 'all') filtered = filtered.filter(e => e.mes === parseInt(month));
    if (category !== 'all') filtered = filtered.filter(e => e.categoria === category);
    if (searchText) {
        filtered = filtered.filter(e => 
            (e.nomproveedor || '').toLowerCase().includes(searchText) ||
            (e.nomconcepto || '').toLowerCase().includes(searchText) ||
            (e.motivo || '').toLowerCase().includes(searchText) ||
            (e.categoria || '').toLowerCase().includes(searchText)
        );
    }
    
    filtered.sort((a,b) => (b.fecha || '').localeCompare(a.fecha || ''));
    
    // Guardar en la variable de exportación actual
    currentFilteredEgresos = filtered;
    
    const total = filtered.reduce((sum, e) => sum + (e.importe || 0), 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;
    
    egrTotalSpan.innerHTML = `$${formatCLP(total)}`;
    egrCountSpan.innerText = count;
    egrAvgSpan.innerHTML = `$${formatCLP(avg)}`;
    
    renderEgresosTable(filtered);
}

// Función para escapar campos de CSV de forma segura
function escapeCSVCell(val) {
    if (val === null || val === undefined) {
        return '""';
    }
    if (typeof val === 'number') {
        return val;
    }
    let str = String(val).trim();
    // Reemplazar comillas dobles por dobles-comillas
    str = str.replace(/"/g, '""');
    return `"${str}"`;
}

// Lógica de exportación de datos a Excel en formato CSV neutro y compatible sin advertencias
function exportToExcel(type) {
    let data = [];
    let filename = "";
    let headers = [];
    let contentRows = "";
    
    if (type === 'ingresos') {
        data = currentFilteredIngresos;
        filename = "Ingresos_Club_Tenis";
        headers = ["ID", "Ticket", "Fecha", "Tipo", "Categoría", "ID Socio", "Nombre Socio", "Monto"];
        
        data.forEach(i => {
            const idSocio = i.socio || '';
            const nombreSocio = i.nomsocio || i.tiping || '-';
            const iding = i.iding || '-';
            const ticket = i.ticket || '-';
            const fecha = i.fecha ? i.fecha.slice(0, 10) : `${i.anno}-${String(i.mes).padStart(2, '0')}`;
            const tipo = i.tiping || '-';
            const categoria = i.categoria || '-';
            const importe = i.importe || 0;

            const row = [
                iding,
                ticket,
                fecha,
                tipo,
                categoria,
                idSocio,
                nombreSocio,
                importe
            ];
            contentRows += row.map(escapeCSVCell).join('\t') + '\r\n';
        });
    } else {
        data = currentFilteredEgresos;
        filename = "Egresos_Club_Tenis";
        headers = ["Fecha", "Categoría", "Proveedor", "Concepto", "Motivo", "Monto"];
        
        data.forEach(e => {
            const fecha = e.fecha ? e.fecha.slice(0, 10) : `${e.anno}-${String(e.mes).padStart(2, '0')}`;
            const categoria = e.categoria || '-';
            const proveedor = e.nomproveedor || '-';
            const concepto = e.nomconcepto || '-';
            const motivo = e.motivo || '-';
            const importe = e.importe || 0;

            const row = [
                fecha,
                categoria,
                proveedor,
                concepto,
                motivo,
                importe
            ];
            contentRows += row.map(escapeCSVCell).join('\t') + '\r\n';
        });
    }
    
    const headerRow = headers.map(escapeCSVCell).join('\t');
    const csvContent = "\ufeff" + headerRow + "\r\n" + contentRows;
    
    // Convertir a UTF-16LE ArrayBuffer
    const buffer = new ArrayBuffer(csvContent.length * 2);
    const view = new Uint16Array(buffer);
    for (let i = 0; i < csvContent.length; i++) {
        view[i] = csvContent.charCodeAt(i);
    }
    
    const blob = new Blob([view], { type: 'text/csv;charset=utf-16le;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadData() {
    try {
        const [ingresosResp, egresosResp] = await Promise.all([
            fetch('./../data/ingresos-all.json'),
            fetch('./../data/egresos-all.json')
        ]);
        if (!ingresosResp.ok || !egresosResp.ok) throw new Error('No se pudieron cargar los JSON');
        
        const ingresosJson = await ingresosResp.json();
        const egresosJson = await egresosResp.json();
        allIngresosRaw = ingresosJson.Ingresos || ingresosJson;
        ingresosData = allIngresosRaw.filter(i => i.anno >= 2023 && i.anno <= 2026);
        egresosData = (egresosJson.Egresos || egresosJson).filter(e => e.anno >= 2023 && e.anno <= 2026);
        
        updateCategoryFilters();
        filterIngresos();
        filterEgresos();
        
        // Listeners Pestaña Ingresos
        ingYear.addEventListener('change', () => filterIngresos());
        ingMonth.addEventListener('change', () => filterIngresos());
        ingCategory.addEventListener('change', () => filterIngresos());
        ingSearch.addEventListener('input', () => filterIngresos());
        resetIng.addEventListener('click', () => {
            ingYear.value = 'all';
            ingMonth.value = 'all';
            ingCategory.value = 'all';
            ingSearch.value = '';
            filterIngresos();
        });
        document.getElementById('exportIngresos').addEventListener('click', () => exportToExcel('ingresos'));
        
        // Listeners Pestaña Egresos
        egrYear.addEventListener('change', () => filterEgresos());
        egrMonth.addEventListener('change', () => filterEgresos());
        egrCategory.addEventListener('change', () => filterEgresos());
        egrSearch.addEventListener('input', () => filterEgresos());
        resetEgr.addEventListener('click', () => {
            egrYear.value = 'all';
            egrMonth.value = 'all';
            egrCategory.value = 'all';
            egrSearch.value = '';
            filterEgresos();
        });
        document.getElementById('exportEgresos').addEventListener('click', () => exportToExcel('egresos'));
        
        // Gestión de Pestañas (Tabs)
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        closeModal.onclick = () => { modal.style.display = 'none'; };
        window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
        
    } catch (error) {
        console.error(error);
        ingBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">❌ Error al cargar datos</td></tr>';
        egrBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">❌ Error al cargar datos</td></tr>';
    }
}

// Hacer globales las funciones que lo requieran
window.openSocioModal = openSocioModal;

// Carga inicial
loadData();
