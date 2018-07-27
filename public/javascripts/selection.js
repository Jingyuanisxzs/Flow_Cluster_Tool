$( document ).ready(function() {
    var socket = io('ws://localhost:3000', {transports: ['websocket']});
    var omxList = [];
    $('#newOMXForm').submit(function(){
      socket.emit('chat message',$('#scenario').val()+'_'+$('#year').val()+'_'+$('#version').val());
      return false;
    });
    socket.on('finish',function(msg){
      alert('Finish Decoding: '+msg);
    });
    socket.on('find',function(msg){
      if(msg === 'true'){
        $('#submitButton').click();
      }
      else if (msg ==='false'){
        alert('Invalid OMX file!');
      }
      else if (msg === 'not complete'){
        var answer = confirm('The OMX file is in decoding process. Do you still want to open it?');
        if(answer){
          $('#submitButton').click();
        }
      }
      else{
        alert("The OMX file hasn't been decoded. After finish decoding, you will get a notification!");
      }
    });
    var scenario;
    var year;
    var version;
    var validFlowList = [];
    $("#omxTable tr").remove();
    $("#omxTable").append('<tr><th onclick="sortTable(0,omxTable)">OMX File</th></tr>');

    socket.on('start omx list',function(msg){
      
      $("#omxTable tr").remove();
      $("#omxTable").append('<tr><th onclick="sortTable(0,omxTable)">OMX File</th></tr>');

      for(var i in msg){
        omxList.push(msg[i]);
      }
      for(var i = 0;i<omxList.length;i++){
          var splitedData = omxList[i].split('_');
          var omxFileName = omxList[i].split('.');
          if(splitedData.length>4){
              $("#omxTable").append('<tr class="clickableRow3"><td>'+omxFileName[0]+'</td></tr>');
              validFlowList.push(omxList[i]);
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
              optionVersion.text = splitedData[4].split('.')[0];
              optionVersion.value =splitedData[4].split('.')[0];
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
          $('#newQueryScenario').val(scenario);
          $('#scenario').val(scenario);
          year = splitRowItem[3];
          $('#queryYear').val(year);
          $('#newQueryYear').val(year);
          $('#year').val(year);
          version = splitRowItem[4];
          $('#queryVersion').val(version);
          $('#newQueryVersion').val(version);
          $('#version').val(version);
      });
  
      $('#scenario').on('click',function(){
          scenario=document.getElementById('scenario').value;
          $('#queryScenario').val(scenario);
          $('#newQueryScenario').val(scenario);
      });
      $('#year').on('click',function(){
          year = document.getElementById('year').value;
          $('#queryYear').val(year);
          $('#newQueryYear').val(year);
      });
      $('#version').on('click',function(){
          version = document.getElementById('version').value;
          $('#queryVersion').val(version);
          $('#newQueryVersion').val(version);
      });
    });
});
