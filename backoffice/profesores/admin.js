// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// State
let currentUser = null;
let currentProfile = null;
let activeCourts = [];
let allReservations = []; // Used locally to check conflicts and show lists
let selectedCalendarDate = "";
let pendingResToApprove = [];
let targetCourtForApprove = null;

// Configuration Constants for Calendar
const BOOKING_HOURS = [];
for (let h = 8; h <= 21; h++) {
    const hh = String(h).padStart(2, '0');
    BOOKING_HOURS.push(`${hh}:00`);
    BOOKING_HOURS.push(`${hh}:30`);
}
BOOKING_HOURS.push("22:00");

function getDurationInHours(startStr, endStr) {
    if (!startStr || !endStr) return 1;
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    return (endMin - startMin) / 60;
}

// Bootstrap Modal Instances
let approveModalInstance = null;
let rejectModalInstance = null;
let paymentModalInstance = null;
let confirmBulkModalInstance = null;
let detailsModalInstance = null;
let toastInstance = null;

// DOM elements - Views & Overlays
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// DOM elements - Dashboard general
const userNameDisplay = document.getElementById('userNameDisplay');
const btnSignOut = document.getElementById('btnSignOut');

// DOM elements - Admin lists
const adminPendientesBody = document.getElementById('adminPendientesBody');
const adminHistorialBody = document.getElementById('adminHistorialBody');
const adminCanchasBody = document.getElementById('adminCanchasBody');
const adminProfesoresBody = document.getElementById('adminProfesoresBody');

// DOM elements - Admin forms
const addCourtForm = document.getElementById('addCourtForm');
const courtName = document.getElementById('courtName');

// DOM elements - Modals
const approveModal = document.getElementById('approveModal');
const closeApproveModal = document.getElementById('closeApproveModal');
const approveForm = document.getElementById('approveForm');
const approveReservaId = document.getElementById('approveReservaId');
const approveReservaFecha = document.getElementById('approveReservaFecha');
const approveReservaInicio = document.getElementById('approveReservaInicio');
const approveReservaFin = document.getElementById('approveReservaFin');
const approveCanchaSelect = document.getElementById('approveCanchaSelect');
const approveEsSocio = document.getElementById('approveEsSocio');
const approvePaidSwitch = document.getElementById('approvePaidSwitch');
const approveNumeroTicket = document.getElementById('approveNumeroTicket');
const approveMonto = document.getElementById('approveMonto');
const approveMetodoPago = document.getElementById('approveMetodoPago');
const approvePaymentNotas = document.getElementById('approvePaymentNotas');
const approveNotes = document.getElementById('approveNotes');
const conflictWarningBox = document.getElementById('conflictWarningBox');
const overlapPendingAlert = document.getElementById('overlapPendingAlert');

const rejectModal = document.getElementById('rejectModal');
const closeRejectModal = document.getElementById('closeRejectModal');
const rejectForm = document.getElementById('rejectForm');
const rejectReservaId = document.getElementById('rejectReservaId');
const rejectNotes = document.getElementById('rejectNotes');

// DOM elements - Payment Modal
const paymentModal = document.getElementById('paymentModal');
const paymentForm = document.getElementById('paymentForm');
const paymentReservaId = document.getElementById('paymentReservaId');
const paymentNumeroTicket = document.getElementById('paymentNumeroTicket');
const paymentMonto = document.getElementById('paymentMonto');
const paymentMetodoPago = document.getElementById('paymentMetodoPago');
const paymentPaymentNotas = document.getElementById('paymentPaymentNotas');
const paymentModalTitle = document.getElementById('paymentModalTitle');

// Overlay Helper Functions
function showOverlay(text) {
    if (loadingOverlay) {
        if (loadingText) loadingText.innerText = text;
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
        loadingOverlay.style.visibility = 'visible';
    }
}

function hideOverlay() {
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.visibility = 'hidden';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

// Show Professional Bootstrap Toast Notifications
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('appToast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    if (!toastEl || !toastMsg || !toastIcon) {
        console.warn("Toast elements not found, falling back to alert: ", message);
        alert(message);
        return;
    }
    toastMsg.innerText = message;
    
    // Set colors & icons based on notification type
    if (type === 'success') {
        toastEl.className = "toast align-items-center text-white bg-success border-0";
        toastIcon.innerHTML = '<i class="fas fa-check-circle fs-5"></i>';
    } else if (type === 'danger' || type === 'error') {
        toastEl.className = "toast align-items-center text-white bg-danger border-0";
        toastIcon.innerHTML = '<i class="fas fa-exclamation-circle fs-5"></i>';
    } else if (type === 'warning') {
        toastEl.className = "toast align-items-center text-dark bg-warning border-0";
        toastIcon.innerHTML = '<i class="fas fa-exclamation-triangle fs-5"></i>';
    } else {
        toastEl.className = "toast align-items-center text-white bg-primary border-0";
        toastIcon.innerHTML = '<i class="fas fa-info-circle fs-5"></i>';
    }
    
    if (toastInstance) {
        toastInstance.show();
    } else if (window.bootstrap) {
        toastInstance = new bootstrap.Toast(toastEl, { delay: 4000 });
        toastInstance.show();
    } else {
        alert(message);
    }
}

// Format Utilities
function formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // converts 09:30:00 to 09:30
}

function formatProfNameShort(firstName, lastName) {
    if (!firstName && !lastName) return 'Profesor';
    const firstChar = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastNamePart = lastName || '';
    return firstChar ? `${firstChar}.${lastNamePart}` : lastNamePart;
}

function formatCLP(amount) {
    if (amount === undefined || amount === null || amount === '') return '-';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
}

const monthNames = {
    '01': 'Enero',
    '02': 'Febrero',
    '03': 'Marzo',
    '04': 'Abril',
    '05': 'Mayo',
    '06': 'Junio',
    '07': 'Julio',
    '08': 'Agosto',
    '09': 'Septiembre',
    '10': 'Octubre',
    '11': 'Noviembre',
    '12': 'Diciembre'
};

