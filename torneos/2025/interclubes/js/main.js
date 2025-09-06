var arrResult;
var arrRnk;

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
            {field:'Ferroviario',title:'Ferroviario',width:150,align:'left'},
            {field:'Municipal',title:'Municipal',width:150,align:'left'},
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