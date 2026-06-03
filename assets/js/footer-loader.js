(function() {
  // 1. Obtener la raíz del sitio de forma dinámica
  const scriptUrl = document.currentScript.src;
  const siteRoot = scriptUrl.split('assets/js/footer-loader.js')[0];

  // 2. Inyectar la estructura interna del footer
  const footerEl = document.getElementById('footer');
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="footer-top">
        <div class="container">
          <div class="row">

            <div class="col-lg-3 col-md-6">
              <div class="footer-info">
                <h3>Club de Tenis Ferroviario<span>.</span></h3> 
              </div>
            </div>

            <div class="col-lg-2 col-md-6 footer-links">
              <h4 style="font-size:25px">Nuestra informacion</h4>
              <hr>
              <p>
                <strong>Direccion:</strong> <br>
                San Alfonso 2141 <br>
                Estacion Central, Santiago<br><br>
                
                <strong>Contacto:</strong> <br>
                (+569) 20277423 <br>
                (+562) 26835716 <br>
                <strong>Email:</strong> <br>
                info@example.com <br> <br>
                
                <strong>Horario:</strong>  <br>
                Martes a domingo <br>
                09:00 hrs - 23:00 hrs
              </p>
              <hr>
            </div>

            <div class="col-lg-3 col-md-6 footer-links">
              <h4 style="font-size:25px">Redes Sociales</h4>
              <br>
              <hr>
              <div class="social-links mt-3">
                <a href="https://www.instagram.com/club.ferroviario/?hl=es" class="instagram"><i class="bx bxl-instagram"></i></a> <a href="https://www.instagram.com/club.ferroviario/?hl=es">Instagram</a>
                <br>
                <a href="#" class="facebook"><i class="bx bxl-facebook"></i></a> Facebook
              </div>
              <hr>
            </div>

            <div class="col-lg-4 col-md-6 footer-newsletter">
              <img src="${siteRoot}assets/img/Logo-Ferro-3.png" style="width: 200px; height: auto;" alt="Logo Club de Tenis Ferroviario Santiago">
            </div>

          </div>
        </div>
      </div>
    `;
  }
})();
