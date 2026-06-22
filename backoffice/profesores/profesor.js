// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// State
let currentUser = null;
let currentProfile = null;
let allReservations = []; // Used locally to check conflicts and show lists
let activeCourts = [];
let selectedCalendarDate = "";

// Bootstrap Modal Instances
let cancelConfirmModalInstance = null;
let editRequestModalInstance = null;
let toastInstance = null;

// DOM elements - Views & Overlays
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// DOM elements - Dashboard general
const userNameDisplay = document.getElementById('userNameDisplay');
const btnSignOut = document.getElementById('btnSignOut');

// DOM elements - Teacher Solicitudes Form
const newRequestForm = document.getElementById('newRequestForm');
const reqAlumnoNombre = document.getElementById('reqAlumnoNombre');
const reqAlumnoTelefono = document.getElementById('reqAlumnoTelefono');
const reqAlumnoSocio = document.getElementById('reqAlumnoSocio');
const reqFecha = document.getElementById('reqFecha');
const reqHoraInicio = document.getElementById('reqHoraInicio');
const reqDuration = document.getElementById('reqDuration');
const reqDurationDisplay = document.getElementById('reqDurationDisplay');
const btnDecDuration = document.getElementById('btnDecDuration');
const btnIncDuration = document.getElementById('btnIncDuration');
const reqNotas = document.getElementById('reqNotas');

// DOM elements - Teacher lists
const misSolicitudesBody = document.getElementById('misSolicitudesBody');
const todasSolicitudesBody = document.getElementById('todasSolicitudesBody');

// DOM elements - Edit Modals
const editRequestModal = document.getElementById('editRequestModal');
const editRequestForm = document.getElementById('editRequestForm');
const editReservaId = document.getElementById('editReservaId');
const editAlumnoNombre = document.getElementById('editAlumnoNombre');
const editAlumnoTelefono = document.getElementById('editAlumnoTelefono');
const editAlumnoSocio = document.getElementById('editAlumnoSocio');
const editFecha = document.getElementById('editFecha');
const editHoraInicio = document.getElementById('editHoraInicio');
const editDuration = document.getElementById('editDuration');
const editDurationDisplay = document.getElementById('editDurationDisplay');
const btnDecEditDuration = document.getElementById('btnDecEditDuration');
const btnIncEditDuration = document.getElementById('btnIncEditDuration');
const editNotas = document.getElementById('editNotas');

