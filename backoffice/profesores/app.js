// URL de tu implementación (Web App) de Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbzGUneIMiVzI22GzGi-An8XusnKjzLs6QE6xnltxU_Nax2GAhhdMjhvw0B8lgo02iL5/exec';

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarSolicitudes);

async function cargarSolicitudes() {
    const contenedor = document.getElementById('contenedor-solicitudes');
    const loader = document.getElementById('loader');
    
    loader.style.display = 'flex';
    contenedor.innerHTML = '';

    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.status === 'success') {
            renderizarCards(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        contenedor.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Error al conectar con Google Sheets: ${error.message}
            </div>`;
    } finally {
        loader.style.display = 'none';
    }
}

function renderizarCards(datos) {

    console.log('datos', datos);

    const contenedor = document.getElementById('contenedor-solicitudes');
    
    if (datos.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay solicitudes pendientes.</p>';
        return;
    }

    datos.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        // Formateo de fecha si existe una columna 'timestamp' o 'fecha'
        const fecha = item.timestamp ? new Date(item.fecha).toLocaleDateString() : 'N/A';
        const email = item["Dirección de correo electrónico"] || item["email"] || "No provisto";

        col.innerHTML = `
            <div class="card h-100 card-solicitud shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title text-primary">${item.profesor || 'Sin Nombre'}</h5>
                        <span class="badge bg-light text-dark border">${fecha}</span>
                    </div>
                    <h6 class="card-subtitle mb-2 text-muted">${email}</h6>
                    <p class="card-text mt-3">
                        <strong>Solicitud:</strong><br>
                        ${item.comentarios || 'Sin contenido'}
                    </p>
                </div>
                <div class="card-footer bg-white border-0 pb-3">
                    <button class="btn btn-outline-success btn-sm w-100">Marcar como revisada</button>
                </div>
            </div>
        `;
        contenedor.appendChild(col);
    });
}