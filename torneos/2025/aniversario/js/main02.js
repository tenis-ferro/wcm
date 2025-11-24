var arrResult;
var arrRnk;
const url = "https://script.google.com/macros/s/AKfycbz3v-tPBGOyCqZfzsz7GejHrni6LV6zFvWyR7_V_q3uUTgZ6KICB_SWPzb8t_NHMPtI/exec?path=Partidos-Grupo&action=read";  
//const url = "./data/resultados-02.json";

async function cargarResultados() {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      var resultados = json.data;
      //console.log(resultados);
      resultados = resultados.filter(item => item.Nro != '' && item.Resultado != '' && item.Fase != 'RR' );
      resultados.sort((a, b) => b.Nro - a.Nro);

      document.getElementById('load-resultados').setAttribute('hidden','hidden');
      console.log(resultados);
      $('#dg').datagrid({
        data:resultados,
        loadMsg:'Leyendo resultado de los partidos',
        title:'Resultado de partidos',
        iconCls:'icon-ok',
        //rownumbers: true,
        //fitColumns:true,
        columns:[[
            {field:'Nro',title:'#',width:35},
            {field:'Fecha',title:'Fecha', width:100, formatter:function(val, row, idx){               
                var dt = new Date(Date.parse(val));
                
                var formattedDate = moment(dt).format('DD-MM-YYYY');
                //console.log(formattedDate,idx)
                return formattedDate;
            }},
            {field:'Ganador',title:'Ganador',width:200,align:'left',formatter:function(val, row, idx){               
              return '<span style="color:black;font-weight:bold;">'+val+'</span>';
            }},
            {field:'Jugador 1',title:'Partido', width:350,align:'left', formatter:function(val, row, idx){               
              //console.log(row,idx)
              let partido = '';
              return partido.concat(row["Jugador 1"],' / ', row["Jugador 2"]);
            }},
            {field:'Resultado',title:'Resultado',width:150,align:'left'},
            {field:'Categoria',title:'Categoria',width:80,align:'left'},
            {field:'Fase',title:'Ronda',width:80,align:'left'}
        ]],        
        });
        
        $('#dg').datagrid('enableFilter');
        /*
        $('#dg').datagrid({
          onLoadSuccess: function() {
            console.log('Resultados cargados');                        
          }
        });
        */
        //$('#dg').datagrid('toExcel','resultados.xls'); 

    } catch (error) {
      console.error(error.message);
    }
  }