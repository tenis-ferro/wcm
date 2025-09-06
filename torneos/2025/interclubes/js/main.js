var arrResult;
var arrRnk;

function updateScoreboard (ferroScore, municipalScore) {
    const ferroScoreEl = document.getElementById('ferroviario-score');
    const municipalScoreEl = document.getElementById('municipal-score');  

    ferroScoreEl.textContent = ferroScore.toString().padStart(2, '0');
    municipalScoreEl.textContent = municipalScore.toString().padStart(2, '0');
};

async function cargarResultados() {
    const url = "https://script.google.com/macros/s/AKfycbxTtHDPsoX_Q0-hnxe0zgfeHG9pQQu8-zbyqycmljeNJ1gz2u_SOV4nlrVBhVGhqSm3/exec?path=Partidos&action=read";

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      var resultados = json.data;
      //console.log(resultados);
      //resultados = resultados.filter(item => item.Resultado != '');
      resultados.sort((a, b) => a.Nro - b.Nro);
      document.getElementById('load-resultados').setAttribute('hidden','hidden');
      //$('#divResult').css('display', 'block');

      // --- INICIO DE LA LÓGICA DE CONTEO ---
      // Se inicializa el objeto con los posibles ganadores.
      let victorias = {
        'Ferroviario': 0,
        'Municipal': 0
      };

      // Recorre el arreglo de resultados y cuenta las victorias de cada equipo.
      resultados.forEach(item => {
        if (item.Ganador) {
          if (victorias[item.Ganador] !== undefined) {
            victorias[item.Ganador]++;
          }
        }
      });
      
      // Actualiza el marcador con el conteo de victorias.
      updateScoreboard(victorias['Ferroviario'], victorias['Municipal']);
      // --- FIN DE LA LÓGICA DE CONTEO ---

      //console.log(resultados);
      $('#dg').datagrid({
        data:resultados,
        loadMsg:'Leyendo resultado de los partidos',
        title:'Resultado de partidos',
        iconCls:'icon-ok',
        //rownumbers: true,
        //fitColumns:true,
        columns:[[
            {field:'Nro',title:'#',width:35},
            {field:'Hora',title:'Hora',width:60},
            {field:'Ferroviario',title:'Ferroviario',width:180,align:'left'},
            {field:'Municipal',title:'Municipal',width:180,align:'left'},
            {field:'Ganador',title:'Ganador',width:100,align:'left',formatter:function(val, row, idx){               
              return '<span style="color:black;font-weight:bold;">'+val+'</span>';
            }},            
            {field:'Resultado',title:'Resultado',width:120,align:'left'}
        ]],        
        });
        
        //$('#dg').datagrid('enableFilter');
        /*
        $('#dg').datagrid({
          onLoadSuccess: function() {
            console.log('Resultados cargados');                        
          }
        });
        */
        //$('#dg').datagrid('toExcel','resultados.xls');  

        //cargarClasificacion('Damas');
    } catch (error) {
      console.error(error.message);
    }
  }