// Configuration Constants
const BOOKING_HOURS = [];
for (let h = 8; h <= 21; h++) {
    const hh = String(h).padStart(2, '0');
    BOOKING_HOURS.push(`${hh}:00`);
    BOOKING_HOURS.push(`${hh}:30`);
}
BOOKING_HOURS.push("22:00");

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
    populateHourSelects();
    populateEditHourSelects();
    
    // Check session
    const { data: { session }, error } = await db.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        showOverlay("Cargando perfil...");
        const profileOk = await loadUserProfile();
        if (profileOk && currentProfile.rol === 'profesor') {
            userNameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> Sesión: <strong>${currentProfile.nombre} ${currentProfile.apellido}</strong> (${currentProfile.rol.toUpperCase()})`;
            
            // Set date inputs default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            reqFecha.value = tomorrow.toISOString().slice(0, 10);
            reqFecha.min = new Date().toISOString().slice(0, 10);
            
            // Set default date for calendar to today's local date
            selectedCalendarDate = new Date().toLocaleDateString('sv-SE');
            const calDateInput = document.getElementById('calendarDateInput');
            if (calDateInput) {
                calDateInput.value = selectedCalendarDate;
            }
            
            setupDashboardListeners();
            await loadProfesorData();
        } else {
            // Unauthorized or failed profile load
            if (profileOk && currentProfile.rol === 'admin') {
                window.location.href = 'admin_menu.html';
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

// Setup Hour select boxes and Duration Stepper
function populateHourSelects() {
    if (reqHoraInicio) {
        reqHoraInicio.innerHTML = BOOKING_HOURS.slice(0, -1).map(h => `<option value="${h}:00" ${h === '09:00' ? 'selected' : ''}>${h}</option>`).join('');
        updateDurationLimits();
        reqHoraInicio.addEventListener('change', () => {
            updateDurationLimits();
        });
    }
    
    if (btnDecDuration && btnIncDuration && reqDuration && reqDurationDisplay) {
        btnDecDuration.onclick = () => adjustDuration(-1);
        btnIncDuration.onclick = () => adjustDuration(1);
    }
}

function updateDurationLimits() {
    if (!reqHoraInicio || !reqDuration || !reqDurationDisplay || !btnDecDuration || !btnIncDuration) return;
    
    const startVal = reqHoraInicio.value;
    if (!startVal) return;
    
    const [sh, sm] = startVal.split(':').map(Number);
    const startDecimal = sh + (sm / 60);
    const maxDurationDecimal = 22.0 - startDecimal;
    const maxDuration = Math.floor(maxDurationDecimal);
    
    let currentVal = parseFloat(reqDuration.value) || 1;
    
    if (maxDurationDecimal < 1.0) {
        currentVal = 0.5;
        reqDuration.value = "0.5";
        reqDurationDisplay.value = "30 minutos";
        btnDecDuration.disabled = true;
        btnIncDuration.disabled = true;
    } else {
        if (currentVal < 1.0) currentVal = 1;
        if (currentVal > maxDuration) currentVal = maxDuration;
        
        reqDuration.value = currentVal.toString();
        reqDurationDisplay.value = `${currentVal} ${currentVal === 1 ? 'hora' : 'horas'}`;
        
        btnDecDuration.disabled = (currentVal <= 1);
        btnIncDuration.disabled = (currentVal >= maxDuration);
    }
}

function adjustDuration(amount) {
    if (!reqHoraInicio || !reqDuration || !reqDurationDisplay || !btnDecDuration || !btnIncDuration) return;
    
    const startVal = reqHoraInicio.value;
    if (!startVal) return;
    
    const [sh, sm] = startVal.split(':').map(Number);
    const startDecimal = sh + (sm / 60);
    const maxDurationDecimal = 22.0 - startDecimal;
    const maxDuration = Math.floor(maxDurationDecimal);
    
    if (maxDurationDecimal < 1.0) return;
    
    let currentVal = parseInt(reqDuration.value, 10) || 1;
    let newVal = currentVal + amount;
    
    if (newVal < 1) newVal = 1;
    if (newVal > maxDuration) newVal = maxDuration;
    
    reqDuration.value = newVal.toString();
    reqDurationDisplay.value = `${newVal} ${newVal === 1 ? 'hora' : 'horas'}`;
    
    btnDecDuration.disabled = (newVal <= 1);
    btnIncDuration.disabled = (newVal >= maxDuration);
}

function getDurationInHours(startStr, endStr) {
    if (!startStr || !endStr) return 1;
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    return (endMin - startMin) / 60;
}

// Setup Hour select boxes and Duration Stepper for Edit Modal
function populateEditHourSelects() {
    if (editHoraInicio) {
        editHoraInicio.innerHTML = BOOKING_HOURS.slice(0, -1).map(h => `<option value="${h}:00">${h}</option>`).join('');
        updateEditDurationLimits();
        editHoraInicio.addEventListener('change', () => {
            updateEditDurationLimits();
        });
    }
    
    if (btnDecEditDuration && btnIncEditDuration && editDuration && editDurationDisplay) {
        btnDecEditDuration.onclick = () => adjustEditDuration(-1);
        btnIncEditDuration.onclick = () => adjustEditDuration(1);
    }
}

function updateEditDurationLimits() {
    if (!editHoraInicio || !editDuration || !editDurationDisplay || !btnDecEditDuration || !btnIncEditDuration) return;
    
    const startVal = editHoraInicio.value;
    if (!startVal) return;
    
    const [sh, sm] = startVal.split(':').map(Number);
    const startDecimal = sh + (sm / 60);
    const maxDurationDecimal = 22.0 - startDecimal;
    const maxDuration = Math.floor(maxDurationDecimal);
    
    let currentVal = parseFloat(editDuration.value) || 1;
    
    if (maxDurationDecimal < 1.0) {
        currentVal = 0.5;
        editDuration.value = "0.5";
        editDurationDisplay.value = "30 minutos";
        btnDecEditDuration.disabled = true;
        btnIncEditDuration.disabled = true;
    } else {
        if (currentVal < 1.0) currentVal = 1;
        if (currentVal > maxDuration) currentVal = maxDuration;
        
        editDuration.value = currentVal.toString();
        editDurationDisplay.value = `${currentVal} ${currentVal === 1 ? 'hora' : 'horas'}`;
        
        btnDecEditDuration.disabled = (currentVal <= 1);
        btnIncEditDuration.disabled = (currentVal >= maxDuration);
    }
}

function adjustEditDuration(amount) {
    if (!editHoraInicio || !editDuration || !editDurationDisplay || !btnDecEditDuration || !btnIncEditDuration) return;
    
    const startVal = editHoraInicio.value;
    if (!startVal) return;
    
    const [sh, sm] = startVal.split(':').map(Number);
    const startDecimal = sh + (sm / 60);
    const maxDurationDecimal = 22.0 - startDecimal;
    const maxDuration = Math.floor(maxDurationDecimal);
    
    if (maxDurationDecimal < 1.0) return;
    
    let currentVal = parseInt(editDuration.value, 10) || 1;
    let newVal = currentVal + amount;
    
    if (newVal < 1) newVal = 1;
    if (newVal > maxDuration) newVal = maxDuration;
    
    editDuration.value = newVal.toString();
    editDurationDisplay.value = `${newVal} ${newVal === 1 ? 'hora' : 'horas'}`;
    
    btnDecEditDuration.disabled = (newVal <= 1);
    btnIncEditDuration.disabled = (newVal >= maxDuration);
}

function openEditModal(id) {
    const r = allReservations.find(res => res.id === id);
    if (!r) {
        showToast("No se pudo encontrar la reserva a editar.", "danger");
        return;
    }
    
    editReservaId.value = r.id;
    editAlumnoNombre.value = r.alumno_nombre;
    editAlumnoTelefono.value = r.alumno_telefono || '';
    editAlumnoSocio.checked = r.es_socio === 'S';
    editFecha.value = r.fecha;
    editHoraInicio.value = formatTime(r.hora_inicio) + ":00";
    
    let rawNote = r.notas_admin || '';
    if (rawNote.startsWith("Nota Profesor: ")) {
        rawNote = rawNote.slice("Nota Profesor: ".length);
    }
    editNotas.value = rawNote;
    
    const duration = getDurationInHours(r.hora_inicio, r.hora_fin);
    editDuration.value = duration.toString();
    
    updateEditDurationLimits();
    
    if (editRequestModalInstance) {
        editRequestModalInstance.show();
    }
}

// Load Profesor Bookings & Requests
async function loadProfesorData() {
    showOverlay("Descargando solicitudes...");
    try {
        // Fetch active courts
        const { data: courtsData, error: errCourts } = await db.from('canchas')
            .select('*')
            .eq('activa', true)
            .order('id', { ascending: true });
        if (errCourts) throw errCourts;
        activeCourts = courtsData || [];

        const { data: resData, error: err1 } = await db.from('reservas')
            .select(`
                id, fecha, hora_inicio, hora_fin, estado, notas_admin, alumno_nombre, profesor_id, cancha_id, es_socio,
                usuarios!profesor_id(nombre, apellido),
                canchas!cancha_id(nombre)
            `);
        
        if (err1) throw err1;
        allReservations = resData || [];
        
        // Helper to compute overlap badge
        const getOverlapBadge = (r) => {
            if (r.estado === 'cancelada' || r.estado === 'rechazada') return '';
            
            const overlaps = allReservations.filter(other => 
                other.id !== r.id &&
                other.estado !== 'cancelada' &&
                other.estado !== 'rechazada' &&
                other.fecha === r.fecha &&
                (other.hora_inicio < r.hora_fin && other.hora_fin > r.hora_inicio)
            );
            
            if (overlaps.length > 0) {
                const courtConflict = overlaps.some(other => 
                    r.estado === 'aprobada' && 
                    other.estado === 'aprobada' && 
                    r.cancha_id === other.cancha_id
                );
                
                if (courtConflict) {
                    return `<span class="badge bg-danger text-white ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;" title="¡Colisión! Misma cancha y horario reservado"><i class="fas fa-exclamation-triangle"></i> Colisión</span>`;
                } else {
                    const pendingCount = overlaps.filter(o => o.estado === 'pendiente').length;
                    const approvedCount = overlaps.filter(o => o.estado === 'aprobada').length;
                    
                    let tooltipMsg = 'Traslape detectado en este horario:';
                    if (approvedCount > 0) tooltipMsg += ` ${approvedCount} aprobada(s)`;
                    if (pendingCount > 0) tooltipMsg += ` ${pendingCount} pendiente(s)`;
                    
                    return `<span class="badge bg-warning text-dark ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;" title="${tooltipMsg}"><i class="fas fa-calendar-times"></i> Traslape</span>`;
                }
            }
            return '';
        };

        // 1. Render Mis Solicitudes
        const myRes = allReservations.filter(r => r.profesor_id === currentUser.id);
        myRes.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora_inicio.localeCompare(a.hora_inicio));
        
        if (myRes.length === 0) {
            misSolicitudesBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">📭 Aún no has realizado solicitudes de reserva.</td></tr>';
        } else {
            misSolicitudesBody.innerHTML = myRes.map(r => {
                const start = formatTime(r.hora_inicio);
                const end = formatTime(r.hora_fin);
                const courtName = r.canchas ? r.canchas.nombre : '<span style="color:#889e90;">(Pendiente)</span>';
                const overlapBadge = getOverlapBadge(r);
                
                let actionBtns = '';
                if (r.estado === 'pendiente') {
                    actionBtns = `
                        <button class="btn-action-sm btn-edit btn-action-round" data-id="${r.id}" title="Editar Solicitud"><i class="fas fa-edit"></i></button>
                        <button class="btn-action-sm btn-cancel btn-action-round" data-id="${r.id}" title="Cancelar Solicitud"><i class="fas fa-trash-alt"></i></button>
                    `;
                }
                
                const socioBadge = r.es_socio === 'S' 
                    ? '<span class="badge bg-success text-white ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;">Socio</span>' 
                    : '<span class="badge bg-secondary text-white ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;">Visita</span>';
                
                const { numero_ticket, monto, comentarios } = parseAdminNotes(r.notas_admin);
                
                return `
                    <tr>
                        <td data-label="Fecha">${r.fecha}</td>
                        <td data-label="Horario">${start} - ${end} ${overlapBadge}</td>
                        <td data-label="Alumno">${r.alumno_nombre} ${socioBadge}</td>
                        <td data-label="Cancha">${courtName}</td>
                        <td data-label="Estado"><span class="status-badge ${r.estado}">${r.estado}</span></td>
                        <td data-label="Ticket">${numero_ticket || '-'}</td>
                        <td data-label="Monto">${formatCLP(monto)}</td>
                        <td data-label="Notas Admin">${comentarios || '-'}</td>
                        <td data-label="Acciones">${actionBtns || '-'}</td>
                    </tr>
                `;
            }).join('');
        }

        // 2. Render Todas las Solicitudes (Transparencia)
        const activeRes = allReservations.filter(r => r.estado !== 'cancelada');
        activeRes.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora_inicio.localeCompare(a.hora_inicio));
        
        if (activeRes.length === 0) {
            todasSolicitudesBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">📭 No hay reservas registradas en el sistema.</td></tr>';
        } else {
            todasSolicitudesBody.innerHTML = activeRes.map(r => {
                const start = formatTime(r.hora_inicio);
                const end = formatTime(r.hora_fin);
                const courtName = r.canchas ? r.canchas.nombre : '<span style="color:#889e90;">(Pendiente)</span>';
                const profName = r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido}` : 'Profesor';
                const overlapBadge = getOverlapBadge(r);
                
                const { pago } = parseAdminNotes(r.notas_admin);
                let paymentBadge = '';
                if (r.estado === 'aprobada') {
                    if (pago === 'S') {
                        paymentBadge = `<span class="badge bg-success text-white ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;" title="Pagado"><i class="fas fa-wallet"></i> Pagado</span>`;
                    } else {
                        paymentBadge = `<span class="badge bg-warning text-dark ms-1" style="font-size: 0.72rem; border-radius: 8px; padding: 2px 6px;" title="Por pagar"><i class="fas fa-hourglass-half"></i> Por Pagar</span>`;
                    }
                }
                
                return `
                    <tr>
                        <td data-label="Profesor"><strong>${profName}</strong></td>
                        <td data-label="Fecha">${r.fecha}</td>
                        <td data-label="Horario">${start} - ${end} ${overlapBadge}</td>
                        <td data-label="Cancha">${courtName}</td>
                        <td data-label="Estado"><span class="status-badge ${r.estado}">${r.estado}</span>${paymentBadge}</td>
                    </tr>
                `;
            }).join('');
        }
        
        // Render daily calendar
        await renderCalendarGrid(selectedCalendarDate);
        
    } catch (e) {
        console.error(e);
        showToast("Error cargando datos de profesor: " + e.message, "danger");
    } finally {
        hideOverlay();
    }
}

