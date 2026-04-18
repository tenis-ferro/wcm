// CONFIGURACIÓN: Pega aquí la URL de tu "Web App" de Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjrW3Xwx-Z8rFHPTMQIt9rGCL-hxPwz-YwGvkGJJzGFuEU1WIq8EXPw1I7kKUarg8D/exec";

document.addEventListener('DOMContentLoaded', () => {
    fetchSolicitudes();
    
    // Buscador funcional
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.solicitud-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(term) ? 'grid' : 'none';
        });
    });
});

async function fetchSolicitudes() {
    const grid = document.getElementById('solicitudesGrid');
    
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        grid.innerHTML = ""; // Limpiar loader
        let pendientes = 0;

        data.reverse().forEach(item => { // Mostrar las más recientes primero
            if (item.estado === "Pendiente" || !item.estado) pendientes++;
            renderSolicitud(item);
        });

        document.getElementById('countPendientes').textContent = pendientes;

    } catch (error) {
        grid.innerHTML = `<div class="loader">Error al conectar con la base de datos.</div>`;
        console.error("Error:", error);
    }
}

function renderSolicitud(item) {
    const grid = document.getElementById('solicitudesGrid');
    const template = document.getElementById('solicitudTemplate');
    const clone = template.content.cloneNode(true);

    // 1. Formatear Fecha (dd-mm-aa)
    const fechaObj = new Date(item.fecha);
    const fechaFormateada = `${fechaObj.getDate().toString().padStart(2, '0')}-${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}-${fechaObj.getFullYear().toString().slice(-2)}`;

    // 2. Mapeo de campos según tu JSON
    clone.querySelector('.user-name').textContent = item.nombre_profesor; // Profesor
    clone.querySelector('.reserva-fecha').textContent = `${fechaFormateada} | ${item.bloque_horario}`; // Fecha y Bloque
    clone.querySelector('.alumno-name').textContent = `Alumno: ${item.alumno}`; // Alumno
    clone.querySelector('.comentario-text').textContent = item.comentarios ? `💬 ${item.comentarios}` : ""; // Comentario
    
    // 3. Estado y Estilos
    const estadoActual = item.estado || "Pendiente";
    const statusLabel = clone.querySelector('.status-label');
    statusLabel.textContent = estadoActual;
    
    const card = clone.querySelector('.solicitud-card');
    if (estadoActual === "Aprobada") card.classList.add('aprobada');
    if (estadoActual === "Rechazada") card.classList.add('rechazada');

    // 4. Botones de acción enviando el rowId correcto
    const btnApprove = clone.querySelector('.btn-approve');
    const btnReject = clone.querySelector('.btn-reject');

    btnApprove.onclick = () => procesarAccion(item.rowid, "Aprobada");
    btnReject.onclick = () => procesarAccion(item.rowid, "Rechazada");

    grid.appendChild(clone);
}

async function procesarAccion(rowId, nuevoEstado) {
    if (!confirm(`¿Deseas marcar esta reserva como ${nuevoEstado}?`)) return;

    // Feedback visual inmediato
    console.log(`Cambiando fila ${rowId} a ${nuevoEstado}...`);

    try {
        // Usamos POST con modo no-cors para evitar problemas de redirección de Google
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rowId: rowId,
                nuevoEstado: nuevoEstado
            })
        });

        alert("¡Actualización enviada!");
        location.reload(); // Recargar para ver los cambios

    } catch (error) {
        alert("Hubo un error al procesar la solicitud.");
        console.error(error);
    }
}