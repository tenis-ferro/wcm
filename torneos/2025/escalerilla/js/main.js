function cargarResultados2() {
    console.log('Cargando tabla');
}

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
        loadMsg:'Leyendoo resultado de los partidos'
      });
      $('#dg').datagrid('loading');
      /*
      $('#dg').datagrid('sort', {
        sortName: 'Nro',
        sortOrder: 'desc'
        });      
      */
      $('#dg').datagrid({
        data:resultados,
        loadMsg:'Leyendoo resultado de los partidos',
        loading:true,
        title:'Resultado de partidos',
        iconCls:'icon-ok',
        columns:[[
            {field:'Nro',title:'Nro',width:50},
            {field:'Fecha',title:'Fecha', width:100, formatter:function(val, row, idx){               
                var dt = new Date(Date.parse(val));
                
                var formattedDate = moment(dt).format('DD-MM-YYYY');
                //console.log(formattedDate,idx)
                return formattedDate;
            }},
            {field:'Categoria',title:'Categoria',width:80,align:'right'},
            {field:'Jugador 1',title:'Jugador 1',width:150,align:'right'},
            {field:'Jugador 2',title:'Jugador 2',width:150,align:'right'},
            {field:'Ganador',title:'Ganador',width:150,align:'right'},
            {field:'Resultado',title:'Resultado',width:100,align:'right'}
        ]],
        sort:{
            sortName: 'Nro',
            sortOrder: 'desc'
        }        
        });      

    } catch (error) {
      console.error(error.message);
    }
  }

  function formatFecha(val,row) {
    console.log('Formateando fecha ...')
  }