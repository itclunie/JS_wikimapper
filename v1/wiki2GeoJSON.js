
//add time mod & created
//full desc in download
//all panned since download
//option to download csv or geojson


var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];            


function JSON2CSV(geoJSON){
    var headers = ",title,link,type,country,region,id,lon,lat,\n"
    var content = [];
    
    content.push(headers);
    
    for(var obj in geoJSON.features){
        console.log(content)
        
        var geoLon = geoJSON.features[obj].geometry.coordinates[0];
        var geoLat = geoJSON.features[obj].geometry.coordinates[1];
        var title = geoJSON.features[obj].properties.title;
        title = title.replace(",", "--");
        var link = geoJSON.features[obj].properties.link;
        var type = geoJSON.features[obj].properties.type;
        var country = geoJSON.features[obj].properties.country;
        var region = geoJSON.features[obj].properties.region;
        var id = geoJSON.features[obj].properties.id;
        
        var instr = title + ',' + link  + ',' + type  + ',' + country + ',' + region + ',' + id + ',' + geoLon + ',' + geoLat+ ',' + '\n';
        instr = instr.replace(/null/g, "");
        
        content.push(instr);
    }
    return content;
}; 

Object.size = function(obj) { //get size of object
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
//    console.log(Object.size(markers._layers)); //call like this
};

function makeGeoJ(inObj,geoJ){
    for (var k in inObj) {    //construct/fill geojson
        var lat = parseFloat(inObj[k].lat);
        var lon = parseFloat(inObj[k].lon);
        
        var newFeature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon,lat]
            },
            "properties": {
                "title": inObj[k].title,
                "dist": inObj[k].dist,
                "link": 'https://en.wikipedia.org/?curid=' + inObj[k].pageid,
                "type": inObj[k].type,
                "country": inObj[k].country,
                "region": inObj[k].region,
                "id": inObj[k].pageid
            }
        }
        geoJ['features'].push(newFeature);
    };
}

function clearOutsideBounds(markers) {
    console.log(Object.size(markers._layers));
    var bounds = WL.myBounds,
        latLng,
        key;
    for (i in markers._layers) {
        var latLng = markers._layers[i]._latlng;
        var mrkrLayer = markers._layers[i];
        
        if (!bounds.contains(latLng)) {
            mrkrLayer.removeFrom(map);
            mrkrLayer.removeFrom(markers);
//            delete markers._layers[i];
        }
    }
}

                               
function initmap() {
    map = new L.Map('map');
    var markers = new L.FeatureGroup();
    var markersNR = new L.FeatureGroup();
    
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
                              {minZoom: 3, 
                               maxZoom: 20, 
                               attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                              });		
    
    map.setView(new L.LatLng(38.870989, -77.055961),16);
    map.addLayer(osm);
    
    var sidebar = L.control.sidebar('sidebar', {
        position: 'right',
    }).addTo(map);

    var geojson = {};
    fireGeoJ(geojson); //opening view initial fire
    
    
    L.easyButton('<span class="dwn">&#11015;GeoJSON</span>', function(btn, map){   //dwnld geojson button
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson));
        var dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "wikiExtent.geojson");
        dlAnchorElem.click();
    }).addTo(map);
    L.easyButton('<span class="dwn">&#11015;CSV</span>', function(btn, map){   //dwnld csv button
        var content = JSON2CSV(geojson);
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(content);
        downloadCSV.setAttribute("href", dataStr);
        downloadCSV.setAttribute("download", "wikiExtent.csv");
        downloadCSV.click();
    }).addTo(map);    
    
    L.control.search({ //search control
        data: markersNR,
    }).addTo(map);
    
    WL = L.layerGroup.wikipediaLayer({ 
        images: 'https://cdn.rawgit.com/MatthewBarker/leaflet-wikipedia/master/build/images', 
        clearOutsideBounds: true,
        popupOnMouseover: true,
        limit: 500, //""gslimit" may not be over 500 
    });

   
