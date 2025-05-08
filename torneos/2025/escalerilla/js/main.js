var arrResult;
var arrRnk;

async function cargarResultados() {
    //const url = "https://script.google.com/macros/s/AKfycbyP1LxSSrheRTXQT4YvQZGNOIggL7g0PqzLsLc5vCNsmmQJL3HdJLTklrbKe7Wc4i-Y/exec?path=Partidos-Grupo&action=read";
    //const url2 = "https://script.google.com/macros/s/AKfycbyP1LxSSrheRTXQT4YvQZGNOIggL7g0PqzLsLc5vCNsmmQJL3HdJLTklrbKe7Wc4i-Y/exec?path=Rnk-Grupos&action=read";

    const url = "/wcm/torneos/2025/escalerilla/data/resultados.json";
    const url2 = "/wcm/torneos/2025/escalerilla/data/clasificados.json";    

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      var resultados = json.data;
      //console.log(resultados);
      resultados = resultados.filter(item => item.Resultado != '');
      resultados.sort((a, b) => b.Nro - a.Nro);

      const response2 = await fetch(url2);
      if (!response2.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const json2 = await response2.json();
      arrRnk = json2.data;      

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
            {field:'Categoria',title:'Categoria',width:80,align:'left'}
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



        $('#cat').combobox({
          onSelect: function(rec){
            console.log(rec);
            cargarClasificacion(rec.value);
            //document.getElementById('load-resultados2').setAttribute('hidden','hidden');
          }
        });        

        //cargarClasificacion('Damas');
    } catch (error) {
      console.error(error.message);
    }
  }

  function cargarClasificacion(Categoria) {    
    //console.log(arrRnk);
    /*
    $('#dg1').datagrid('loadData', []);
    $('#dg2').datagrid('loadData', []);
    $('#dg3').datagrid('loadData', []);
    $('#dg4').datagrid('loadData', []);
    $('#dg5').datagrid('loadData', []);
    $('#dg6').datagrid('loadData', []);
    */
    const af1 = arrRnk.filter(item => item.Categoria == Categoria && item.Grupo == 'G1');
    const af2 = arrRnk.filter(item => item.Categoria == Categoria && item.Grupo == 'G2');
    const af3 = arrRnk.filter(item => item.Categoria == Categoria && item.Grupo == 'G3');
    const af4 = arrRnk.filter(item => item.Categoria == Categoria && item.Grupo == 'G4');
    const af5 = arrRnk.filter(item => item.Categoria == Categoria && item.Grupo == 'G5');
    const af6 = arrRnk.filter(item => item.Categoria == Categoria && item.Grupo == 'G6');

    //const m3c1 = af1.filter(item => item.Rnk == 3 && item.M3 == 'SI');
    const m3c1 = arrRnk.filter(item => item.Categoria == Categoria && item.Rnk == 3 && item.M3 == 'SI');
    //console.log('m3c1.length:',m3c1.length);
    //console.log('m3c1:',m3c1);

    //console.log(af1);
    console.log(af1.length,af2.length,af3.length,af4.length,af5.length,af6.length);

    m3c1.sort((a, b) => a.POS - b.POS);
                
    $('#dgm3').datagrid({
      data:m3c1,
      loadMsg:'Leyendo Ranking',
      title:'Mejores terceros',
      iconCls:'icon-ok',
      //rownumbers: true,
      //fitColumns:true,
      columns:[[
        {field:'Categoria',title:'Categoria',width:100,align:'left'},
        {field:'Grupo',title:'Grupo',width:60,align:'left'},
        {field:'Jugador',title:'Jugador',width:100,align:'left'},
        {field:'PJ',title:'P.Jugados',width:80,align:'left'},
        {field:'PG',title:'P.Ganados',width:80,align:'left'},              
        {field:'DS',title:'Dif.Sets',width:80,align:'left'},
        {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
        {field:'POS',title:'Posición',width:80,align:'left'}
      ]]
      });    

    af1.sort((a, b) => a.Rnk - b.Rnk);

    $('#dg1').datagrid({
      data:af1,
      loadMsg:'Leyendo Ranking',
      title:'Grupo 1',
      iconCls:'icon-ok',
      //rownumbers: true,
      //fitColumns:true,
      columns:[[
          {field:'Categoria',title:'Categoria',width:100,align:'left'},
          {field:'Grupo',title:'Grupo',width:60,align:'left'},
          {field:'Jugador',title:'Jugador',width:100,align:'left'},
          {field:'PJ',title:'P.Jugados',width:80,align:'left'},
          {field:'PG',title:'P.Ganados',width:80,align:'left'},              
          {field:'DS',title:'Dif.Sets',width:80,align:'left'},
          {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
          {field:'Rnk',title:'Posición',width:80,align:'left'}
      ]]
      });
      //console.log(af1);
      af2.sort((a, b) => a.Rnk - b.Rnk);

      $('#dg2').datagrid({
        data:af2,
        loadMsg:'Leyendo Ranking',
        title:'Grupo 2',
        iconCls:'icon-ok',
        //rownumbers: true,
        //fitColumns:true,
        columns:[[
          {field:'Categoria',title:'Categoria',width:100,align:'left'},
          {field:'Grupo',title:'Grupo',width:60,align:'left'},
          {field:'Jugador',title:'Jugador',width:100,align:'left'},
          {field:'PJ',title:'P.Jugados',width:80,align:'left'},
          {field:'PG',title:'P.Ganados',width:80,align:'left'},              
          {field:'DS',title:'Dif.Sets',width:80,align:'left'},
          {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
          {field:'Rnk',title:'Posición',width:80,align:'left'}
        ]]
        });

        af3.sort((a, b) => a.Rnk - b.Rnk);

        $('#dg3').datagrid({
          data:af3,
          loadMsg:'Leyendo Ranking',
          emptyMsg:'Grupo sin jugadores',
          title:'Grupo 3',
          iconCls:'icon-ok',
          //rownumbers: true,
          //fitColumns:true,
          columns:[[
            {field:'Categoria',title:'Categoria',width:100,align:'left'},
            {field:'Grupo',title:'Grupo',width:60,align:'left'},
            {field:'Jugador',title:'Jugador',width:100,align:'left'},
            {field:'PJ',title:'P.Jugados',width:80,align:'left'},
            {field:'PG',title:'P.Ganados',width:80,align:'left'},              
            {field:'DS',title:'Dif.Sets',width:80,align:'left'},
            {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
            {field:'Rnk',title:'Posición',width:80,align:'left'}
          ]]
          });

          console.log(af3.length);
          if (af3.length == 0) {
            console.log('af3 cero');
            $('#dg3').css('display', 'none');
            //$('#dg3').datagrid();
            //return;
          }          
          
          af4.sort((a, b) => a.Rnk - b.Rnk);

          $('#dg4').datagrid({
            data:af4,
            loadMsg:'Leyendo Ranking',
            title:'Grupo 4',
            iconCls:'icon-ok',
            //rownumbers: true,
            //fitColumns:true,
            columns:[[
              {field:'Categoria',title:'Categoria',width:100,align:'left'},
              {field:'Grupo',title:'Grupo',width:60,align:'left'},
              {field:'Jugador',title:'Jugador',width:100,align:'left'},
              {field:'PJ',title:'P.Jugados',width:80,align:'left'},
              {field:'PG',title:'P.Ganados',width:80,align:'left'},              
              {field:'DS',title:'Dif.Sets',width:80,align:'left'},
              {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
              {field:'Rnk',title:'Posición',width:80,align:'left'}
            ]]
            });
            
            af5.sort((a, b) => a.Rnk - b.Rnk);

            $('#dg5').datagrid({
              data:af5,
              loadMsg:'Leyendo Ranking',
              title:'Grupo 5',
              iconCls:'icon-ok',
              //rownumbers: true,
              //fitColumns:true,
              columns:[[
                {field:'Categoria',title:'Categoria',width:100,align:'left'},
                {field:'Grupo',title:'Grupo',width:60,align:'left'},
                {field:'Jugador',title:'Jugador',width:100,align:'left'},
                {field:'PJ',title:'P.Jugados',width:80,align:'left'},
                {field:'PG',title:'P.Ganados',width:80,align:'left'},              
                {field:'DS',title:'Dif.Sets',width:80,align:'left'},
                {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
                {field:'Rnk',title:'Posición',width:80,align:'left'}
              ]]
              });
              
              af6.sort((a, b) => a.Rnk - b.Rnk);

              $('#dg6').datagrid({
                data:af6,
                loadMsg:'Leyendo Ranking',
                title:'Grupo 6',
                iconCls:'icon-ok',
                //rownumbers: true,
                //fitColumns:true,
                columns:[[
                  {field:'Categoria',title:'Categoria',width:100,align:'left'},
                  {field:'Grupo',title:'Grupo',width:60,align:'left'},
                  {field:'Jugador',title:'Jugador',width:100,align:'left'},
                  {field:'PJ',title:'P.Jugados',width:80,align:'left'},
                  {field:'PG',title:'P.Ganados',width:80,align:'left'},              
                  {field:'DS',title:'Dif.Sets',width:80,align:'left'},
                  {field:'DJ',title:'Dif.Juegos',width:80,align:'left'},
                  {field:'Rnk',title:'Posición',width:80,align:'left'}
                ]]
                });
  }