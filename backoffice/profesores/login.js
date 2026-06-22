// ======================== CONFIGURACIÓN SUPABASE ========================
const SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"; 
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =======================================================================

// State
let currentUser = null;
let currentProfile = null;
let toastInstance = null;

// DOM elements
const authSection = document.getElementById('authSection');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const btnAuthSubmit = document.getElementById('btnAuthSubmit');

// Optional elements (if they exist in HTML)
const btnAuthToggle = document.getElementById('btnAuthToggle');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const regName = document.getElementById('regName');
const regLastName = document.getElementById('regLastName');
const regPhone = document.getElementById('regPhone');
const regRole = document.getElementById('regRole');

let isSignUpMode = false;

// Overlay Helpers
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

// Toast Helpers
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

// Initial Boot Loader
document.addEventListener('DOMContentLoaded', async () => {
    if (window.bootstrap) {
        const toastElement = document.getElementById('appToast');
        if (toastElement) {
            toastInstance = new bootstrap.Toast(toastElement, { delay: 4000 });
        }
    }
    
    showOverlay("Validando sesión existente...");
    const { data: { session }, error } = await db.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        const profileOk = await loadUserProfile();
        if (profileOk) {
            redirectByRole();
        } else {
            await db.auth.signOut();
            hideOverlay();
            if (authSection) authSection.style.display = 'flex';
        }
    } else {
        hideOverlay();
        if (authSection) authSection.style.display = 'flex';
    }
    
    setupAuthListeners();
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

// Redirect utility
function redirectByRole() {
    if (currentProfile) {
        if (currentProfile.rol === 'admin') {
            window.location.href = 'admin_menu.html';
        } else if (currentProfile.rol === 'profesor') {
            window.location.href = 'profesor_menu.html';
        } else {
            showToast("Rol no reconocido: " + currentProfile.rol, "danger");
            db.auth.signOut().then(() => {
                hideOverlay();
                if (authSection) authSection.style.display = 'flex';
            });
        }
    }
}

// Setup Event Listeners
function setupAuthListeners() {
    if (btnAuthToggle) {
        btnAuthToggle.addEventListener('click', () => {
            isSignUpMode = !isSignUpMode;
            if (isSignUpMode) {
                if (authTitle) authTitle.innerHTML = `<i class="fas fa-user-plus"></i> Registrar Cuenta`;
                if (authSubtitle) authSubtitle.innerText = "Crea tu cuenta de profesor o administrador";
                if (btnAuthSubmit) btnAuthSubmit.innerText = "Registrarse";
                if (btnAuthToggle) btnAuthToggle.innerText = "¿Ya tienes cuenta? Inicia sesión aquí";
                document.querySelectorAll('.signup-only').forEach(el => el.style.display = 'block');
                if (regName) regName.required = true;
                if (regLastName) regLastName.required = true;
            } else {
                if (authTitle) authTitle.innerHTML = `<i class="fas fa-lock"></i> Iniciar Sesión`;
                if (authSubtitle) authSubtitle.innerText = "Acceso al sistema de reservas de profesores";
                if (btnAuthSubmit) btnAuthSubmit.innerText = "Entrar";
                if (btnAuthToggle) btnAuthToggle.innerText = "¿No tienes cuenta? Regístrate aquí";
                document.querySelectorAll('.signup-only').forEach(el => el.style.display = 'none');
                if (regName) regName.required = false;
                if (regLastName) regLastName.required = false;
            }
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = authEmail.value.trim();
            const password = authPassword.value;
            
            if (isSignUpMode) {
                const name = regName ? regName.value.trim() : '';
                const lastName = regLastName ? regLastName.value.trim() : '';
                const phone = regPhone ? regPhone.value.trim() : '';
                const role = regRole ? regRole.value : 'profesor';
                
                showOverlay("Registrando usuario...");
                try {
                    const { data, error } = await db.auth.signUp({ email, password });
                    if (error) throw error;
                    
                    const user = data.user;
                    if (user) {
                        const { error: profileError } = await db.from('usuarios').insert({
                            id: user.id,
                            nombre: name,
                            apellido: lastName,
                            rol: role,
                            telefono: phone
                        });
                        if (profileError) throw profileError;
                        
                        showToast("¡Registro exitoso! Ya puedes iniciar sesión.", "success");
                        isSignUpMode = false;
                        if (btnAuthToggle) btnAuthToggle.click();
                    }
                } catch (err) {
                    showToast("Error de registro: " + err.message, "danger");
                } finally {
                    hideOverlay();
                }
            } else {
                showOverlay("Validando credenciales...");
                try {
                    const { data, error } = await db.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    
                    currentUser = data.user;
                    const profileOk = await loadUserProfile();
                    if (profileOk) {
                        redirectByRole();
                    } else {
                        await db.auth.signOut();
                        showToast("Error: Tu cuenta de Auth no tiene perfil en la tabla de usuarios.", "danger");
                        hideOverlay();
                    }
                } catch (err) {
                    showToast("Error de inicio de sesión: " + err.message, "danger");
                    hideOverlay();
                }
            }
        });
    }
}
