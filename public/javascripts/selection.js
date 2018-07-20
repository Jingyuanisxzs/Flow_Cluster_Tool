$( document ).ready(function() {
    var scenario;
    var year;
    var version;

    var validFlowList = [];


    $("#omxTable tr").remove();
    $("#omxTable").append('<tr><th onclick="sortTable(0,omxTable)">OMX File</th></tr>');

    d3.csv('./data/flow_list.csv',function(data){
       for(var i = 0;i<data.length;i++){


           if(data[i]['title'].length>5){
               $("#omxTable").append('<tr class="clickableRow3"><td>'+data[i]['title']+'</td></tr>');
               validFlowList.push( data[i]['title']);
               var splitedData = data[i]['title'].split('_');

               var option = document.createElement("option");
               option.text = splitedData[2];
               option.value =splitedData[2];

               var select = document.getElementById("scenario");
               select.appendChild(option);
               var optionYear = document.createElement("option");

               optionYear.text = splitedData[3];
               optionYear.value =splitedData[3];
               var selectYear = document.getElementById("year");
               selectYear.appendChild(optionYear);


               var optionVersion = document.createElement("option");

               optionVersion.text = splitedData[4];
               optionVersion.value =splitedData[4];
               var selectVersion = document.getElementById("version");
               selectVersion.appendChild(optionVersion);

           }
       }

       $(".clickableRow3").on("click",function(){
           var rowItem = $(this).children('td').map(function () {
               return this.innerHTML;
           }).toArray();

           var splitRowItem = rowItem[0].split('_');
           scenario = splitRowItem[2];
           $('#queryScenario').val(scenario);

           year = splitRowItem[3];
           $('#queryYear').val(year);

           version = splitRowItem[4];
           $('#queryVersion').val(version);

       })

    });


    $('#scenario').on('click',function(){
        scenario=document.getElementById('scenario').value;
        $('#queryScenario').val(scenario);
    });
    $('#year').on('click',function(){
        year = document.getElementById('year').value;
        $('#queryYear').val(year);

    });
    $('#version').on('click',function(){
        version = document.getElementById('version').value;
        $('#queryVersion').val(version)
    });
    $('#submitButton').on('click',function(){
        if(validFlowList.includes('flow_data_'+scenario+'_'+year+'_'+version)===false){
            alert('Not Exists');
            return false;

        }        //scenario=document.getElementById('scenario').value;
    })

});