// Teacher cancels pending request
async function cancelarReserva(reservaId) {
    showOverlay("Cancelando solicitud...");
    try {
        const { data, error } = await db.from('reservas')
            .update({ estado: 'cancelada' })
            .eq('id', reservaId)
            .select();
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            showToast("No se pudo cancelar: Permiso denegado por políticas de base de datos o la reserva no existe.", "danger");
        } else {
            showToast("¡Solicitud cancelada con éxito!", "success");
        }
        await loadProfesorData();
    } catch (err) {
        showToast("Error al cancelar: " + err.message, "danger");
        hideOverlay();
    }
}

// Setup Event Listeners and Modal Bindings
function setupDashboardListeners() {
    if (window.bootstrap) {
        cancelConfirmModalInstance = new bootstrap.Modal(document.getElementById('cancelConfirmModal'));
        editRequestModalInstance = new bootstrap.Modal(document.getElementById('editRequestModal'));
        const toastElement = document.getElementById('appToast');
        if (toastElement) {
            toastInstance = new bootstrap.Toast(toastElement, { delay: 4000 });
        }
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

    // Submit New Request
    if (newRequestForm) {
        newRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const alumno = reqAlumnoNombre.value.trim();
            const telefono = reqAlumnoTelefono.value.trim();
            const fecha = reqFecha.value;
            const inicio = reqHoraInicio.value;
            
            const duration = parseFloat(reqDuration.value) || 1;
            const [sh, sm] = inicio.split(':').map(Number);
            let eh = sh;
            let em = sm + (duration * 60);
            while (em >= 60) {
                em -= 60;
                eh += 1;
            }
            const fin = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
            const notas = reqNotas.value.trim();
            const esSocio = (reqAlumnoSocio && reqAlumnoSocio.checked) ? 'S' : 'N';
            
            showOverlay("Enviando solicitud...");
            try {
                const { error } = await db.from('reservas').insert({
                    profesor_id: currentUser.id,
                    alumno_nombre: alumno,
                    alumno_telefono: telefono,
                    fecha: fecha,
                    hora_inicio: inicio,
                    hora_fin: fin,
                    estado: 'pendiente',
                    es_socio: esSocio,
                    notas_admin: notas ? `Nota Profesor: ${notas}` : null
                });
                
                if (error) throw error;
                
                showToast("¡Solicitud enviada con éxito! Queda en estado pendiente.", "success");
                newRequestForm.reset();
                populateHourSelects();
                
                // Go to "Mis Solicitudes" tab
                document.querySelector('[data-tab="tab-mis-solicitudes"]').click();
                await loadProfesorData();
                
            } catch (err) {
                showToast("Error enviando reserva: " + err.message, "danger");
            } finally {
                hideOverlay();
            }
        });
    }

    // Event Delegation: Teacher cancels/edits booking request in list
    if (misSolicitudesBody) {
        misSolicitudesBody.addEventListener('click', (e) => {
            const cancelBtn = e.target.closest('.btn-cancel');
            if (cancelBtn) {
                const id = cancelBtn.getAttribute('data-id');
                if (id && cancelConfirmModalInstance) {
                    document.getElementById('btnConfirmCancel').setAttribute('data-id', id);
                    cancelConfirmModalInstance.show();
                }
            }
            
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if (id) {
                    openEditModal(id);
                }
            }
        });
    }

    // Confirm Cancel Button inside Bootstrap Modal
    const btnConfirmCancel = document.getElementById('btnConfirmCancel');
    if (btnConfirmCancel) {
        btnConfirmCancel.onclick = async () => {
            const id = btnConfirmCancel.getAttribute('data-id');
            if (cancelConfirmModalInstance) {
                cancelConfirmModalInstance.hide();
            }
            if (id) {
                await cancelarReserva(id);
            }
        };
    }

    // Submit Edit Request Form
    if (editRequestForm) {
        editRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editReservaId.value;
            const alumno = editAlumnoNombre.value.trim();
            const telefono = editAlumnoTelefono.value.trim();
            const socioVal = editAlumnoSocio.checked ? 'S' : 'N';
            const fecha = editFecha.value;
            const inicio = editHoraInicio.value;
            
            const duration = parseFloat(editDuration.value) || 1;
            const [sh, sm] = inicio.split(':').map(Number);
            let eh = sh;
            let em = sm + (duration * 60);
            while (em >= 60) {
                em -= 60;
                eh += 1;
            }
            const fin = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
            const notas = editNotas.value.trim();
            
            if (editRequestModalInstance) editRequestModalInstance.hide();
            showOverlay("Actualizando solicitud...");
            
            try {
                const { error } = await db.from('reservas')
                    .update({
                        alumno_nombre: alumno,
                        alumno_telefono: telefono,
                        es_socio: socioVal,
                        fecha: fecha,
                        hora_inicio: inicio,
                        hora_fin: fin,
                        notas_admin: notas ? `Nota Profesor: ${notas}` : null
                    })
                    .eq('id', id);
                    
                if (error) throw error;
                showToast("¡Solicitud actualizada con éxito!", "success");
                await loadProfesorData();
            } catch (err) {
                showToast("Error al actualizar la solicitud: " + err.message, "danger");
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

// Expose modal functions to global scope
window.openEditModal = openEditModal;
window.cancelarReserva = cancelarReserva;
window.renderCalendarGrid = renderCalendarGrid;
