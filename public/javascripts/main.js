/*jshint esversion: 6 */
var map;
var currentIteration = 1;
var result;
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
var geoJsonLayer1 ;
var graphicsLayer;
var startEndLayer;
var totalWeight;
var sumOfTransitArray;
require([  "esri/geometry/projection","esri/map", "esri/Color", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Polyline", "esri/geometry/Polygon", "./externalJS/DirectionalLineSymbol.js","./externalJS/geojsonlayer.js",
        "esri/symbols/SimpleMarkerSymbol",  "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/toolbars/draw", "esri/SpatialReference","esri/config", "esri/request",
        "dojo/ready", "dojo/dom", "dojo/on","esri/dijit/BasemapToggle","esri/dijit/Scalebar","esri/geometry/Point","esri/InfoTemplate",   "esri/layers/FeatureLayer"],
    function (projection,Map, Color, GraphicsLayer, Graphic, Polyline, Polygon, DirectionalLineSymbol,GeoJsonLayer,
              SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Draw,SpatialReference, config, request,
              ready, dom, on,BasemapToggle,Scalebar,Point,InfoTemplate,FeatureLayer) {
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
            //can be labour flow, transit flow, whatever flow
            var transitURL = null;
            var flowTitleURL = "data/pecas_matrices_title.csv";
            var indexLatLongURL = "data/indexLatLongDict.csv";
            $("#flowTable tr").remove();
            $("#flowTable").append('<tr><th onclick="sortTable(0)">Flow Matrices</th></tr>');

            d3.csv(flowTitleURL, function(flowTitles) {
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
                  $("#clusters").val(defaultClusterNumber);
                  clusterNumber = defaultClusterNumber;
                  $('#currentIteration').val(0);
                  processData(indexLatLongURL,transitURL,clusterNumber,1);
              });
            });
            
          
            
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
            map.on("load", function () {
                addGeoJsonLayer("./data/SinglePolygenZoneBoundaries4326.geojson");
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
            
            graphicsLayer = new GraphicsLayer({ id: "graphicsLayer" });
            startEndLayer = new GraphicsLayer({ id: "startEndLayer" });
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
                  //newCentroid = findNewCentroid(transitArrayWithClusters);
                
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
                          if(orginDest[1]!==null){
                              startEndLayer.add(orginDest[1]);

                          }
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
                                    if(rowItems[0]===rowItems[1]){

                                        startEndLayer.graphics[p].symbol.outline.setColor(new Color([22, 254, 18  ]));

                                    }
                                }
                                else{
                                    if(typeof(startEndLayer.graphics[p].attributes.inZone)==="undefined"){
                                        continue;
                                    }
                                  startEndLayer.graphics[p].symbol.setColor(new Color([0,0,204]));

                                  if(startEndLayer.graphics[p].attributes.inZone === startEndLayer.graphics[p].attributes.outZone){
                                      startEndLayer.graphics[p].symbol.outline.setColor(new Color([0,0,204]));
                                  }
                                }
                          }
                          startEndLayer.refresh();

                        });
                      }
                  }
                });
    
                  //example using a picture marker symbol.
                if(myVar.GetValue() === 1){
                    currentIteration = Number($('#currentIteration').val())+1;
                    $('#currentIteration').val(currentIteration);
                }

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
                   for(var i2 = 0;i2<clusterNumber;i2++){
                       var randomWeight = Math.floor(Math.random()*(totalWeight));
                       for (var i3=0,l = transitArray.length;i3<l;i3++){
                           if(sumOfTransitArray[i3]>=randomWeight && initClusters.indexOf(transitArray[i3])< 0) {
                               initClusters[i2] = transitArray[i3];
                               break;
                           }
                       }

                   }
                   // var initClusters = new Array(clusterNumber);
                   // for(var i2 = 0;i2<clusterNumber;i2++){
                   //
                   //     var randomWeight = Math.floor(Math.random()*(totalWeight));
                   //     for(var i3 = 0,l = transitArray.length;i3<l;i3++){
                   //         randomWeight = randomWeight-transitArray[i3][4];
                   //         if(randomWeight<=0 && initClusters.indexOf(transitArray[i3]) < 0){
                   //             initClusters[i2] = transitArray[i3];
                   //             break;
                   //         }
                   //     }
                   // }


                 result = splitIntoGroupsGPU(initClusters,transitArray);
               }
             else{
               alert("Please enter a number!");
             }
            });

            function processData(indexLatLongURL,transitURL,clusterNumber,iteration) {
              $("#nextIteration").prop('disabled', true);
              $("#RerunButton").prop('disabled', true);
              $("#autoRun").prop('disabled', true);
              $("#WantJson").prop('disabled', true);
              var q = d3.queue();
              var zoneDict = {};

              q.defer(d3.csv,indexLatLongURL)
                        .defer(d3.csv,transitURL)
                        .await(kmeansCalculate);

              function kmeansCalculate(error,zones,transit){
            
                if(error){console.log(error);}
                totalWeight=0;
                for(var i = 0, l = transit.length; i<l;i++){
                    for(var j=0; j<l;j++){
                        transitArray.push([Number(JSON.parse(zones[0][i])[1]),Number(JSON.parse(zones[0][i])[2]),Number(JSON.parse(zones[0][j])[1]),Number(JSON.parse(zones[0][j])[2]),Number(transit[i][j]),JSON.parse(zones[0][i])[0].toString(),JSON.parse(zones[0][j])[0].toString()]);
                        totalWeight += Number(transit[i][j]);
                    }
                }
                //initialization
                var totalTransitLength = transitArray.length;

                // var initClusters = new Array(clusterNumber);
                // for(var i2 = 0;i2<clusterNumber;i2++){
                //
                //     var randomWeight = Math.floor(Math.random()*(totalWeight));
                //     for(var i3 = 0; i3<totalTransitLength;i3++){
                //         randomWeight = randomWeight-transitArray[i3][4];
                //         if(randomWeight<=0 && initClusters.indexOf(transitArray[i3]) < 0){
                //             initClusters[i2] = transitArray[i3];
                //             break;
                //         }
                //     }
                // }
                var currentSum = 0;
                sumOfTransitArray = new Array(transitArray.length);
                for(var r = 0;r<totalTransitLength;r++){
                  currentSum+=transitArray[r][4];
                  sumOfTransitArray[r] = currentSum;
                }
                var initClusters = new Array(clusterNumber);
                for(var i2 = 0;i2<clusterNumber;i2++){
                    var randomWeight = Math.floor(Math.random()*(totalWeight));
                    for (var i3=0;i3<totalTransitLength;i3++){
                        if(sumOfTransitArray[i3]>=randomWeight && initClusters.indexOf(transitArray[i3])< 0) {
                            initClusters[i2] = transitArray[i3];
                            break;
                        }
                    }

                }



                result = splitIntoGroupsGPU(initClusters,transitArray);
              }
            }
        });

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

              // TODO move these to parameters or to UI objects, or at least to the top of the file
              var angleWeighting = 5000;
              var distanceWeighting = 1;    
              var distanceExponent = 0.5;          
              var result = new Array(transitArray.length);
              for(var i=0,l1=transitArray.length;i<l1;i++){
                var group = 0;
                var minDist =  Number.POSITIVE_INFINITY;
                for(var j = 0,l2=clusters.length;j<l2;j++){

                  // coordinate distance
                  var currentDist=Math.sqrt(
                      (transitArray[i][0]-clusters[j][0])*(transitArray[i][0]-clusters[j][0]) +
                      (transitArray[i][1]-clusters[j][1])*(transitArray[i][1]-clusters[j][1]) +
                      (transitArray[i][2]-clusters[j][2])*(transitArray[i][2]-clusters[j][2]) +
                      (transitArray[i][3]-clusters[j][3])*(transitArray[i][3]-clusters[j][3]) );

                  var len1 = Math.sqrt(
                  (transitArray[i][0] - transitArray[i][2])*(transitArray[i][0] - transitArray[i][2]) +
                      (transitArray[i][1] - transitArray[i][3])*(transitArray[i][1] - transitArray[i][3]));
                  var len2 = Math.sqrt(
                        (clusters[j][0] - clusters[j][2])*(clusters[j][0] - clusters[j][2]) +
                      (clusters[j][1] - clusters[j][3])*(clusters[j][1] - clusters[j][3]));
                  currentDist = currentDist + distanceWeighting * (Math.abs(len1-len2))^distanceExponent;
                  var angle1 = Math.atan2(transitArray[i][0] - transitArray[i][2],transitArray[i][1] - transitArray[i][3]);
                  var angle2 = Math.atan2(clusters[j][0] - clusters[j][2],clusters[j][1] - clusters[j][3]);
                  var angleDiff = Math.abs(angle1 - angle2);
                  if (angleDiff > Math.PI) {
                    angleDiff -= Math.PI;
                  }
                  currentDist += angleWeighting * Math.abs(angleDiff);
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
                  newCentroid = findNewCentroid(transitArrayWithClusters);

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
              if(groupMember[n][4] !==0){
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
            const pointDest = new Point([newCentroid[j][2], newCentroid[j][3]], geoSpatialReference);
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
            var squareSymbol = new SimpleMarkerSymbol({
                "color":[0,0,128,128],
                "size":adjustedSize,
                "angle":0,
                "xoffset":0,
                "yoffset":0,
                "type":"esriSMS",
                "style":"esriSMSDiamond",
                "outline":{"color":[0,0,128,255],
                    "width":1,
                    "type":"esriSLS",
                    "style":"esriSLSSolid"
                }
            });

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
            if(line[5] === line[6]){
                var originG = new Graphic(projectedPointOrigin,squareSymbol,{},null);

                return [originG,null]
            }
            else{


                var originG = new Graphic(projectedPointOrigin, symbolOrigin, {}, null);
                var destG = new Graphic(projectedPointDest, symbolDest, {}, null);
                return [originG,destG];

            }

        }
        function startEndLines(line){
            var centroidWidth;
            centroidWidth = line[4]/ratio;
            const pointOrigin = new Point([line[0],line[1]], geoSpatialReference);
            const pointDest = new Point([line[2], line[3]], geoSpatialReference);
            const projectedPointOrigin = projection.project(pointOrigin, viewSpatialReference);
            const projectedPointDest = projection.project(pointDest, viewSpatialReference);
            var infoTemplate = new InfoTemplate("Value: ${value}","Origin Zone: ${inZone}<br/>Destination Zone:${outZone}");

            if(centroidWidth>0.05){
                if(line[5]===line[6]){
                    var squareSymbol = new SimpleMarkerSymbol({
                        "color":[0,0,128,128],
                        "size":centroidWidth*25,
                        "angle":0,
                        "xoffset":0,
                        "yoffset":0,
                        "type":"esriSMS",
                        "style":"esriSMSDiamond",
                        "outline":{"color":[0,0,128,255],
                            "width":1,
                            "type":"esriSLS",
                            "style":"esriSLSSolid"
                        }
                    });
                    var originG = new Graphic(projectedPointOrigin,squareSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);


                    return originG;


                }
                else{
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
                    var advPolyline = new Polyline(polylineJson,viewSpatialReference);
                    var ag = new Graphic(advPolyline, advSymbol, {inZone: line[5],outZone:line[6],value:line[4]}, infoTemplate);
                    return ag;

                }


            }
            else{
                return null;

            }
        }

        function addGeoJsonLayer(jsonUrl){
             geoJsonLayer1 = new GeoJsonLayer({
                url:jsonUrl,
                 id:"geoJsonLayer"
            });

        }
        $('#AlbertaBaseLayer').click(function() {
            if ($("#AlbertaBaseLayer").hasClass('selected')) {
                $(this).prop('checked', false);
                $(this).removeClass('selected');
                map.removeLayer(geoJsonLayer1)
            }
            // else select
            else {
                $(this).prop('checked', true);
                $(this).addClass('selected');
                secondFunction()

            }

            function firstFunction()
            {
                var deferred = $.Deferred();

                var i = 0;
                var nextStep = function() {
                    if (i<1) {
                        // Do something
                        map.removeLayer(graphicsLayer);
                        map.addLayer(geoJsonLayer1);
                        i++;
                        setTimeout(nextStep, 500);
                    }
                    else {
                        deferred.resolve(i);
                    }
                };
                nextStep();
                return deferred.promise();
            }

            function secondFunction()
            {
                var promise = firstFunction();
                promise.then(function(result) {
                    myVar.SetValue(2);
                    //map.addLayer(graphicsLayer)
                });
            }
        });

  });
    
