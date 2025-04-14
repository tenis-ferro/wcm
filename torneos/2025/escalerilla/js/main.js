async function cargarResultados() {
    const url = "https://script.google.com/macros/s/AKfycbyP1LxSSrheRTXQT4YvQZGNOIggL7g0PqzLsLc5vCNsmmQJL3HdJLTklrbKe7Wc4i-Y/exec?path=Partidos-Grupo&action=read";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      const resultados = json.data;
      //console.log(resultados);

      resultados.sort((a, b) => b.Nro - a.Nro);

      document.getElementById('load-resultados').setAttribute('hidden','hidden');

      //console.log(resultados);
      $('#dg').datagrid({
        data:resultados,
        loadMsg:'Leyendo resultado de los partidos',
        title:'Resultado de partidos',
        iconCls:'icon-ok',
        fitColumns:true,
        columns:[[
            {field:'Nro',title:'#',width:35},
            {field:'Fecha',title:'Fecha', width:100, formatter:function(val, row, idx){               
                var dt = new Date(Date.parse(val));
                
                var formattedDate = moment(dt).format('DD-MM-YYYY');
                //console.log(formattedDate,idx)
                return formattedDate;
            }},
            {field:'Ganador',title:'Ganador',width:150,align:'left',formatter:function(val, row, idx){               
              return '<span style="color:black;font-weight:bold;">'+val+'</span>';
            }},
            {field:'Jugador 1',title:'Partido', width:300,align:'left', formatter:function(val, row, idx){               
              //console.log(row,idx)
              let partido = '';
              return partido.concat(row["Jugador 1"],' / ', row["Jugador 2"]);
            }},
            {field:'Resultado',title:'Resultado',width:100,align:'left'},
            {field:'Categoria',title:'Categoria',width:80,align:'left'}
        ]]
        });
        
        $('#dg').datagrid('enableFilter');
        //$('#dg').datagrid('toExcel','resultados.xls'); 

    } catch (error) {
      console.error(error.message);
    }
  }