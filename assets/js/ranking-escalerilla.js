/**
 * Ranking Interno / Escalerilla - Club de Tenis Ferroviario Santiago
 * Lectura en tiempo real desde Google Apps Script Web App / Google Sheets API.
 */

(function () {
  'use strict';

  // 1. CONFIGURACIÓN
  const CONFIG = {
    // Endpoint oficial de Google Apps Script Web App (devuelve JSON directo del Google Sheet)
    defaultApiUrl: 'https://script.google.com/macros/s/AKfycbz_4ZSy7JQJP3OhbrxYMzNjlT2kOhPZHgqLHc-UrSc9iiPXAku86_T9zqZUrIdmmEDm3Q/exec',
    storageKeyApiUrl: 'ferro_ranking_custom_api_url',
    storageKeyCache: 'ferro_ranking_cached_data_v2',
    pdfUrl: 'assets/pdf/RUF-2025-03.pdf',
    reglamentoUrl: 'https://drive.google.com/uc?export=download&id=1zn3vJKlolhu3EpUMeJMkHuZPAzJuA58a',

    // Categorías oficiales en orden
    categoryOrder: ['HONOR', 'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'DAMAS'],

    // Etiquetas y badges amigables para cada categoría
    categoryLabels: {
      'HONOR': { name: 'Categoría Honor', badge: '🏆 Honor', icon: 'bi-trophy-fill', color: '#f59e0b' },
      'PRIMERA': { name: 'Categoría Primera', badge: '1ª Primera', icon: 'bi-award-fill', color: '#0284c7' },
      'SEGUNDA': { name: 'Categoría Segunda', badge: '2ª Segunda', icon: 'bi-circle-fill', color: '#16a34a' },
      'TERCERA': { name: 'Categoría Tercera', badge: '3ª Tercera', icon: 'bi-circle-fill', color: '#d97706' },
      'CUARTA': { name: 'Categoría Cuarta', badge: '4ª Cuarta', icon: 'bi-circle-fill', color: '#9333ea' },
      'DAMAS': { name: 'Categoría Damas', badge: '🎾 Damas', icon: 'bi-suit-heart-fill', color: '#ec4899' }
    },

    // 2. DATOS DE RESPALDO (Sincronizados con el API oficial de Google Sheet)
    fallbackData: {
      "fechaActualizacion": "Sincronizado en tiempo real",
      "fuente": "Google Sheets API",
      "categorias": {
            "HONOR": [
                  {
                        "pos": 1,
                        "ruf": 1,
                        "nombre": "Felipe Riveros"
                  },
                  {
                        "pos": 2,
                        "ruf": 2,
                        "nombre": "Felipe Tamayo"
                  },
                  {
                        "pos": 3,
                        "ruf": 3,
                        "nombre": "Rodrigo Caceres"
                  },
                  {
                        "pos": 4,
                        "ruf": 4,
                        "nombre": "Javier Zuñiga"
                  },
                  {
                        "pos": 5,
                        "ruf": 5,
                        "nombre": "Patricio Mella"
                  },
                  {
                        "pos": 6,
                        "ruf": 6,
                        "nombre": "Ignacio Gonzalez"
                  }
            ],
            "PRIMERA": [
                  {
                        "pos": 1,
                        "ruf": 7,
                        "nombre": "Francisco Farias"
                  },
                  {
                        "pos": 2,
                        "ruf": 8,
                        "nombre": "Javier Rivera"
                  },
                  {
                        "pos": 3,
                        "ruf": 9,
                        "nombre": "Nicolas Caceres"
                  },
                  {
                        "pos": 4,
                        "ruf": 10,
                        "nombre": "Roy Diaz"
                  },
                  {
                        "pos": 5,
                        "ruf": 11,
                        "nombre": "Cesar Barahona"
                  },
                  {
                        "pos": 6,
                        "ruf": 12,
                        "nombre": "Juan Antican"
                  },
                  {
                        "pos": 7,
                        "ruf": 13,
                        "nombre": "Paulo Corvalan"
                  },
                  {
                        "pos": 8,
                        "ruf": 14,
                        "nombre": "Williams Bustos"
                  },
                  {
                        "pos": 9,
                        "ruf": 15,
                        "nombre": "Ramón Suarez"
                  },
                  {
                        "pos": 10,
                        "ruf": 16,
                        "nombre": "Francisco Farias"
                  },
                  {
                        "pos": 11,
                        "ruf": 17,
                        "nombre": "Fernando Ibarra"
                  },
                  {
                        "pos": 12,
                        "ruf": 18,
                        "nombre": "Jorge Olivares"
                  },
                  {
                        "pos": 13,
                        "ruf": 19,
                        "nombre": "Alejandro Zenteno"
                  },
                  {
                        "pos": 14,
                        "ruf": 20,
                        "nombre": "Nain Obreque"
                  },
                  {
                        "pos": 15,
                        "ruf": 21,
                        "nombre": "JL Dinamarca"
                  },
                  {
                        "pos": 16,
                        "ruf": 22,
                        "nombre": "Franco Vargas"
                  },
                  {
                        "pos": 17,
                        "ruf": 23,
                        "nombre": "Christian Quevedo"
                  },
                  {
                        "pos": 18,
                        "ruf": 24,
                        "nombre": "Luis Tapia"
                  },
                  {
                        "pos": 19,
                        "ruf": 25,
                        "nombre": "JL Martinez"
                  }
            ],
            "SEGUNDA": [
                  {
                        "pos": 1,
                        "ruf": 26,
                        "nombre": "Ramtes Huenuman"
                  },
                  {
                        "pos": 2,
                        "ruf": 27,
                        "nombre": "JL Palma"
                  },
                  {
                        "pos": 3,
                        "ruf": 28,
                        "nombre": "Marco Silva"
                  },
                  {
                        "pos": 4,
                        "ruf": 29,
                        "nombre": "Rodrigo Reyes"
                  },
                  {
                        "pos": 5,
                        "ruf": 30,
                        "nombre": "Alejandro Herrera"
                  },
                  {
                        "pos": 6,
                        "ruf": 31,
                        "nombre": "Maurcio Taiba"
                  },
                  {
                        "pos": 7,
                        "ruf": 32,
                        "nombre": "Miguel Rubio"
                  },
                  {
                        "pos": 8,
                        "ruf": 33,
                        "nombre": "Gastón Villarroel"
                  },
                  {
                        "pos": 9,
                        "ruf": 34,
                        "nombre": "Hernan Aedo"
                  },
                  {
                        "pos": 10,
                        "ruf": 35,
                        "nombre": "Fabian Sanchez"
                  },
                  {
                        "pos": 11,
                        "ruf": 36,
                        "nombre": "Alejandro Tamayo"
                  },
                  {
                        "pos": 12,
                        "ruf": 37,
                        "nombre": "Ariel Lopez"
                  },
                  {
                        "pos": 13,
                        "ruf": 38,
                        "nombre": "Roberto Cordero"
                  },
                  {
                        "pos": 14,
                        "ruf": 39,
                        "nombre": "Marco Godoy"
                  },
                  {
                        "pos": 15,
                        "ruf": 40,
                        "nombre": "Eduardo Garcia"
                  },
                  {
                        "pos": 16,
                        "ruf": 41,
                        "nombre": "Alejandro Guerrero"
                  }
            ],
            "TERCERA": [
                  {
                        "pos": 1,
                        "ruf": 42,
                        "nombre": "Mauricio Aguirre"
                  },
                  {
                        "pos": 2,
                        "ruf": 43,
                        "nombre": "Mauricio Tobar"
                  },
                  {
                        "pos": 3,
                        "ruf": 44,
                        "nombre": "Luis Carvacho"
                  },
                  {
                        "pos": 4,
                        "ruf": 45,
                        "nombre": "Jean Marchant"
                  },
                  {
                        "pos": 5,
                        "ruf": 46,
                        "nombre": "Francisco Abasolo"
                  },
                  {
                        "pos": 6,
                        "ruf": 47,
                        "nombre": "Jaime Vasquez"
                  },
                  {
                        "pos": 7,
                        "ruf": 48,
                        "nombre": "Felipe Peñaranda"
                  },
                  {
                        "pos": 8,
                        "ruf": 49,
                        "nombre": "Manuel Tamayo"
                  },
                  {
                        "pos": 9,
                        "ruf": 50,
                        "nombre": "Claudio Bustos"
                  },
                  {
                        "pos": 10,
                        "ruf": 51,
                        "nombre": "Hernan Vega"
                  },
                  {
                        "pos": 11,
                        "ruf": 52,
                        "nombre": "Victor Alvial"
                  },
                  {
                        "pos": 12,
                        "ruf": 53,
                        "nombre": "Nicolas Martinez"
                  },
                  {
                        "pos": 13,
                        "ruf": 54,
                        "nombre": "Horacio Palma"
                  },
                  {
                        "pos": 14,
                        "ruf": 55,
                        "nombre": "Mario Sandoval"
                  },
                  {
                        "pos": 15,
                        "ruf": 56,
                        "nombre": "Mauricio Berendsen"
                  }
            ],
            "CUARTA": [
                  {
                        "pos": 1,
                        "ruf": 57,
                        "nombre": "Joaquin Gatica"
                  },
                  {
                        "pos": 2,
                        "ruf": 58,
                        "nombre": "JL Orellana"
                  },
                  {
                        "pos": 3,
                        "ruf": 59,
                        "nombre": "Arturo Palma"
                  },
                  {
                        "pos": 4,
                        "ruf": 60,
                        "nombre": "Carlos Echeverría"
                  },
                  {
                        "pos": 5,
                        "ruf": 61,
                        "nombre": "Nicolas Castillo"
                  },
                  {
                        "pos": 6,
                        "ruf": 62,
                        "nombre": "B.Garrido"
                  },
                  {
                        "pos": 7,
                        "ruf": 63,
                        "nombre": "Rodrigo Bustamante"
                  },
                  {
                        "pos": 8,
                        "ruf": 64,
                        "nombre": "Hugo Gutierrez"
                  },
                  {
                        "pos": 9,
                        "ruf": 65,
                        "nombre": "E.Garrido"
                  },
                  {
                        "pos": 10,
                        "ruf": 66,
                        "nombre": "P.Watt"
                  },
                  {
                        "pos": 11,
                        "ruf": 67,
                        "nombre": "Sherman Ravelo"
                  },
                  {
                        "pos": 12,
                        "ruf": 68,
                        "nombre": "Juan Fuentes"
                  },
                  {
                        "pos": 13,
                        "ruf": 69,
                        "nombre": "Nelson Tobar"
                  },
                  {
                        "pos": 14,
                        "ruf": 70,
                        "nombre": "Guillermo Reygadas"
                  },
                  {
                        "pos": 15,
                        "ruf": 71,
                        "nombre": "Victor Gutierrez"
                  },
                  {
                        "pos": 16,
                        "ruf": 72,
                        "nombre": "Felipe Moran"
                  }
            ],
            "DAMAS": [
                  {
                        "pos": 1,
                        "ruf": 73,
                        "nombre": "Loren Illesca"
                  },
                  {
                        "pos": 2,
                        "ruf": 74,
                        "nombre": "MA Tamayo"
                  },
                  {
                        "pos": 3,
                        "ruf": 75,
                        "nombre": "Soledad Sandoval"
                  },
                  {
                        "pos": 4,
                        "ruf": 76,
                        "nombre": "Dimari Diaz"
                  },
                  {
                        "pos": 5,
                        "ruf": 77,
                        "nombre": "Flor Araya"
                  },
                  {
                        "pos": 6,
                        "ruf": 78,
                        "nombre": "Herminia Marquez"
                  },
                  {
                        "pos": 7,
                        "ruf": 79,
                        "nombre": "Johana Cespedes"
                  },
                  {
                        "pos": 8,
                        "ruf": 80,
                        "nombre": "Andrea Ibarra"
                  }
            ]
      }
}
  };

  // 3. ESTADO DE LA APLICACIÓN
  const state = {
    currentCategory: 'ALL',
    searchQuery: '',
    data: null,
    isOnline: false,
    selectedPlayer: null, // { pos, ruf, nombre, categoria }
    isLoading: false
  };

  // 4. LIMPIEZA DE CARACTERES Y NOMBRES
  function cleanPlayerName(str) {
    if (!str) return '';
    return str
      .replace(/Zu[\ufffd]iga/gi, 'Zúñiga')
      .replace(/Ram[\ufffd]n/gi, 'Ramón')
      .replace(/Gast[\ufffd]n/gi, 'Gastón')
      .replace(/Pe[\ufffd]aranda/gi, 'Peñaranda')
      .replace(/Pe[\ufffd]a/gi, 'Peña')
      .replace(/Echeverr[\ufffd]a/gi, 'Echeverría')
      .replace(/Mu[\ufffd]oz/gi, 'Muñoz')
      .replace(/Mart[\ufffd]nez/gi, 'Martínez')
      .replace(/Garc[\ufffd]a/gi, 'García')
      .replace(/Gonz[\ufffd]lez/gi, 'González')
      .replace(/C[\ufffd]ceres/gi, 'Cáceres')
      .replace(/Ib[\ufffd][\ufffd]ez|Ib[\ufffd]ez/gi, 'Ibáñez')
      .replace(/[\ufffd]/g, '')
      .trim();
  }

  // Normaliza el nombre de la categoría
  function normalizeCategoryName(raw) {
    if (!raw) return '';
    const clean = raw.toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace('CATEGORIA', '')
      .trim();

    if (clean.includes('HONOR')) return 'HONOR';
    if (clean === 'A' || clean.includes('PRIMERA')) return 'PRIMERA';
    if (clean === 'B' || clean.includes('SEGUNDA')) return 'SEGUNDA';
    if (clean === 'C' || clean.includes('TERCERA')) return 'TERCERA';
    if (clean === 'D' || clean.includes('CUARTA')) return 'CUARTA';
    if (clean.includes('DAMA')) return 'DAMAS';
    return clean;
  }

  // 5. PARSERS: JSON API (PRIMARY) & CSV (FALLBACK)
  function processJsonApiData(items) {
    const categorias = {};
    CONFIG.categoryOrder.forEach(c => {
      categorias[c] = [];
    });

    items.forEach(item => {
      const catKey = normalizeCategoryName(item.Categoria);
      if (!categorias[catKey]) {
        categorias[catKey] = [];
      }
      categorias[catKey].push({
        pos: parseInt(item.Nro, 10),
        ruf: parseInt(item.RUF, 10),
        nombre: cleanPlayerName(item.Nombre)
      });
    });

    // Ordenar cada categoría por posición interna
    Object.keys(categorias).forEach(c => {
      categorias[c].sort((a, b) => a.pos - b.pos);
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      fechaActualizacion: formattedDate,
      fuente: 'Google Apps Script (En vivo)',
      categorias: categorias
    };
  }

  function parseCSV(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);
    return lines;
  }

  function processCsvData(rows) {
    let fecha = '';
    const categorias = {};
    let currentCat = '';

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const fullLine = row.join(' ').trim();

      if (!fecha && /fecha\s*actualizaci[oó]n/i.test(fullLine)) {
        const match = fullLine.match(/fecha\s*actualizaci[oó]n\s*[:\-]?\s*([0-9a-zA-ZáéíóúÁÉÍÓÚ\s]+)/i);
        if (match && match[1]) {
          fecha = match[1].replace(/[,:]/g, '').trim();
        }
      }

      const isCategoryRow = row.some(cell => /CATEGOR[IÍ]A/i.test(cell));
      if (isCategoryRow) {
        const catCell = row.find(cell => /CATEGOR[IÍ]A/i.test(cell));
        const catNormalized = normalizeCategoryName(catCell);
        if (catNormalized) {
          currentCat = catNormalized;
          if (!categorias[currentCat]) categorias[currentCat] = [];
          continue;
        }
      }

      if (currentCat) {
        for (let c = 0; c < row.length; c++) {
          const val = row[c] ? row[c].trim() : '';
          const posMatch = val.match(/^0?([1-9][0-9]?)$/);
          if (posMatch) {
            const pos = parseInt(posMatch[1], 10);
            const nextVal = (c + 1 < row.length && row[c + 1]) ? row[c + 1].trim() : '';
            if (nextVal && !/^0?[0-9]+$/.test(nextVal) && !/CATEGOR/i.test(nextVal)) {
              if (!categorias[currentCat].some(p => p.pos === pos)) {
                categorias[currentCat].push({
                  pos: pos,
                  ruf: null,
                  nombre: cleanPlayerName(nextVal)
                });
              }
            }
          }
        }
      }
    }

    Object.keys(categorias).forEach(cat => {
      categorias[cat].sort((a, b) => a.pos - b.pos);
    });

    return {
      fechaActualizacion: fecha || 'Reciente',
      fuente: 'Google Sheets (CSV)',
      categorias: categorias
    };
  }

  // 6. OBTENCIÓN ASÍNCRONA DE DATOS
  async function fetchRankingData() {
    const customUrl = localStorage.getItem(CONFIG.storageKeyApiUrl);
    const endpointUrl = customUrl || CONFIG.defaultApiUrl;

    // 1. Mostrar de inmediato la caché o el fallback precargado
    const cached = localStorage.getItem(CONFIG.storageKeyCache);
    if (cached) {
      try {
        state.data = JSON.parse(cached);
        renderApp();
      } catch (e) {
        state.data = CONFIG.fallbackData;
        renderApp();
      }
    } else {
      state.data = CONFIG.fallbackData;
      renderApp();
    }

    // 2. Fetch en vivo desde Google Apps Script Web App / Google Sheet
    try {
      const response = await fetch(endpointUrl, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const rawText = await response.text();
      let parsedData;

      // Detectar si la respuesta es JSON o CSV
      const trimmed = rawText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const jsonItems = JSON.parse(trimmed);
        parsedData = processJsonApiData(Array.isArray(jsonItems) ? jsonItems : [jsonItems]);
      } else {
        const rows = parseCSV(rawText);
        parsedData = processCsvData(rows);
      }

      state.data = parsedData;
      state.isOnline = true;
      localStorage.setItem(CONFIG.storageKeyCache, JSON.stringify(parsedData));
      renderApp();
    } catch (err) {
      console.warn('Conexión con Google Apps Script no disponible, usando respaldo:', err.message);
      state.isOnline = false;
      if (!state.data) {
        state.data = CONFIG.fallbackData;
      }
      renderApp();
    }
  }

  // 7. RENDERIZADO DE LA INTERFAZ
  function getTotalPlayers(data) {
    if (!data || !data.categorias) return 0;
    return Object.values(data.categorias).reduce((acc, cat) => acc + cat.length, 0);
  }

  function renderApp() {
    renderHeaderStats();
    renderCategoryTabs();
    renderChallengeHelper();
    renderRankingList();
  }

  function renderHeaderStats() {
    const totalPlayers = getTotalPlayers(state.data);
    const dateEl = document.getElementById('stat-last-update');
    const totalEl = document.getElementById('stat-total-players');
    const badgeStatusEl = document.getElementById('badge-sync-status');

    if (totalEl) totalEl.textContent = totalPlayers;
    if (dateEl && state.data) {
      dateEl.textContent = state.data.fechaActualizacion || 'Sincronizado';
    }

    if (badgeStatusEl) {
      if (state.isOnline) {
        badgeStatusEl.innerHTML = `<span class="status-dot online"></span> Conectado en Vivo (Google Sheet)`;
      } else {
        badgeStatusEl.innerHTML = `<span class="status-dot fallback"></span> Datos Oficiales RUF (Caché)`;
      }
    }
  }

  function renderCategoryTabs() {
    const container = document.getElementById('category-tabs-container');
    if (!container || !state.data) return;

    const totalCount = getTotalPlayers(state.data);
    let html = `
      <button class="cat-tab-btn ${state.currentCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
        Todas <span class="cat-tab-count">${totalCount}</span>
      </button>
    `;

    CONFIG.categoryOrder.forEach(catKey => {
      const list = state.data.categorias[catKey] || [];
      const info = CONFIG.categoryLabels[catKey] || { badge: catKey };
      const isActive = state.currentCategory === catKey;

      html += `
        <button class="cat-tab-btn ${isActive ? 'active' : ''}" data-cat="${catKey}">
          ${info.badge} <span class="cat-tab-count">${list.length}</span>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentCategory = btn.getAttribute('data-cat');
        if (state.selectedPlayer && state.currentCategory !== 'ALL' && state.selectedPlayer.categoria !== state.currentCategory) {
          state.selectedPlayer = null;
        }
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        renderApp();
      });
    });
  }

  function renderChallengeHelper() {
    const box = document.getElementById('challenge-helper-box');
    const mobileBar = document.getElementById('mobile-floating-challenge-bar');

    if (!state.selectedPlayer) {
      if (box) {
        box.innerHTML = `
          <div class="challenge-helper-text">
            <i class="bi bi-info-circle-fill"></i>
            <div>
              <strong>Simulador de Desafíos Oficial:</strong>
              <span class="d-block text-muted" style="font-size: 0.85rem;">
                Toca sobre cualquier socio para ver a quién puede desafiar (hasta 3 puestos arriba en su categoría).
              </span>
            </div>
          </div>
          <div>
            <a href="#reglamento" class="btn btn-sm btn-outline-primary" style="border-radius: 20px;">
              <i class="bi bi-book"></i> Ver Reglas
            </a>
          </div>
        `;
      }
      if (mobileBar) {
        mobileBar.style.display = 'none';
      }
    } else {
      const p = state.selectedPlayer;
      const catInfo = CONFIG.categoryLabels[p.categoria] || { badge: p.categoria };
      const rufText = p.ruf ? `(RUF #${p.ruf})` : '';

      if (box) {
        box.innerHTML = `
          <div class="challenge-helper-text">
            <i class="bi bi-check-circle-fill text-success"></i>
            <div>
              <strong>Jugador seleccionado: ${p.nombre}</strong> — Puesto #${p.pos} ${catInfo.badge} ${rufText}
              <span class="d-block text-muted" style="font-size: 0.85rem;">
                Las tarjetas con borde verde y etiqueta <strong>DESAFIABLE</strong> indican los rivales a los que puede desafiar.
              </span>
            </div>
          </div>
          <button id="btn-clear-selection" class="btn btn-sm btn-outline-secondary" style="border-radius: 20px;">
            <i class="bi bi-x-circle"></i> Quitar Selección
          </button>
        `;

        const btnClear = document.getElementById('btn-clear-selection');
        if (btnClear) {
          btnClear.addEventListener('click', () => {
            state.selectedPlayer = null;
            renderApp();
          });
        }
      }

      // Actualizar y mostrar la barra flotante móvil
      if (mobileBar) {
        const titleEl = document.getElementById('mobile-challenge-title');
        const subtitleEl = document.getElementById('mobile-challenge-subtitle');
        if (titleEl) titleEl.textContent = p.nombre;
        if (subtitleEl) subtitleEl.textContent = `Puesto #${p.pos} ${catInfo.badge} ${p.ruf ? '· RUF #' + p.ruf : ''}`;
        mobileBar.style.display = 'flex';
      }
    }
  }

  function renderRankingList() {
    const container = document.getElementById('ranking-list-container');
    if (!container || !state.data) return;

    const query = (state.searchQuery || '').trim().toLowerCase();
    const categoriesToRender = state.currentCategory === 'ALL'
      ? CONFIG.categoryOrder
      : [state.currentCategory];

    let totalMatches = 0;
    let fullHtml = '';

    categoriesToRender.forEach(catKey => {
      const players = state.data.categorias[catKey] || [];
      const info = CONFIG.categoryLabels[catKey] || { name: `Categoría ${catKey}`, icon: 'bi-trophy' };

      const filtered = players.filter(p => {
        if (!query) return true;
        const inName = p.nombre.toLowerCase().includes(query);
        const inPos = String(p.pos) === query;
        const inRuf = p.ruf && String(p.ruf) === query;
        return inName || inPos || inRuf;
      });

      if (filtered.length === 0 && query) return;

      totalMatches += filtered.length;

      fullHtml += `
        <div class="category-block" data-category="${catKey}">
          <div class="category-header">
            <h3 class="category-title">
              <i class="bi ${info.icon}"></i> ${info.name}
            </h3>
            <span class="category-badge-count">${filtered.length} jugadores</span>
          </div>
          <div class="players-grid">
      `;

      filtered.forEach(player => {
        const isPodium1 = player.pos === 1;
        const isPodium2 = player.pos === 2;
        const isPodium3 = player.pos === 3;

        let rankClass = '';
        let podiumIcon = '';
        if (isPodium1) {
          rankClass = 'rank-1';
          podiumIcon = '<span class="player-podium-icon" title="Campeón / Número 1">🥇</span>';
        } else if (isPodium2) {
          rankClass = 'rank-2';
          podiumIcon = '<span class="player-podium-icon" title="Número 2">🥈</span>';
        } else if (isPodium3) {
          rankClass = 'rank-3';
          podiumIcon = '<span class="player-podium-icon" title="Número 3">🥉</span>';
        }

        let challengeClass = '';
        let targetBadge = '';

        if (state.selectedPlayer) {
          if (state.selectedPlayer.categoria === catKey && state.selectedPlayer.pos === player.pos) {
            challengeClass = 'selected-challenger';
          } else if (
            state.selectedPlayer.categoria === catKey &&
            player.pos < state.selectedPlayer.pos &&
            player.pos >= state.selectedPlayer.pos - 3
          ) {
            challengeClass = 'challenge-target';
            targetBadge = '<span class="target-badge">Desafiable</span>';
          }
        }

        let displayName = player.nombre;
        if (query && displayName.toLowerCase().includes(query)) {
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          displayName = displayName.replace(regex, '<mark style="background:#fef08a; padding:1px 3px; border-radius:3px;">$1</mark>');
        }

        const rufBadge = player.ruf ? `<span class="player-ruf-badge" title="Ranking General del Club">RUF #${player.ruf}</span>` : '';

        fullHtml += `
          <div class="player-card ${rankClass} ${challengeClass}" 
               data-pos="${player.pos}" 
               data-ruf="${player.ruf || ''}"
               data-name="${player.nombre}" 
               data-category="${catKey}"
               title="Haz clic para calcular desafíos">
            <div class="player-rank">#${player.pos}</div>
            <div class="player-info">
              <p class="player-name">${displayName}</p>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="player-category-tag">${info.name}</span>
                ${rufBadge}
              </div>
            </div>
            ${targetBadge}
            ${podiumIcon}
          </div>
        `;
      });

      fullHtml += `
          </div>
        </div>
      `;
    });

    if (totalMatches === 0) {
      fullHtml = `
        <div class="no-results-box">
          <i class="bi bi-search"></i>
          <h4>No encontramos jugadores con "${query}"</h4>
          <p>Verifica que el nombre o número esté bien escrito o selecciona "Todas las categorías".</p>
          <button id="btn-reset-search" class="btn btn-outline-secondary mt-2" style="border-radius:20px;">
            Limpiar búsqueda
          </button>
        </div>
      `;
    }

    container.innerHTML = fullHtml;

    container.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', () => {
        const pos = parseInt(card.getAttribute('data-pos'), 10);
        const rufVal = card.getAttribute('data-ruf');
        const ruf = rufVal ? parseInt(rufVal, 10) : null;
        const nombre = card.getAttribute('data-name');
        const categoria = card.getAttribute('data-category');

        if (state.selectedPlayer && state.selectedPlayer.nombre === nombre && state.selectedPlayer.categoria === categoria) {
          state.selectedPlayer = null;
        } else {
          state.selectedPlayer = { pos, ruf, nombre, categoria };
        }
        renderApp();
      });
    });

    const resetBtn = document.getElementById('btn-reset-search');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('ranking-search-input');
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        renderApp();
      });
    }
  }

  // 8. EVENTOS Y MODAL DE CONFIGURACIÓN
  function setupEvents() {
    const searchInput = document.getElementById('ranking-search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const syncBtn = document.getElementById('btn-sync-now');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (clearBtn) clearBtn.style.display = e.target.value ? 'block' : 'none';
        renderApp();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearBtn.style.display = 'none';
        renderApp();
      });
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        const origText = syncBtn.innerHTML;
        syncBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sincronizando...';
        await fetchRankingData();
        syncBtn.disabled = false;
        syncBtn.innerHTML = origText;
      });
    }

    const btnOpenConfig = document.getElementById('btn-open-sheet-config');
    const configModalEl = document.getElementById('sheetConfigModal');
    const btnSaveSheet = document.getElementById('btn-save-sheet-url');
    const btnResetSheet = document.getElementById('btn-reset-sheet-url');
    const inputSheetUrl = document.getElementById('input-custom-sheet-url');

    if (btnOpenConfig && configModalEl && window.bootstrap) {
      const modal = new bootstrap.Modal(configModalEl);
      btnOpenConfig.addEventListener('click', (e) => {
        e.preventDefault();
        if (inputSheetUrl) {
          inputSheetUrl.value = localStorage.getItem(CONFIG.storageKeyApiUrl) || CONFIG.defaultApiUrl;
        }
        modal.show();
      });

      if (btnSaveSheet) {
        btnSaveSheet.addEventListener('click', async () => {
          const val = inputSheetUrl ? inputSheetUrl.value.trim() : '';
          if (val) {
            localStorage.setItem(CONFIG.storageKeyApiUrl, val);
            localStorage.removeItem(CONFIG.storageKeyCache);
            modal.hide();
            await fetchRankingData();
          }
        });
      }

      if (btnResetSheet) {
        btnResetSheet.addEventListener('click', async () => {
          localStorage.removeItem(CONFIG.storageKeyApiUrl);
          localStorage.removeItem(CONFIG.storageKeyCache);
          if (inputSheetUrl) inputSheetUrl.value = CONFIG.defaultApiUrl;
          modal.hide();
          await fetchRankingData();
        });
      }

      const btnOpenConfigMobile = document.getElementById('btn-open-sheet-config-mobile');
      if (btnOpenConfigMobile) {
        btnOpenConfigMobile.addEventListener('click', (e) => {
          e.preventDefault();
          if (inputSheetUrl) {
            inputSheetUrl.value = localStorage.getItem(CONFIG.storageKeyApiUrl) || CONFIG.defaultApiUrl;
          }
          modal.show();
        });
      }
    }

    // Eventos de la barra flotante móvil
    const btnMobileClose = document.getElementById('btn-mobile-close');
    if (btnMobileClose) {
      btnMobileClose.addEventListener('click', () => {
        state.selectedPlayer = null;
        renderApp();
      });
    }

    const btnMobileJump = document.getElementById('btn-mobile-jump');
    if (btnMobileJump) {
      btnMobileJump.addEventListener('click', () => {
        const target = document.querySelector('.challenge-target');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  // 9. ARRANQUE
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    fetchRankingData();
  });

})();
