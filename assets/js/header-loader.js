(function() {
  // 1. Obtener la raíz del sitio de forma dinámica
  const scriptUrl = document.currentScript.src;
  const siteRoot = scriptUrl.split('assets/js/header-loader.js')[0];

  // 2. Determinar la página actual y su estado activo
  const path = window.location.pathname;
  let activeItem = '';
  
  if (path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/wcm') || path.endsWith('/wcm/')) {
    activeItem = 'inicio';
  } else if (path.includes('elclub.html')) {
    activeItem = 'elclub';
  } else if (path.includes('canchas.html')) {
    activeItem = 'canchas';
  } else if (path.includes('escalerilla.html')) {
    activeItem = 'escalerilla';
  } else if (path.includes('/torneos.html') || path.includes('/torneos/')) {
    activeItem = 'torneos';
  } else if (path.includes('estatutos.html')) {
    activeItem = 'estatutos';
  }

  const isHome = activeItem === 'inicio';

  // 3. Ajustar las clases del elemento contenedor del header
  const headerEl = document.getElementById('header');
  if (headerEl) {
    headerEl.className = isHome ? 'fixed-top' : 'fixed-top header-inner-pages';
    
    // Si estamos en home, remover el background oscuro inicial que se aplica a páginas internas
    if (isHome) {
      headerEl.style.background = '';
    } else {
      headerEl.style.background = 'rgba(0, 0, 0, 0.9)';
    }

    // 4. Inyectar la estructura interna del header
    headerEl.innerHTML = `
      <div class="container d-flex align-items-center justify-content-lg-between">
        <h1 class="${isHome ? 'logo1' : 'logo'} me-auto me-lg-0">
          <a href="${siteRoot}index.html">
            <img src="${siteRoot}assets/img/Logo-Ferro-3.png" alt="Logo Club de Tenis Ferroviario Santiago">
          </a>
        </h1>

        <nav id="navbar" class="navbar order-last order-lg-0" aria-label="Navegación principal del sitio">
          <ul>
            <li><a class="nav-link scrollto ${activeItem === 'inicio' ? 'active' : ''}" href="${siteRoot}index.html">Inicio</a></li>
            <li><a class="nav-link scrollto ${activeItem === 'elclub' ? 'active' : ''}" href="${siteRoot}elclub.html">El Club</a></li>
            <li><a class="nav-link scrollto ${activeItem === 'canchas' ? 'active' : ''}" href="${siteRoot}canchas.html">Canchas</a></li>
            <li><a class="nav-link scrollto ${activeItem === 'escalerilla' ? 'active' : ''}" href="${siteRoot}escalerilla.html">Escalerilla</a></li>
            <li><a class="nav-link scrollto ${activeItem === 'torneos' ? 'active' : ''}" href="${siteRoot}torneos.html">Torneos</a></li>
            <li><a class="nav-link scrollto" href="${siteRoot}index.html#directorio">Directorio</a></li> 
            <li><a class="nav-link scrollto ${activeItem === 'estatutos' ? 'active' : ''}" href="${siteRoot}estatutos.html">Estatutos</a></li>
          </ul>
          <i class="bi bi-list mobile-nav-toggle"></i>
        </nav>
      </div>
    `;
  }
})();