//    fireGeoJ waits for GET response then kicks off functions makeGeoJ & displayGeoJSON
    function fireGeoJ(GJ){  
        var dsplyGJ = L.geoJSON().addTo(map);
        GJ['type'] = 'FeatureCollection';
        GJ['features'] = [];

        var interval = setInterval(function() { //GET response listener            
            makeGeoJ(WL.tmpResults, GJ); //construct geojson func
            
            if(GJ.features.length !== 0){
                clearInterval(interval); //break listener
                displayGeoJSON(GJ); //add markers

                L.easyButton('<span class="dwn">&#11015;</span>', function(btn, map){  
                    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(GJ));
                    var dlAnchorElem = document.getElementById('downloadAnchorElem');
                    dlAnchorElem.setAttribute("href", dataStr);
                    dlAnchorElem.setAttribute("download", "wikiExtent.geojson");
                    dlAnchorElem.click();
                }); 
                L.easyButton('<span class="dwn">&#11015;CSV</span>', function(btn, map){   //dwnld csv button
                    var content = JSON2CSV(geojson);
                    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(content);
                    downloadCSV.setAttribute("href", dataStr);
                    downloadCSV.setAttribute("download", "wikiExtent.csv");
                    downloadCSV.click();
                })
                
                console.log(Object.size(WL.allResults));
//                console.log(Object.size(WL.tmpResults));
            }
        },10);
    };
    
    
    var smlIcon = new L.Icon({
        iconUrl: 'wikipedia-icon.png',
        iconRetinaUrl: 'wikipedia-icon-2x.png',
        iconSize: [25, 25],
        iconAnchor:  [12, 41],
        popupAnchor: [0, -40]
    });  
    
    function displayGeoJSON(GJ){    
        L.geoJson(GJ, {
            pointToLayer: function(feature, latlng) {
                marker = L.marker(latlng, {icon: smlIcon});
                
                var fLat = feature.geometry.coordinates[1];
                var fLon =feature.geometry.coordinates[0]; 
                
                marker['myTitle'] = feature.properties.title; //add descriptions/titles to marker layers
                marker['myLink'] = feature.properties.link;
                
                href = feature.properties.link;
                popup = '<a href="' + href + '" target="_blank">' + feature.properties.title + '</a>';
                marker.on('mouseover', function (event) {
                    event.target.openPopup()
                });
                marker.bindPopup(popup);
                
                markers.addLayer(marker);
                markersNR._layers[marker.myTitle] = marker; //no repeats layer, send to search func
            },
        });
        
        
        
        clearOutsideBounds(markers);
        markers.addTo(map);
//        map.addLayer(markers);
    
        
        var zoomLvl = map._zoom;
        if(zoomLvl < 12){       //dont show markers past zoom lvl x
            markers.removeFrom(map);
//            delete markers;
        }
    };

        
    map.on('dragend', function(e) { //re-query once map extent changes
        fireGeoJ(geojson);
    });
    map.on('zoomend', function(e) { //re-query once map zoom changes
        fireGeoJ(geojson);
    });
    
    markers.addTo(map).on('click', function(evt) { //side panel GET request
        var title = evt.layer.myTitle;
        var href = evt.layer.myLink;
        var fetch = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exchars=2000&titles=' + title;

        JSONP({
            url: fetch,
            success: function resp(response) {
                var abst = Object.values(response.query.pages)[0].extract;

                abst = abst.replace(/<h3>/g, "<h4>");
                abst = abst.replace(/<\/h3>/g, "<\/h4>");               
                abst = abst.replace(/<h2>/g, "<h4>");
                abst = abst.replace(/<\/h2>/g, "<\/h4>");

                var template = '<h4>' + title + '</h4><p>' + abst + '</p><p><a href="' + href + '" target="_blank" >Read on Wikipedia</a></p>';

//                console.log(evt.layer.data);
                sidebar.setContent(L.Util.template(template, evt.layer.data)).show();
            }
        })
	}); //markers.addTo(map).on('click'...
        
    
} //init map


