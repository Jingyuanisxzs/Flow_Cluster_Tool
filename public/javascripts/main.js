/*jshint esversion: 6 */
var map;
var directionalSymbols = [];
var currentIteration = 1;
var result;
var default_threads = 8;
var clusterNumber=200;
var defaultClusterNumber = 200;
var newCentroid;
var transitArray=[];
var clusters = [];
var transitArrayWithClusters = [];
var myVar;
var myCounter;
var selectedMatrix;
var ratio;
var viewSpatialReference; 
var geoSpatialReference;
require([  "esri/geometry/projection","esri/map", "esri/Color", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Polyline", "esri/geometry/Polygon", "./externalJS/DirectionalLineSymbol.js",
        "esri/symbols/SimpleMarkerSymbol",  "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/toolbars/draw", "esri/SpatialReference","esri/config", "esri/request",
        "dojo/ready", "dojo/dom", "dojo/on","esri/dijit/BasemapToggle","esri/dijit/Scalebar","esri/geometry/Point","esri/InfoTemplate"],
    function (projection,Map, Color, GraphicsLayer, Graphic, Polyline, Polygon, DirectionalLineSymbol,
              SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Draw,SpatialReference, config, request,
              ready, dom, on,BasemapToggle,Scalebar,Point,InfoTemplate) {
        ready(function () {
             //for the sample print server
             if (!projection.isSupported()) {
               alert("client-side projection is not supported");
               return;
             }
            const projectionPromise = projection.load();
             viewSpatialReference = new SpatialReference({
              wkid: 4326
            });
             geoSpatialReference = new SpatialReference({
              wkid: 3401
            });


             $("#clusters").val(clusterNumber);
             $("#currentIteration").prop('disabled', true);
             //zonesfile must be 4326 encoded for current application
            var zonesJsonURL = "data/3401ZonesCoordinates.geojson";
            //can be labour flow, transit flow, whatever flow
            var transitURL = null;
            var flowTitleURL = "data/pecas_matrices_title.csv";
            $("#flowTable tr").remove();
            $("#flowTable").append('<tr><th onclick="sortTable(0)">Flow Matrices</th></tr>');
            var q = d3.queue();
            q.defer(d3.csv,flowTitleURL).await(fillFlowTable);
            function fillFlowTable(error,flowTitles){
              var keys = Object.keys(flowTitles);
                keys.forEach(function(key){
                    var subkeys = Object.keys(flowTitles[key]);
                    subkeys.forEach(function(subkey){
                      $("#flowTable").append('<tr class="clickableRow2"><td>'+flowTitles[key][subkey]+'</td></tr>');
                    });
                    
                });
                
                
                
                $(".clickableRow2").on("click", function() {
                  $("#flowTable tr").removeClass("selected");

                  var rowItem = $(this).children('td').map(function () {
                      return this.innerHTML;
                  }).toArray();
                  $(this).addClass("selected");
                  
                  selectedMatrix=rowItem[0];
                  transitURL = './flow_data/'+selectedMatrix+'.csv';
                  console.log(transitURL);
                  $("#clusters").val(defaultClusterNumber);
                  clusterNumber = defaultClusterNumber;
                  $('#currentIteration').val(0);
                  processData(zonesJsonURL,transitURL,clusterNumber,1);
              });
            }
          
            
            //process first iteration
            //processData(zonesJsonURL,transitURL,clusterNumber,1);
            //range slider
            $("#myRange").change(function(){
              $("#clusters").val(this.value);
            });
            $("#threadRange").change(function(){
              $("#threadNumber").val(this.value);
            });
            map = new Map("map", {
                center: [-113.4947, 53.5437],
                zoom: 10,
                basemap: "gray",
                minZoom: 3
            });
            var toggle = new BasemapToggle({
               map: map,
               basemap: "streets"
             }, "viewDiv");
            toggle.startup();
            var scalebar = new Scalebar({
               map: map,
               scalebarUnit: "dual"
            });
            on(map, "update-start", showLoading);
            on(map, "update-end", hideLoading);
            function showLoading() {
              map.disableMapNavigation();
              map.hideZoomSlider();
            }
            function hideLoading(error) {
              map.enableMapNavigation();
              map.showZoomSlider();
            }
            
            var graphicsLayer = new GraphicsLayer({ id: "graphicsLayer" });
            var startEndLayer = new GraphicsLayer({ id: "startEndLayer" });
            myCounter = new Variable(0,function(){
              if($('#currentIteration').val()<200){
                result = splitIntoGroupsGPU(newCentroid,transitArray);
              }
              else{
                $("#nextIteration").prop('disabled', false);
                $("#RerunButton").prop('disabled', false);
                $("#autoRun").prop('disabled', false);
                $("#WantJson").prop('disabled', false);
                map.enableMapNavigation();
                map.showZoomSlider();
                $("#autoRun").click();
              }
            });
            myVar = new Variable(10, function(){
                  map.removeLayer(graphicsLayer);
                  map.removeLayer(startEndLayer);
                  graphicsLayer = new GraphicsLayer({ id: "graphicsLayer" });
                  newCentroid = findNewCentroid(transitArrayWithClusters);
                  map.addLayer(graphicsLayer);
                  

                  dojo.connect(graphicsLayer,'onClick',function(evt){
                    var clickedGroup = evt.graphic.attributes.indexOfGroup;
                    if(typeof(clickedGroup)!=="undefined"){
                      map.removeLayer(startEndLayer);
                      startEndLayer = new GraphicsLayer({ id: "startEndLayer" });    
                      if($("#dots").is(':checked') === true){
                        for (var h =0;h<transitArrayWithClusters[clickedGroup].length;h++){
                          var orginDest = startEndDots(transitArrayWithClusters[clickedGroup][h]);
                          startEndLayer.add(orginDest[0]);
                          startEndLayer.add(orginDest[1]);
                        }  
                      }
                      else if($("#lines").is(':checked') === true){
                        for (var h2 =0;h2<transitArrayWithClusters[clickedGroup].length;h2++){
                          var line = transitArrayWithClusters[clickedGroup][h2];
                          var ag = startEndLines(line);
                          if(ag !== null){
                            startEndLayer.add(ag);
                          }
                        }
  
                       }
                       else{
                         alert("Some error happens, please try to refresh the page!");
                       }
                      map.addLayer(startEndLayer);
                      
                      $("#dataTable tr").remove();
                      $("#dataTable").append('<tr><th onclick="sortTable(0)">Origin Zone    </th><th onclick="sortTable(1)">Destination Zone   </th><th onclick="sortTable(2)">Value</th></tr>');
                      
                      
                      for (var u =0;u<transitArrayWithClusters[clickedGroup].length;u++){
                        if(transitArrayWithClusters[clickedGroup][u][4]/ratio>=0.05){
                          $("#dataTable").append('<tr class="clickableRow"><td>'+transitArrayWithClusters[clickedGroup][u][5]+'</td><td>'+transitArrayWithClusters[clickedGroup][u][6]+'</td><td>'+transitArrayWithClusters[clickedGroup][u][4]+'</td></tr>');
                        }
                      }
                      if($("#lines").is(':checked') === true){
                        $(".clickableRow").on("click", function() {
                          $("#dataTable tr").removeClass("selected");
                          var rowItems = $(this).children('td').map(function () {
                              return this.innerHTML;
                          }).toArray();
                          $(this).addClass('selected');
                          for(var p=0,m =startEndLayer.graphics.length;p<m;p++){
                                if(startEndLayer.graphics[p].attributes.inZone === rowItems[0] &&startEndLayer.graphics[p].attributes.outZone ===rowItems[1] ){
                                    startEndLayer.graphics[p].symbol.setColor(new Color([22, 254, 18  ]));
                                }
                                else{
                                  startEndLayer.graphics[p].symbol.setColor(new Color([0,0,204]));
                                }
                          }
                          startEndLayer.refresh();

                        });
                      }
                  }
                });
    
                  //example using a picture marker symbol.
                  currentIteration = Number($('#currentIteration').val())+1;
                  $('#currentIteration').val(currentIteration);
                  //add a polyline with 3 paths
                  redrawClusters(newCentroid,graphicsLayer);

                  if($("#autoRun").is(':checked') === true){
                    myCounter.SetValue(1);
                  }
                  else{
                    $("#nextIteration").prop('disabled', false);
                    $("#RerunButton").prop('disabled', false);
                    $("#autoRun").prop('disabled', false);
                    $("#WantJson").prop('disabled', false);
                    map.enableMapNavigation();
                    map.showZoomSlider();    
                  }
            });
            $("#nextIteration").click(function(){
              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              map.disableMapNavigation();
              map.hideZoomSlider();
              result = splitIntoGroupsGPU(newCentroid,transitArray);
              newCentroid = findNewCentroid(result);
            });
            $("#autoRun").click(function(e, parameters) {
                
                if($("#autoRun").is(':checked')){
                  $("#nextIteration").prop('disabled', true);
                  $("#RerunButton").prop('disabled', true);
                  $("#WantJson").prop('disabled', true);

                  map.disableMapNavigation();
                  map.hideZoomSlider();
                  result = splitIntoGroupsGPU(newCentroid,transitArray);
                }
            });

            $("#WantJson").click(function(){
              var outputGeoJsonFile = outputGeojson(newCentroid);
              var data = JSON.stringify(outputGeoJsonFile,undefined,4);
              var blob = new Blob([data], {type: 'text/json'}),
                  a    = document.createElement('a');
              a.download = "geojson1.geojson";
              a.href = window.URL.createObjectURL(blob);
              a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
              a.innerHTML = 'Download JSON';
              a.click();
            });
            $("#RerunButton").click(function(){
             //console.log($("#clusters").val())
                $("#currentIteration").val("0");
                $("#nextIteration").prop('disabled', true);
                $("#RerunButton").prop('disabled', true);
                $("#autoRun").prop('disabled', true);
                $("#WantJson").prop('disabled', true);
                map.disableMapNavigation();
                map.hideZoomSlider();
               if(Number($("#clusters").val())>0){
                 clusterNumber =Number($("#clusters").val());
                 var initClusters = new Array(clusterNumber);
                 for(var i=0;i<clusterNumber;i++){
                     initClusters[i] = transitArray[Math.floor(Math.random() * (transitArray.length + 1))];
                 }
                 result = splitIntoGroupsGPU(initClusters,transitArray);
               }
             else{
               alert("Please enter a number!");
             }
            });

            function combineZonesAndTransit(zonesMatrix,transitMatrix){
              var combinedTransitMatrix = [];
              for(var i = 0,l = transitMatrix.length;i<l;i++){
                  if(Number(transitMatrix[i].matrix0)!=Number(0)){
                    combinedTransitMatrix.push([zonesMatrix[transitMatrix[i].i][0],zonesMatrix[transitMatrix[i].i][1],zonesMatrix[transitMatrix[i].j][0],zonesMatrix[transitMatrix[i].j][1],Number(transitMatrix[i].matrix0),transitMatrix[i].i,transitMatrix[i].j]);
                  }
              }
              return combinedTransitMatrix;
            }

            function processData(zonesURL,transitURL,clusterNumber,iteration) {
              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              var q = d3.queue();
              var zoneDict = {};
              q.defer(d3.json,zonesURL)
                        .defer(d3.csv,transitURL)
                        .await(kmeansCalculate);
                        
                        

              function kmeansCalculate(error,zones,transit){
                if(error){console.log(error);}
                for(var i=0,l = zones.features.length; i<l;i++){
                  zoneDict[zones.features[i].properties.ZoneNumber] = zones.features[i].geometry.coordinates;
                }
                transitArray = combineZonesAndTransit(zoneDict,transit);
                //initialize clusters
                var totalTransitLength = transitArray.length;
                var initClusters = new Array(clusterNumber);
                for(var i2=0;i2<clusterNumber;i2++){
                    initClusters[i2] = transitArray[Math.floor(Math.random() * (totalTransitLength + 1))];
                }
                result = splitIntoGroupsGPU(initClusters,transitArray);
              }
            }
        });

        function initializTransitArrayWithClusters(){
            transitArrayWithClusters=[];
            for(var m=0,l=clusters.length;m<l;m++){
              transitArrayWithClusters[JSON.stringify(m)] = [];
            }
        }
        function splitIntoGroupsGPU(clusters,wholeTransitArray){
          transitArrayWithClusters=[];
          for(var m=0,l=clusters.length;m<l;m++){
            transitArrayWithClusters[JSON.stringify(m)] = [];
          }
          var num_threads = Number($("#threadNumber").val());
          var c = 0;
          var MT = new Multithread(num_threads);
          var funcInADifferentThread = MT.process(
            function(clusters,transitArray,index){

              var result = new Array(transitArray.length);
              for(var i=0,l1=transitArray.length;i<l1;i++){
                var group = 0;
                var minDist =  Number.POSITIVE_INFINITY;
                for(var j = 0,l2=clusters.length;j<l2;j++){
              
                  var currentDist=Math.sqrt(
                      (transitArray[i][0]-clusters[j][0])*(transitArray[i][0]-clusters[j][0]) +
                      (transitArray[i][1]-clusters[j][1])*(transitArray[i][1]-clusters[j][1])  +
                      (transitArray[i][2]-clusters[j][2])*(transitArray[i][2]-clusters[j][2]) +
                      (transitArray[i][3]-clusters[j][3])*(transitArray[i][3]-clusters[j][3]) );
                  if(minDist>currentDist){
                    group = j;
                    minDist = currentDist;
                  }
                }
                result[i] =group;
              }
              return [index,result];
            },
            function(r) {
              c+=1;
              for(var t4=0;t4<GroupArray[r[0]].length;t4++){
                transitArrayWithClusters[JSON.stringify(r[1][t4])].push(GroupArray[r[0]][t4]);
              }
            
              if(c=== num_threads){
                myVar.SetValue(1);
              }
            }
          );

          var averageLength = wholeTransitArray.length/num_threads;
          var GroupArray = new Array(num_threads);
          for(var i = 0; i<num_threads; i++){
            GroupArray[i] = wholeTransitArray.slice(averageLength*i,averageLength*(i+1));
          }
          for(var j=0; j<num_threads;j++){
             funcInADifferentThread(clusters,GroupArray[j],j);
          }
        
        
        }
        function Variable(initVal, onChange)
        {
            this.val = initVal;          //Value to be stored in this object
            this.onChange = onChange;    //OnChange handler
            //This method returns stored value
            this.GetValue = function(){
                return this.val;};
            //This method changes the value and calls the given handler
            this.SetValue = function(value){
                this.val = value;
                this.onChange();};
        }
        function findNewCentroid(transitArrayWithClusters){
          newCentroid = [];
          for(var key in transitArrayWithClusters){
            var weight = 0,dest_x = 0,dest_y = 0,orig_x = 0,orig_y = 0;
            var groupMember = transitArrayWithClusters[key];
            for(var n =0,l = groupMember.length; n<l;n++){
              if(typeof(groupMember[n]) !== "undefined"){
                  var oldWeight = groupMember[n][4];
                  var newWeight = weight+oldWeight;
                  orig_x = (orig_x*weight+groupMember[n][0]*oldWeight)/newWeight;
                  orig_y=  (orig_y*weight+groupMember[n][1]*oldWeight)/newWeight;
                  dest_x = (dest_x*weight+groupMember[n][2]*oldWeight)/newWeight;
                  dest_y = (dest_y*weight+groupMember[n][3]*oldWeight)/newWeight;
                  weight = newWeight;
              }
            }
            newCentroid.push([orig_x,orig_y,dest_x,dest_y,weight,key]);
          }
          return newCentroid;
        }

        function outputGeojson(centroids){
          var geojson =
             {"name":"NewFeatureType",
              "type":"FeatureCollection",
              "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3401" } },
              "features":[]};
            // format=  {"name":"NewFeatureType",
            //    "type":"FeatureCollection",
            //    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4326" } },
            //    "features":[{"type":"Feature",
            //                 "geometry":{"type":"LineString",
            //                             "coordinates":[[null,null],[null,null]]},
            //                 "properties":null}]};
          for(var i = 0,k=centroids.length;i<k;i++){
            var singleRecord = {};
            singleRecord.type = "Feature";
            singleRecord.geometry={};
            singleRecord.properties= {};
            singleRecord.geometry.type = "LineString";
            singleRecord.geometry.coordinates =[[centroids[i][0],centroids[i][1]],[centroids[i][2],centroids[i][3]]];
            singleRecord.properties.weight = centroids[i][4];
            geojson.features.push(singleRecord);
          }
          return geojson;
        }
        // 
        // function cartesianDistance(firstCoords,secondCoords){
        //     //firstCoords = [[-113,53],[-112,54]]
        //     return Math.sqrt(
        //         (firstCoords[1][0]-secondCoords[1][0])*(firstCoords[1][0]-secondCoords[1][0]) +
        //         (firstCoords[1][1]-secondCoords[1][1])*(firstCoords[1][1]-secondCoords[1][1]) +
        //         (firstCoords[0][0]-secondCoords[0][0])*(firstCoords[0][0]-secondCoords[0][0]) +
        //         (firstCoords[0][1]-secondCoords[0][1])*(firstCoords[0][1]-secondCoords[0][1]));
        // }
        
        function redrawClusters(newCentroid,graphicsLayer){
          var maxWidth = 0;
          for(var p=0,l=newCentroid.length;p<l;p++){
            if (newCentroid[p][4]>maxWidth){
                maxWidth = newCentroid[p][4];
            }
          }
          ratio = maxWidth/15;
        
          for(var j = 0,k= newCentroid.length;j<k;j++){
            var centroidWidth;
            centroidWidth = newCentroid[j][4]/ratio;
            const pointOrigin = new Point([newCentroid[j][0], newCentroid[j][1]], geoSpatialReference);
            const pointDest = new Point([newCentroid[j][2], newCentroid[j][3]], geoSpatialReference)
            const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
            const projectedPointDest = projection.project(pointDest, viewSpatialReference);

            if(centroidWidth>0.05){
              var advSymbol = new DirectionalLineSymbol({
                  style: SimpleLineSymbol.STYLE_SOLID,
                  color: new Color([255,102, 102]),
                  width: centroidWidth,
                  directionSymbol: "arrow2",
                  directionPixelBuffer: 12,
                  directionColor: new Color([204, 51, 0]),
                  directionSize: centroidWidth*5
              });

              var polylineJson = {
                "paths":[[ [projectedPointOrigin.x, projectedPointOrigin.y], [ projectedPointDest.x, projectedPointDest.y] ] ]
              };
              var infoTemplate = new InfoTemplate("Value: ${value}");
              var advPolyline = new Polyline(polylineJson,viewSpatialReference);
              //console.log(advPolyline)

              var ag = new Graphic(advPolyline, advSymbol, {indexOfGroup:newCentroid[j][5],value:newCentroid[j][4]}, infoTemplate);
              graphicsLayer.add(ag);
            }
          }
        }
        function startEndDots(line){
            var adjustedSize=line[4]*25/ratio;
            //the data has huge gap, will eliminate very small ones.

            if(adjustedSize<0.5&&adjustedSize>0.05){
              adjustedSize = 0.5;
            }
            var symbolOrigin = new SimpleMarkerSymbol({
              "color":[0,0,128,128],
              "size":adjustedSize,
              "angle":0,
              "xoffset":0,
              "yoffset":0,
              "type":"esriSMS",
              "style":"esriSMSCircle",
              "outline":{
                "color":[0,0,128,255],
                "width":1,
                "type":"esriSLS",
                "style":"esriSLSSolid"
              }
            });
            var symbolDest = new SimpleMarkerSymbol({
              "color":[255,255,0,128],
              "size":adjustedSize,
              "angle":0,
              "xoffset":0,
              "yoffset":0,
              "type":"esriSMS",
              "style":"esriSMSCircle",
              "outline":{
                "color":[255,255,0,255],
                "width":1,
                "type":"esriSLS",
                "style":"esriSLSSolid"
              }
            });
            var originPoint = new Point(line[0],line[1],geoSpatialReference);
            var destPoint = new Point(line[2],line[3],geoSpatialReference);
            var projectedPointOrigin = projection.project(originPoint, viewSpatialReference);
            var projectedPointDest = projection.project(destPoint, viewSpatialReference);
            var originG = new Graphic(projectedPointOrigin, symbolOrigin, {}, null);
            var destG = new Graphic(projectedPointDest, symbolDest, {}, null);
            return [originG,destG];
        }
        function startEndLines(line){
          var centroidWidth;
          centroidWidth = line[4]/ratio;
          const pointOrigin = new Point([line[0],line[1]], geoSpatialReference);
          const pointDest = new Point([line[2], line[3]], geoSpatialReference);
          const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
          const projectedPointDest = projection.project(pointDest, viewSpatialReference);
          if(centroidWidth>0.05){
            var advSymbol = new DirectionalLineSymbol({
                style: SimpleLineSymbol.STYLE_SOLID,
                color: new Color([0,0,204]),
                width: centroidWidth,
                directionSymbol: "arrow1",
                directionPixelBuffer: 12,
                directionColor: new Color([0,0,204]),
                directionSize: centroidWidth*5
            });
            var polylineJson = {
              "paths":[[ [projectedPointOrigin.x, projectedPointOrigin.y], [ projectedPointDest.x, projectedPointDest.y] ] ]
            };
            var infoTemplate = new InfoTemplate("Value: ${value}","Origin Zone: ${inZone}<br/>Destination Zone:${outZone}");
            var advPolyline = new Polyline(polylineJson,viewSpatialReference);
            var ag = new Graphic(advPolyline, advSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);
            return ag;
        }
        return null;
      }

    });
    