function getMonthName(yearMonthStr) {
    if (!yearMonthStr || yearMonthStr.length < 7) return yearMonthStr;
    const [year, month] = yearMonthStr.split('-');
    const monthName = monthNames[month] || month;
    return `${monthName} ${year}`;
}

function parseAdminNotes(notesStr) {
    let pago = 'N';
    let numero_ticket = '';
    let monto = '';
    let metodo_pago = '';
    let notas = '';
    let comentarios = '';
    
    if (notesStr) {
        if (notesStr.startsWith('{')) {
            try {
                const parsed = JSON.parse(notesStr);
                pago = parsed.pago || 'N';
                numero_ticket = parsed.numero_ticket || '';
                monto = parsed.monto !== undefined && parsed.monto !== null ? parsed.monto : '';
                metodo_pago = parsed.metodo_pago || '';
                notas = parsed.notas || '';
                comentarios = parsed.comentarios || '';
            } catch (e) {
                comentarios = notesStr;
            }
        } else {
            comentarios = notesStr;
        }
    }
    
    // For backwards compatibility or displaying a summary:
    let pagoDetalle = '';
    if (pago === 'S') {
        const details = [];
        if (metodo_pago) details.push(metodo_pago.toUpperCase());
        if (numero_ticket) details.push(`N° ${numero_ticket}`);
        if (monto) details.push(`$${monto}`);
        if (notas) details.push(`(${notas})`);
        pagoDetalle = details.join(' - ') || 'Pagado';
    }
    
    return { pago, numero_ticket, monto, metodo_pago, notas, comentarios, pagoDetalle };
}

