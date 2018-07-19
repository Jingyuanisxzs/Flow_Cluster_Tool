$( document ).ready(function() {

    var validFlowList = [];
    d3.csv('./data/flow_list.csv',function(data){
       for(var i = 0;i<data.length;i++){

           if(data[i]['title'].length>5){
               validFlowList.push( data[i]['title'])
               var splitedData = data[i]['title'].split('_')

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

    });

    var scenario;
    var year;
    var version;

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
            alert('Not Exist')
            return false

        }        //scenario=document.getElementById('scenario').value;
    })

});