// Initial Boot Loader
document.addEventListener('DOMContentLoaded', async () => {
    // Check session
    const { data: { session }, error } = await db.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        showOverlay("Cargando perfil...");
        const profileOk = await loadUserProfile();
        if (profileOk && currentProfile.rol === 'admin') {
            userNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> Sesión: <strong>${currentProfile.nombre} ${currentProfile.apellido}</strong> (${currentProfile.rol.toUpperCase()})`;
            // Set default date for calendar to today's local date
            selectedCalendarDate = new Date().toLocaleDateString('sv-SE');
            const calDateInput = document.getElementById('calendarDateInput');
            if (calDateInput) {
                calDateInput.value = selectedCalendarDate;
            }
            
            setupDashboardListeners();
            await loadAdminData();
        } else {
            // Unauthorized or failed profile load
            if (profileOk && currentProfile.rol === 'profesor') {
                window.location.href = 'profesor_menu.html';
            } else {
                await db.auth.signOut();
                window.location.href = 'index.html';
            }
        }
    } else {
        window.location.href = 'index.html';
    }
});

// Fetch user profile from public.usuarios
async function loadUserProfile() {
    try {
        const { data, error } = await db.from('usuarios').select('*').eq('id', currentUser.id).single();
        if (error) {
            console.error("Error loading user profile:", error);
            return false;
        }
        currentProfile = data;
        return true;
    } catch (e) {
        console.error("Profile check error:", e);
        return false;
    }
}

// Load Admin Dashboard Data
async function loadAdminData() {
    showOverlay("Cargando panel de administración...");
    try {
        // 1. Fetch active courts for selectors and table
        const { data: courts, error: err1 } = await db.from('canchas').select('*').order('id', { ascending: true });
        if (err1) throw err1;
        
        activeCourts = courts || [];
        
        // Populate Court Select inside approval modal
        approveCanchaSelect.innerHTML = '<option value="" disabled selected>Selecciona una cancha...</option>' +
            activeCourts.filter(c => c.activa).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            
        // Render courts in manage tab
        adminCanchasBody.innerHTML = activeCourts.map(c => `
            <tr>
                <td data-label="ID">${c.id}</td>
                <td data-label="Nombre Cancha"><strong>${c.nombre}</strong></td>
                <td data-label="Estado"><span class="status-badge ${c.activa ? 'aprobada' : 'cancelada'}">${c.activa ? 'Activa' : 'Inactiva'}</span></td>
                <td data-label="Acción">
                    <button class="btn-action-sm btn-cancel btn-toggle-cancha" data-id="${c.id}" data-activa="${c.activa}">
                        <i class="fas fa-power-off"></i> ${c.activa ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `).join('');

        // 2. Fetch all teachers (usuarios table where role === profesor)
        const { data: teachers, error: err2 } = await db.from('usuarios').select('*').eq('rol', 'profesor').order('nombre', { ascending: true });
        if (err2) throw err2;
        
        adminProfesoresBody.innerHTML = (teachers || []).map(t => `
            <tr>
                <td data-label="ID">${t.id.slice(0, 8)}...</td>
                <td data-label="Nombre"><strong>${t.nombre} ${t.apellido}</strong></td>
                <td data-label="Teléfono">${t.telefono || '-'}</td>
            </tr>
        `).join('');

        // 3. Fetch all bookings
        const { data: resData, error: err3 } = await db.from('reservas')
            .select(`
                id, fecha, hora_inicio, hora_fin, estado, notas_admin, alumno_nombre, profesor_id, cancha_id, es_socio,
                usuarios!profesor_id(nombre, apellido),
                canchas!cancha_id(nombre)
            `);
        if (err3) throw err3;
        allReservations = resData || [];

        // 4. Update Statistics Cards
        const pendingCount = allReservations.filter(r => r.estado === 'pendiente').length;
        const approvedCount = allReservations.filter(r => r.estado === 'aprobada').length;
        const rejectedCount = allReservations.filter(r => r.estado === 'rechazada').length;
        
        document.getElementById('statPendingCount').innerText = pendingCount;
        document.getElementById('statApprovedCount').innerText = approvedCount;
        document.getElementById('statRejectedCount').innerText = rejectedCount;

        // 5. Update Professor Booking Equity Breakdown
        const teacherMap = {};
        (teachers || []).forEach(t => {
            teacherMap[t.id] = {
                name: `${t.nombre} ${t.apellido}`,
                approvedCount: 0
            };
        });
        
        allReservations.forEach(r => {
            if (r.estado === 'aprobada' && r.profesor_id && teacherMap[r.profesor_id]) {
                teacherMap[r.profesor_id].approvedCount++;
            }
        });
        
        const totalApproved = Object.values(teacherMap).reduce((sum, curr) => sum + curr.approvedCount, 0);
        const equityList = Object.values(teacherMap).sort((a, b) => b.approvedCount - a.approvedCount);
        
        const equityContainer = document.getElementById('equityBreakdownContainer');
        if (equityContainer) {
            if (equityList.length === 0) {
                equityContainer.innerHTML = '<div class="text-muted text-center" style="font-size: 0.85rem; padding: 15px;">No hay profesores registrados.</div>';
            } else {
                equityContainer.innerHTML = equityList.map(item => {
                    const count = item.approvedCount;
                    const pct = totalApproved > 0 ? Math.round((count / totalApproved) * 100) : 0;
                    return `
                        <div class="equity-row mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.82rem; font-weight: 600;">
                                <span style="color: #1e3a2f;"><i class="fas fa-user-tie" style="color: #1e5c3a; margin-right: 6px;"></i> ${item.name}</span>
                                <span class="badge bg-success" style="border-radius: 10px; font-size: 0.78rem; padding: 3px 7px;">${count} res. (${pct}%)</span>
                            </div>
                            <div class="equity-bar-container" style="background: #e8f0ea; border-radius: 10px; height: 8px; overflow: hidden; position: relative;">
                                <div class="equity-bar-fill" style="width: ${pct}%; background: #1e5c3a; height: 100%; border-radius: 10px; transition: width 0.6s ease-in-out;"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 6. Render Solicitudes Pendientes
        const pendingRes = allReservations.filter(r => r.estado === 'pendiente');
        pendingRes.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
        
        const btnBulk = document.getElementById('btnApproveAllDefault');
        if (btnBulk) {
            const hasAnyOverlap = pendingRes.some(r => {
                const overlapsWithPending = pendingRes.some(other =>
                    other.id !== r.id &&
                    other.fecha === r.fecha &&
                    (other.hora_inicio < r.hora_fin && other.hora_fin > r.hora_inicio)
                );
                
                const court6 = activeCourts.find(c => c.activa && c.nombre.toLowerCase().includes('cancha 6'));
                const court6Id = court6 ? court6.id : null;
                const overlapsWithApprovedOnCancha6 = court6Id && allReservations.some(other =>
                    other.estado === 'aprobada' &&
                    other.cancha_id === court6Id &&
                    other.fecha === r.fecha &&
                    (other.hora_inicio < r.hora_fin && other.hora_fin > r.hora_inicio)
                );
                
                return overlapsWithPending || overlapsWithApprovedOnCancha6;
            });
            
            if (pendingRes.length === 0) {
                btnBulk.disabled = true;
                btnBulk.title = "No hay solicitudes pendientes.";
                btnBulk.innerHTML = `<i class="fas fa-check-double"></i> Aprobación Masiva (Cancha 6)`;
                btnBulk.style.backgroundColor = ""; // Reset inline color to use stylesheet default
            } else if (hasAnyOverlap) {
                btnBulk.disabled = true;
                btnBulk.title = "Resuelve los traslapes de horario y conflictos en Cancha 6 antes de usar la aprobación masiva.";
                btnBulk.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Aprobación Deshabilitada (Traslape)`;
                btnBulk.style.backgroundColor = "#b91c1c"; // Red when disabled due to conflict
            } else {
                btnBulk.disabled = false;
                btnBulk.title = "Aprobar todas las solicitudes pendientes por defecto en Cancha 6.";
                btnBulk.innerHTML = `<i class="fas fa-check-double"></i> Aprobación Masiva (Cancha 6)`;
                btnBulk.style.backgroundColor = "#15803d"; // Green when enabled
            }
        }

        if (pendingRes.length === 0) {
            adminPendientesBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">🙌 No hay solicitudes pendientes de asignación.</td></tr>';
        } else {
            adminPendientesBody.innerHTML = pendingRes.map(r => {
                const start = formatTime(r.hora_inicio);
                const end = formatTime(r.hora_fin);
                const profName = r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido}` : 'Profesor';
                const parsedNotes = parseAdminNotes(r.notas_admin);
                const notes = parsedNotes.comentarios || '-';
                
                const socioBadge = r.es_socio === 'S' 
                    ? '<span class="badge bg-success text-white ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;">Socio</span>' 
                    : '<span class="badge bg-secondary text-white ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;">Visita</span>';
                
                // Check overlaps
                const hasPendingOverlap = pendingRes.some(other =>
                    other.id !== r.id &&
                    other.fecha === r.fecha &&
                    (other.hora_inicio < r.hora_fin && other.hora_fin > r.hora_inicio)
                );
                
                const overlapWarningBadge = hasPendingOverlap 
                    ? '<span class="badge bg-warning text-dark ms-1 d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; border-radius: 8px; padding: 2px 6px;" title="Traslape detectado con otra solicitud pendiente"><i class="fas fa-exclamation-triangle"></i> Traslape</span>'
                    : '';
                
                return `
                    <tr>
                        <td data-label="Profesor"><strong>${profName}</strong></td>
                        <td data-label="Fecha">${r.fecha}</td>
                        <td data-label="Horario">${start} - ${end} ${overlapWarningBadge}</td>
                        <td data-label="Alumno">${r.alumno_nombre} ${socioBadge}</td>
                        <td data-label="Notas Prof.">${notes}</td>
                        <td data-label="Acciones">
                            <button class="btn-action-sm btn-approve btn-admin-approve btn-action-round" data-id="${r.id}" data-fecha="${r.fecha}" data-inicio="${r.hora_inicio}" data-fin="${r.hora_fin}" title="Asignar Cancha"><i class="fas fa-check"></i></button>
                            <button class="btn-action-sm btn-reject btn-admin-reject btn-action-round" data-id="${r.id}" title="Rechazar Solicitud"><i class="fas fa-times"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // 7. Render Historial General
        const historyRes = allReservations.filter(r => r.estado !== 'pendiente');
        historyRes.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora_inicio.localeCompare(a.hora_inicio));
        
        if (historyRes.length === 0) {
            adminHistorialBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">📭 No hay reservas resueltas.</td></tr>';
        } else {
            adminHistorialBody.innerHTML = historyRes.map(r => {
                const start = formatTime(r.hora_inicio);
                const end = formatTime(r.hora_fin);
                const profName = r.usuarios ? formatProfNameShort(r.usuarios.nombre, r.usuarios.apellido) : 'Profesor';
                
                const { pago, numero_ticket, monto, pagoDetalle } = parseAdminNotes(r.notas_admin);
                
                let paymentBtn = '';
                if (r.estado === 'aprobada') {
                    if (pago === 'S') {
                        paymentBtn = `<button class="btn-action-sm btn-edit-pago btn-action-round" data-id="${r.id}" title="Pago registrado: ${pagoDetalle}" style="background-color: #15803d; color: white;"><i class="fas fa-dollar-sign"></i></button>`;
                    } else {
                        paymentBtn = `<button class="btn-action-sm btn-edit-pago btn-action-round" data-id="${r.id}" title="Sin pago registrado. Hacer clic para ingresar pago." style="background-color: #d97706; color: white;"><i class="fas fa-dollar-sign"></i></button>`;
                    }
                } else {
                    paymentBtn = '-';
                }
                
                return `
                    <tr class="clickable-row" data-id="${r.id}" style="cursor: pointer;">
                        <td data-label="Profesor"><strong>${profName}</strong></td>
                        <td data-label="Fecha">${r.fecha}</td>
                        <td data-label="Horario">${start} - ${end}</td>
                        <td data-label="Estado"><span class="status-badge ${r.estado}">${r.estado}</span></td>
                        <td data-label="Pago">${paymentBtn}</td>
                        <td data-label="Ticket">${numero_ticket || '-'}</td>
                        <td data-label="Monto">${formatCLP(monto)}</td>
                    </tr>
                `;
            }).join('');
        }

        // 8. Update Payments Statistics (Acumulado and Mensual)
        const adminPagosAcumuladoBody = document.getElementById('adminPagosAcumuladoBody');
        const adminPagosMensualBody = document.getElementById('adminPagosMensualBody');
        
        if (adminPagosAcumuladoBody && adminPagosMensualBody) {
            const accumulatedMap = {};
            const monthlyMap = {}; // key: YYYY-MM -> key: profId -> { name, tickets, totalMonto }
            
            allReservations.forEach(r => {
                if (r.estado !== 'aprobada') return;
                const { pago, monto } = parseAdminNotes(r.notas_admin);
                if (pago !== 'S') return;
                
                const profId = r.profesor_id || 'unknown';
                const profName = r.usuarios 
                    ? formatProfNameShort(r.usuarios.nombre, r.usuarios.apellido)
                    : 'Profesor';
                const amountVal = parseFloat(monto) || 0;
                
                // 1. Accumulate
                if (!accumulatedMap[profId]) {
                    accumulatedMap[profId] = {
                        name: profName,
                        tickets: 0,
                        totalMonto: 0
                    };
                }
                accumulatedMap[profId].tickets += 1;
                accumulatedMap[profId].totalMonto += amountVal;
                
                // 2. Monthly
                const monthKey = r.fecha ? r.fecha.slice(0, 7) : 'Sin Fecha';
                if (!monthlyMap[monthKey]) {
                    monthlyMap[monthKey] = {};
                }
                if (!monthlyMap[monthKey][profId]) {
                    monthlyMap[monthKey][profId] = {
                        name: profName,
                        tickets: 0,
                        totalMonto: 0
                    };
                }
                monthlyMap[monthKey][profId].tickets += 1;
                monthlyMap[monthKey][profId].totalMonto += amountVal;
            });
            
            // Render Accumulate Table
            const accumulatedList = Object.values(accumulatedMap);
            // Sort by totalMonto descending
            accumulatedList.sort((a, b) => b.totalMonto - a.totalMonto);
            
            if (accumulatedList.length === 0) {
                adminPagosAcumuladoBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">No hay pagos registrados.</td></tr>';
            } else {
                adminPagosAcumuladoBody.innerHTML = accumulatedList.map(item => `
                    <tr>
                        <td data-label="Profesor"><strong>${item.name}</strong></td>
                        <td data-label="Tickets" style="text-align: center;">${item.tickets}</td>
                        <td data-label="Total CLP" style="text-align: right; font-weight: 600; color: #15803d;">${formatCLP(item.totalMonto)}</td>
                    </tr>
                `).join('');
            }
            
            // Render Monthly Table
            // Sort months descending (newest month first)
            const sortedMonths = Object.keys(monthlyMap).sort((a, b) => b.localeCompare(a));
            const monthlyRows = [];
            
            sortedMonths.forEach(monthKey => {
                const monthDisplay = monthKey === 'Sin Fecha' ? monthKey : getMonthName(monthKey);
                const profsInMonth = Object.values(monthlyMap[monthKey]);
                // Sort by totalMonto descending within the month
                profsInMonth.sort((a, b) => b.totalMonto - a.totalMonto);
                
                profsInMonth.forEach(item => {
                    monthlyRows.push(`
                        <tr>
                            <td data-label="Mes"><strong>${monthDisplay}</strong></td>
                            <td data-label="Profesor"><strong>${item.name}</strong></td>
                            <td data-label="Tickets" style="text-align: center;">${item.tickets}</td>
                            <td data-label="Total CLP" style="text-align: right; font-weight: 600; color: #15803d;">${formatCLP(item.totalMonto)}</td>
                        </tr>
                    `);
                });
            });
            
            if (monthlyRows.length === 0) {
                adminPagosMensualBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No hay pagos registrados.</td></tr>';
            } else {
                adminPagosMensualBody.innerHTML = monthlyRows.join('');
            }
        }

        // Render daily calendar
        await renderCalendarGrid(selectedCalendarDate);

    } catch (e) {
        console.error(e);
        showToast("Error cargando panel de admin: " + e.message, "danger");
    } finally {
        hideOverlay();
    }
}

// Toggle Court active/inactive
async function toggleCanchaActiva(canchaId, activeState) {
    showOverlay("Actualizando cancha...");
    try {
        const { error } = await db.from('canchas')
            .update({ activa: !activeState })
            .eq('id', canchaId);
        if (error) throw error;
        showToast("¡Estado de cancha actualizado!", "success");
        await loadAdminData();
    } catch (err) {
        showToast("Error al actualizar cancha: " + err.message, "danger");
        hideOverlay();
    }
}

// Conflict checker trigger on Court select change in Approve Modal
if (approveCanchaSelect) {
    approveCanchaSelect.addEventListener('change', () => {
        const selectedCanchaId = Number(approveCanchaSelect.value);
        const fecha = approveReservaFecha.value;
        const inicio = approveReservaInicio.value;
        const fin = approveReservaFin.value;
        
        // Find if any reservation conflicts
        const conflict = allReservations.find(r => 
            r.estado === 'aprobada' &&
            Number(r.cancha_id) === selectedCanchaId &&
            r.fecha === fecha &&
            (r.hora_inicio < fin && r.hora_fin > inicio)
        );
        
        if (conflict) {
            const profName = conflict.usuarios ? `${conflict.usuarios.nombre} ${conflict.usuarios.apellido}` : 'otro profesor';
            conflictWarningBox.innerHTML = `⚠️ <strong>Conflicto detectado:</strong> La cancha ya se encuentra reservada de <strong>${formatTime(conflict.hora_inicio)} a ${formatTime(conflict.hora_fin)}</strong> por el profesor <strong>${profName}</strong>.`;
            conflictWarningBox.style.display = 'block';
        } else {
            conflictWarningBox.style.display = 'none';
        }
    });
}

// Open Approve Modal
function openApproveModal(id, fecha, inicio, fin) {
    approveReservaId.value = id;
    approveReservaFecha.value = fecha;
    approveReservaInicio.value = inicio;
    approveReservaFin.value = fin;
    approveNotes.value = '';
    conflictWarningBox.style.display = 'none';
    
    // Find the request to pre-populate the es_socio status
    const r = allReservations.find(res => res.id === id);
    if (r && approveEsSocio) {
        approveEsSocio.checked = (r.es_socio === 'S');
    }
    if (approvePaidSwitch) {
        approvePaidSwitch.checked = false;
        approvePaidSwitch.dispatchEvent(new Event('change'));
    }
    if (approveNumeroTicket) approveNumeroTicket.value = '';
    if (approveMonto) approveMonto.value = '';
    if (approveMetodoPago) approveMetodoPago.value = 'transferencia';
    if (approvePaymentNotas) approvePaymentNotas.value = '';
    
    // Find overlapping pending requests
    const overlappingPendings = allReservations.filter(r =>
        r.id !== id &&
        r.estado === 'pendiente' &&
        r.fecha === fecha &&
        (r.hora_inicio < fin && r.hora_fin > inicio)
    );
    
    if (overlappingPendings.length > 0 && overlapPendingAlert) {
        const listText = overlappingPendings.map(r => {
            const start = formatTime(r.hora_inicio);
            const end = formatTime(r.hora_fin);
            const profName = r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido}` : 'otro profesor';
            const socioText = r.es_socio === 'S' ? 'Socio' : 'Visita';
            return `<li>Profesor: <strong>${profName}</strong> (Alumno: ${r.alumno_nombre} [${socioText}]) de <strong>${start} a ${end}</strong></li>`;
        }).join('');
        
        overlapPendingAlert.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 5px;"><i class="fas fa-exclamation-triangle"></i> ¡Conflicto de Solicitudes Pendientes!</div>
            <div>Existen otras solicitudes pendientes en el mismo bloque de horario:</div>
            <ul style="margin: 5px 0 0 15px; padding: 0;">${listText}</ul>
        `;
        overlapPendingAlert.style.display = 'block';
    } else if (overlapPendingAlert) {
        overlapPendingAlert.style.display = 'none';
    }
    
    // Find if there is a court named "Cancha 6"
    const defaultCancha = activeCourts.find(c => c.activa && c.nombre.toLowerCase().includes('cancha 6'));
    const defaultCanchaId = defaultCancha ? defaultCancha.id : null;
    
    // Dynamically populate court options and highlight occupied ones
    if (approveCanchaSelect) {
        const defaultSelectedAttr = !defaultCanchaId ? 'selected' : '';
        approveCanchaSelect.innerHTML = `<option value="" disabled ${defaultSelectedAttr}>Selecciona una cancha...</option>` + 
            activeCourts.map(c => {
                const bookingConflict = allReservations.find(res =>
                    res.estado === 'aprobada' &&
                    res.cancha_id === c.id &&
                    res.fecha === fecha &&
                    (res.hora_inicio < fin && res.hora_fin > inicio)
                );
                
                const isSelected = defaultCanchaId && c.id === defaultCanchaId ? 'selected' : '';
                
                if (bookingConflict) {
                    const profName = bookingConflict.usuarios ? `${bookingConflict.usuarios.nombre} ${bookingConflict.usuarios.apellido}` : 'otro profesor';
                    const start = formatTime(bookingConflict.hora_inicio);
                    const end = formatTime(bookingConflict.hora_fin);
                    return `<option value="${c.id}" ${isSelected} style="color: #991b1b; background-color: #fee2e2;">${c.nombre} (⚠️ Ocupada por ${profName} ${start}-${end})</option>`;
                } else {
                    return `<option value="${c.id}" ${isSelected}>${c.nombre}</option>`;
                }
            }).join('');
            
        if (defaultCanchaId) {
            approveCanchaSelect.value = defaultCanchaId;
            approveCanchaSelect.dispatchEvent(new Event('change'));
        } else {
            approveCanchaSelect.value = '';
        }
    }
    
    if (approveModalInstance) approveModalInstance.show();
}

// Open Reject Modal
function openRejectModal(id) {
    rejectReservaId.value = id;
    rejectNotes.value = '';
    if (rejectModalInstance) rejectModalInstance.show();
}

// Open Payment Modal
function openPaymentModal(id) {
    const r = allReservations.find(res => res.id === id);
    if (!r) {
        showToast("No se pudo encontrar la reserva.", "danger");
        return;
    }
    
    paymentReservaId.value = r.id;
    const { pago, numero_ticket, monto, metodo_pago, notas } = parseAdminNotes(r.notas_admin);
    
    if (paymentNumeroTicket) paymentNumeroTicket.value = numero_ticket;
    if (paymentMonto) paymentMonto.value = monto;
    if (paymentMetodoPago) paymentMetodoPago.value = metodo_pago || 'transferencia';
    if (paymentPaymentNotas) paymentPaymentNotas.value = notas;
    
    if (paymentModalTitle) {
        const profName = r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido}` : 'Profesor';
        paymentModalTitle.innerText = `Alumno: ${r.alumno_nombre} | Profesor: ${profName}`;
    }
    
    if (paymentModalInstance) paymentModalInstance.show();
}

// Setup Event Listeners and Modal Bindings
function setupDashboardListeners() {
    if (window.bootstrap) {
        approveModalInstance = new bootstrap.Modal(document.getElementById('approveModal'));
        rejectModalInstance = new bootstrap.Modal(document.getElementById('rejectModal'));
        paymentModalInstance = new bootstrap.Modal(document.getElementById('paymentModal'));
        confirmBulkModalInstance = new bootstrap.Modal(document.getElementById('confirmBulkModal'));
        detailsModalInstance = new bootstrap.Modal(document.getElementById('detailsModal'));
        const toastElement = document.getElementById('appToast');
        if (toastElement) {
            toastInstance = new bootstrap.Toast(toastElement, { delay: 4000 });
        }
    }
    
    // Toggle payment fields visibility based on switches
    if (approvePaidSwitch) {
        approvePaidSwitch.addEventListener('change', () => {
            const group = document.getElementById('approvePaymentFieldsGroup');
            if (group) {
                group.style.display = approvePaidSwitch.checked ? 'block' : 'none';
            }
        });
    }
    
    // Tab switching event listener
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

    // Sign out button
    if (btnSignOut) {
        btnSignOut.addEventListener('click', async () => {
            showOverlay("Cerrando sesión...");
            await db.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // Submit Court Approval
    if (approveForm) {
        approveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = approveReservaId.value;
            const canchaId = Number(approveCanchaSelect.value);
            const notes = approveNotes.value.trim();
            const esSocioVal = approveEsSocio.checked ? 'S' : 'N';
            
            const isPaid = approvePaidSwitch.checked;
            let numeroTicketVal = '';
            let montoVal = '';
            let metodoPagoVal = '';
            let notasVal = '';
            
            if (isPaid) {
                metodoPagoVal = approveMetodoPago.value;
                if (!metodoPagoVal) {
                    showToast("Por favor, selecciona un método de pago (transferencia o efectivo).", "warning");
                    return;
                }
                numeroTicketVal = approveNumeroTicket.value.trim();
                montoVal = approveMonto.value ? parseFloat(approveMonto.value) : '';
                notasVal = approvePaymentNotas.value.trim();
            }
            
            // Construct structured JSON inside notas_admin
            const notesObj = {
                pago: isPaid ? 'S' : 'N',
                numero_ticket: numeroTicketVal,
                monto: montoVal,
                metodo_pago: metodoPagoVal,
                notas: notasVal,
                comentarios: notes || "Aprobada por Administrador."
            };
            
            if (approveModalInstance) approveModalInstance.hide();
            showOverlay("Aprobando reserva...");
            try {
                const { error } = await db.from('reservas')
                    .update({ 
                        estado: 'aprobada', 
                        cancha_id: canchaId, 
                        notas_admin: JSON.stringify(notesObj),
                        es_socio: esSocioVal
                    })
                    .eq('id', id);
                    
                if (error) throw error;
                showToast("¡Reserva aprobada con éxito!", "success");
                await loadAdminData();
            } catch (err) {
                showToast("Error al aprobar: " + err.message, "danger");
                hideOverlay();
            }
        });
    }

    // Submit Court Rejection
    if (rejectForm) {
        rejectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = rejectReservaId.value;
            const notes = rejectNotes.value.trim();
            
            if (rejectModalInstance) rejectModalInstance.hide();
            showOverlay("Rechazando reserva...");
            try {
                const { error } = await db.from('reservas')
                    .update({ 
                        estado: 'rechazada', 
                        notas_admin: `Rechazado: ${notes}` 
                    })
                    .eq('id', id);
                    
                if (error) throw error;
                showToast("Reserva rechazada.", "warning");
                await loadAdminData();
            } catch (err) {
                showToast("Error al rechazar: " + err.message, "danger");
                hideOverlay();
            }
        });
    }

    // Submit Payment Details Edit
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = paymentReservaId.value;
            const r = allReservations.find(res => res.id === id);
            const currentNotes = parseAdminNotes(r ? r.notas_admin : '');
            
            const metodoPagoVal = paymentMetodoPago.value;
            if (!metodoPagoVal) {
                showToast("Por favor, selecciona un método de pago (transferencia o efectivo).", "warning");
                return;
            }
            const numeroTicketVal = paymentNumeroTicket.value.trim();
            const montoVal = paymentMonto.value ? parseFloat(paymentMonto.value) : '';
            const notasVal = paymentPaymentNotas.value.trim();
            
            const notesObj = {
                pago: 'S',
                numero_ticket: numeroTicketVal,
                monto: montoVal,
                metodo_pago: metodoPagoVal,
                notas: notasVal,
                comentarios: currentNotes.comentarios
            };
            
            if (paymentModalInstance) paymentModalInstance.hide();
            showOverlay("Actualizando pago...");
            try {
                const { error } = await db.from('reservas')
                    .update({ 
                        notas_admin: JSON.stringify(notesObj)
                    })
                    .eq('id', id);
                    
                if (error) throw error;
                showToast("¡Pago actualizado con éxito!", "success");
                await loadAdminData();
            } catch (err) {
                showToast("Error al actualizar pago: " + err.message, "danger");
                hideOverlay();
            }
        });
    }

    // Admin add court form submit
    if (addCourtForm) {
        addCourtForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = courtName.value.trim();
            showOverlay("Guardando cancha...");
            try {
                const { error } = await db.from('canchas').insert({ nombre: name, activa: true });
                if (error) throw error;
                courtName.value = '';
                showToast("¡Nueva cancha registrada con éxito!", "success");
                await loadAdminData();
            } catch (err) {
                showToast("Error guardando cancha: " + err.message, "danger");
                hideOverlay();
            }
        });
    }

    // Event Delegation: Toggle Court active state
    if (adminCanchasBody) {
        adminCanchasBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-toggle-cancha');
            if (btn) {
                const id = Number(btn.getAttribute('data-id'));
                const activa = btn.getAttribute('data-activa') === 'true';
                await toggleCanchaActiva(id, activa);
            }
        });
    }

    // Event Delegation: Admin approves/rejects booking request in pending list
    if (adminPendientesBody) {
        adminPendientesBody.addEventListener('click', (e) => {
            const approveBtn = e.target.closest('.btn-admin-approve');
            if (approveBtn) {
                const id = approveBtn.getAttribute('data-id');
                const fecha = approveBtn.getAttribute('data-fecha');
                const inicio = approveBtn.getAttribute('data-inicio');
                const fin = approveBtn.getAttribute('data-fin');
                openApproveModal(id, fecha, inicio, fin);
                return;
            }
            
            const rejectBtn = e.target.closest('.btn-admin-reject');
            if (rejectBtn) {
                const id = rejectBtn.getAttribute('data-id');
                openRejectModal(id);
            }
        });
    }

    // Event Delegation: Admin opens payment or details modal from history list
    if (adminHistorialBody) {
        adminHistorialBody.addEventListener('click', (e) => {
            const editPagoBtn = e.target.closest('.btn-edit-pago');
            if (editPagoBtn) {
                const id = editPagoBtn.getAttribute('data-id');
                if (id) {
                    openPaymentModal(id);
                }
                return;
            }
            
            // Otherwise, check if they clicked a row
            const clickedRow = e.target.closest('.clickable-row');
            if (clickedRow) {
                const id = clickedRow.getAttribute('data-id');
                if (id) {
                    openDetailsModal(id);
                }
            }
        });
    }

    // Bulk Approve pending requests using default values (Cancha 6)
    const btnBulk = document.getElementById('btnApproveAllDefault');
    if (btnBulk) {
        btnBulk.addEventListener('click', () => {
            const pendingRes = allReservations.filter(r => r.estado === 'pendiente');
            if (pendingRes.length === 0) {
                showToast("No hay solicitudes pendientes.", "warning");
                return;
            }
            
            // Search for active court named "Cancha 6"
            const court6 = activeCourts.find(c => c.activa && c.nombre.toLowerCase().includes('cancha 6'));
            if (!court6) {
                showToast("No se encontró una cancha activa llamada 'Cancha 6'. Regístrala primero.", "danger");
                return;
            }
            
            pendingResToApprove = pendingRes;
            targetCourtForApprove = court6;
            
            const confirmTextEl = document.getElementById('confirmBulkModalText');
            if (confirmTextEl) {
                confirmTextEl.innerText = `¿Estás seguro de que deseas aprobar las ${pendingRes.length} solicitudes pendientes asignándolas por omisión a la ${court6.nombre}?`;
            }
            
            if (confirmBulkModalInstance) {
                confirmBulkModalInstance.show();
            }
        });
    }

    // Custom Bootstrap Modal confirmation click handler
    const btnConfirmBulk = document.getElementById('btnConfirmBulkAction');
    if (btnConfirmBulk) {
        btnConfirmBulk.addEventListener('click', async () => {
            if (confirmBulkModalInstance) confirmBulkModalInstance.hide();
            if (pendingResToApprove.length === 0 || !targetCourtForApprove) return;
            
            showOverlay("Aprobando solicitudes masivamente...");
            try {
                const pendingIds = pendingResToApprove.map(r => r.id);
                const { error } = await db.from('reservas')
                    .update({
                        estado: 'aprobada',
                        cancha_id: targetCourtForApprove.id,
                        notas_admin: JSON.stringify({
                            pago: 'N',
                            comentarios: "Aprobada masivamente por Administrador."
                        })
                    })
                    .in('id', pendingIds);
                    
                if (error) throw error;
                showToast(`¡Aprobadas ${pendingResToApprove.length} solicitudes con éxito en ${targetCourtForApprove.nombre}!`, "success");
                await loadAdminData();
            } catch (err) {
                showToast("Error en la aprobación masiva: " + err.message, "danger");
                hideOverlay();
            }
        });
    }

    // Setup Calendar Listeners
    const calDateInput = document.getElementById('calendarDateInput');
    const btnCalPrev = document.getElementById('btnCalPrev');
    const btnCalToday = document.getElementById('btnCalToday');
    const btnCalNext = document.getElementById('btnCalNext');

    if (calDateInput) {
        calDateInput.addEventListener('change', async (e) => {
            selectedCalendarDate = e.target.value;
            await renderCalendarGrid(selectedCalendarDate);
        });
    }

    if (btnCalPrev) {
        btnCalPrev.addEventListener('click', async () => {
            const d = new Date(selectedCalendarDate + 'T12:00:00');
            d.setDate(d.getDate() - 1);
            selectedCalendarDate = d.toLocaleDateString('sv-SE');
            if (calDateInput) calDateInput.value = selectedCalendarDate;
            await renderCalendarGrid(selectedCalendarDate);
        });
    }

    if (btnCalToday) {
        btnCalToday.addEventListener('click', async () => {
            selectedCalendarDate = new Date().toLocaleDateString('sv-SE');
            if (calDateInput) calDateInput.value = selectedCalendarDate;
            await renderCalendarGrid(selectedCalendarDate);
        });
    }

    if (btnCalNext) {
        btnCalNext.addEventListener('click', async () => {
            const d = new Date(selectedCalendarDate + 'T12:00:00');
            d.setDate(d.getDate() + 1);
            selectedCalendarDate = d.toLocaleDateString('sv-SE');
            if (calDateInput) calDateInput.value = selectedCalendarDate;
            await renderCalendarGrid(selectedCalendarDate);
        });
    }
}

function openDetailsModal(id) {
    const r = allReservations.find(res => res.id === id);
    if (!r) {
        showToast("No se pudo encontrar la reserva.", "danger");
        return;
    }
    
    const { pago, numero_ticket, monto, metodo_pago, notas, comentarios } = parseAdminNotes(r.notas_admin);
    const profNameFull = r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido}` : 'Profesor';
    const courtName = r.canchas ? r.canchas.nombre : 'Sin cancha asignada';
    const start = formatTime(r.hora_inicio);
    const end = formatTime(r.hora_fin);
    
    document.getElementById('detailProfesor').innerText = profNameFull;
    document.getElementById('detailFecha').innerText = r.fecha;
    document.getElementById('detailHorario').innerText = `${start} - ${end}`;
    document.getElementById('detailEstado').innerText = r.estado.toUpperCase();
    document.getElementById('detailAlumno').innerText = r.alumno_nombre;
    document.getElementById('detailCancha').innerText = courtName;
    document.getElementById('detailEsSocio').innerText = r.es_socio === 'S' ? 'Sí' : 'No';
    document.getElementById('detailPago').innerText = pago === 'S' ? 'PAGADO' : 'PENDIENTE DE PAGO';
    document.getElementById('detailTicket').innerText = numero_ticket || '-';
    document.getElementById('detailMonto').innerText = formatCLP(monto);
    document.getElementById('detailNotasPago').innerText = notas || '-';
    document.getElementById('detailComentarios').innerText = comentarios || '-';
    
    if (detailsModalInstance) detailsModalInstance.show();
}

// Render Daily Calendar Grid using rowspan for approved slots
async function renderCalendarGrid(dateStr) {
    const gridHeader = document.getElementById('calendarGridHeader');
    const gridBody = document.getElementById('calendarGridBody');
    if (!gridHeader || !gridBody) return;

    // 1. Render Header
    gridHeader.innerHTML = `<th class="time-column">Horario</th>` +
        activeCourts.map(c => `<th>${c.nombre}</th>`).join('');

    // 2. Render Body Rows
    if (activeCourts.length === 0) {
        gridBody.innerHTML = `<tr><td colspan="1" class="text-center py-4">No hay canchas activas registradas.</td></tr>`;
        return;
    }

    const slotsCount = BOOKING_HOURS.length - 1;
    const consumedSlots = {}; // courtId -> Set of slotIndices
    activeCourts.forEach(c => {
        consumedSlots[c.id] = new Set();
    });

    let htmlRows = '';

    for (let i = 0; i < slotsCount; i++) {
        const slotStart = BOOKING_HOURS[i];
        const slotEnd = BOOKING_HOURS[i+1];
        
        let rowHtml = `<tr>`;
        rowHtml += `<td class="time-column">${slotStart} - ${slotEnd}</td>`;

        for (let c of activeCourts) {
            if (consumedSlots[c.id].has(i)) {
                // This slot was consumed by a rowspan from a previous row, do not render cell
                continue;
            }

            // Find an approved reservation on this date and court that starts at exactly slotStart
            const res = allReservations.find(r => 
                r.estado === 'aprobada' &&
                r.fecha === dateStr &&
                r.cancha_id === c.id &&
                formatTime(r.hora_inicio) === slotStart
            );

            if (res) {
                // Calculate span in 30-min slots
                const duration = getDurationInHours(res.hora_inicio, res.hora_fin);
                const span = Math.max(1, Math.round(duration / 0.5));

                // Mark subsequent slots as consumed
                for (let s = 0; s < span; s++) {
                    consumedSlots[c.id].add(i + s);
                }

                const profName = res.usuarios 
                    ? formatProfNameShort(res.usuarios.nombre, res.usuarios.apellido)
                    : 'Profesor';

                rowHtml += `
                    <td rowspan="${span}" class="cell-occupied">
                        <div class="cell-occupied-inner">
                            <span class="cell-prof-name"><i class="fas fa-user-tie text-success me-1"></i>${profName}</span>
                            <span class="cell-time-span"><i class="far fa-clock me-1"></i>${formatTime(res.hora_inicio)} - ${formatTime(res.hora_fin)}</span>
                            <span class="cell-student-name" title="Alumno: ${res.alumno_nombre}"><i class="fas fa-graduation-cap me-1"></i>${res.alumno_nombre}</span>
                        </div>
                    </td>
                `;
            } else {
                rowHtml += `<td class="cell-available">Libre</td>`;
            }
        }

        rowHtml += `</tr>`;
        htmlRows += rowHtml;
    }

    gridBody.innerHTML = htmlRows;
}

// Expose modal and utility functions to global scope
window.openApproveModal = openApproveModal;
window.openRejectModal = openRejectModal;
window.openPaymentModal = openPaymentModal;
window.openDetailsModal = openDetailsModal;
window.toggleCanchaActiva = toggleCanchaActiva;
window.renderCalendarGrid = renderCalendarGrid;
