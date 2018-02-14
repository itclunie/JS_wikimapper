
//add time mod & created
//full desc in download
//all panned since download
//option to download csv or geojson


var map;

function JSON2CSV(geoJSON) //convert geojson to csv
{
    var headers = "title,link,type,country,region,id,views range,views,firstEdit,lastEdit,lon,lat\n"
    var content = [];
    
    content.push(headers);
    
    for(var obj in geoJSON.features){        
        var geoLon = geoJSON.features[obj].geometry.coordinates[0];
        var geoLat = geoJSON.features[obj].geometry.coordinates[1];
        var title = geoJSON.features[obj].properties.title;
        title = title.replace(",", "--");
        var link = geoJSON.features[obj].properties.link;
        var type = geoJSON.features[obj].properties.type;
        var country = geoJSON.features[obj].properties.country;
        var region = geoJSON.features[obj].properties.region;
        var id = geoJSON.features[obj].properties.pageid;
        var firstEdit = geoJSON.features[obj].properties.firstEdit;
        var lastEdit = geoJSON.features[obj].properties.lastEdit;
        
        
        var categObj = geoJSON.features[obj].properties.categories;
        var categ = "";
        _.find(categObj, function(x) {
            categ = categ + ' | ' + x.title;
        }, this);
        categ = categ.replace(/Category:/g, "");
        
        var pageViewsObj = geoJSON.features[obj].properties.pageviews;
        var viewsRange = Object.keys(pageViewsObj);
        viewsRange = viewsRange[0] + ' to ' + viewsRange[viewsRange.length - 1];
        var pageViews = 0;
        _.find(pageViewsObj, function(x) {
            pageViews = pageViews + x;
        }, this);
        
        var instr = title + ',' + link  + ',' + type  + ',' + country + ',' + region + ',' + id + ',' + viewsRange + ',' +  pageViews + ',' + firstEdit + ',' + lastEdit + ',' + geoLat + ',' + geoLon + '\n';
        instr = instr.replace(/null/g, "");
        
        content.push(instr);
    }

    var blob = new Blob(content, {type: "text/plain;charset=utf-8"}); //download as blob using FileSaver.js
    saveAs(blob, returnDate() + "_WikiMapr.csv");  
    
}; 

function returnDate() //return todays date as mm_dd_yyyy;hh_mm_ss
{
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    if(dd<10) {
        dd='0'+dd
    } 
    if(mm<10) {
        mm='0'+mm
    } 
    today = mm + '_' + dd + '_' + yyyy + ';' + h + '_' + m + '_' + s;
    return today;
}

function makeGeoJ(inObj,geoJ) //fill geojson with data from tmpResults which comes from leaflet-wikipedia.js
{    
    for (var k in inObj) {    
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
                "link": WL.originalURL + '?curid=' + inObj[k].pageid,
                "type": inObj[k].type,
                "country": inObj[k].country,
                "region": inObj[k].region,
                "pageid": inObj[k].pageid,
                "article":"",
                "pageviews":{},
                "categories":[],
                "firstEdit":"",
                "lastEdit":""
            }
        }
        geoJ['features'].push(newFeature);
    };
}

function clearOutsideBounds(markers) //remove markers from map markers outside extent
{
    var bounds = WL.myBounds,
        latLng,
        key;
    for (i in markers._layers) {
        var latLng = markers._layers[i]._latlng;
        var mrkrLayer = markers._layers[i];
        
        if (!bounds.contains(latLng)) {
            mrkrLayer.removeFrom(map);
            mrkrLayer.removeFrom(markers);
        }
    }
}
                         
function getById(id,arr) //matching function for L.easyButton promise
{
    var results = arr.filter(function(x) { return x.pageid == id });
    return (results.length > 0 ? results[0] : null);
}


function initmap() {
    map = new L.Map('map');
    var markers = new L.FeatureGroup();
    var markersNR = new L.FeatureGroup();
    var boxCheck = false;
    var geojson = {};   
    var myDate = returnDate();
    
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
                              {minZoom: 3, 
                               maxZoom: 20, 
                               attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                              });		
    
    map.setView(new L.LatLng(43.92498, 81.33171),13);
    map.addLayer(osm);
    
    var sidebar = L.control.sidebar('sidebar', {
        position: 'right',
    }).addTo(map); // see L.Control.Sidebar.js

    fireGeoJ(geojson,boxCheck); //opening view initial fire
    
    L.easyButton('<span class="dwn">&#11015;</span>', function(btn, map) //dwnld geojson button, see EZbutton.js
                 {   
        var getCount = 0;
        var content = [];
        var p = new Promise(function(resolve, reject) //2nd GET requests on all markers in extent
                            {
            for(var i in geojson.features){
                var fetch = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|revisions|pageviews|info&exchars=100&rvlimit=1&rvdir=newer&titles=" + geojson.features[i].properties.title;
                
                JSONP({
                    url: fetch,
                    success: function(response) {    
//                        console.log(response);
                        var respContent = Object.values(response.query.pages)[0];
                        content.push(respContent);
                        getCount++;

                        if(getCount == geojson.features.length){
                            resolve(content);
                        }
                    }
                });
            }  
        });

        p.then((content) => //once requests made on all markers in extent, promise complete, download as geojson/csv
               {
            for(var j in geojson.features){
                var searchby = geojson.features[j].properties.pageid;
                var result = getById(searchby, content);
                
                if(result !== null){                    
                    geojson.features[j].properties.article = result.extract;
                    geojson.features[j].properties.pageviews = result.pageviews;
                    geojson.features[j].properties.firstEdit = result.revisions[0].timestamp;
                    geojson.features[j].properties.lastEdit = result.touched;
                    geojson.features[j].properties.categories = result.categories;
                }
            }
            var dataStr = JSON.stringify(geojson);
            var blob = new Blob([dataStr], {type: "text/plain;charset=utf-8"});
            saveAs(blob, myDate + "_WikiMapr.geojson");  
            console.log(geojson);
            JSON2CSV(geojson);
        })
    }).addTo(map);
    
    
    L.control.search({ data: markersNR }).addTo(map); //search control, see searchControl.js
    
    
    function handleCommand() {fireGeoJ(geojson,this.checked)} //help with checkbox, see var dwnldAll
    
    
    
    
    var dwnldAll = L.control({position: 'bottomleft'}); //checkbox if checked, download all viewed not just current extent
    dwnldAll.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'all');
        div.innerHTML = '<form><input id="all" type="checkbox"/>&#11015;<b>All viewed</b></form>'; 
        return div;
    };
    dwnldAll.addTo(map);
    document.getElementById ("all").addEventListener ("click", handleCommand, false);
    
    
    WL = L.layerGroup.wikipediaLayer( //wiki requests, see leaflet-wikipedia.js
        { 
        images: 'https://cdn.rawgit.com/MatthewBarker/leaflet-wikipedia/master/build/images', 
        clearOutsideBounds: true,
        popupOnMouseover: true,
        limit: 500, //""gslimit" may not be over 500 
    }); 
   
    function fireGeoJ(GJ,bxChck) //waits for leaflet-wikipedia.js to finish, fires makeGeoJ/displayGeoJSON
    {  
        var dsplyGJ = L.geoJSON().addTo(map);
        GJ['type'] = 'FeatureCollection'; 
        GJ['features'] = [];
        
        var interval = setInterval(function() { //GET response listener   
            if(bxChck == false){
                makeGeoJ(WL.tmpResults, GJ); 
            }else{
                makeGeoJ(WL.allResults, GJ); 
            }

            if(GJ.features.length !== 0){
                clearInterval(interval); //break listener
                displayGeoJSON(GJ); //add markers
            }
        },10);
    }; 
    
    
    var smlIcon = new L.Icon( //wikipedia marker specs
        {
        iconUrl: 'img/wikipedia-icon.png',
        iconRetinaUrl: 'img/wikipedia-icon-2x.png',
        iconSize: [25, 25],
        iconAnchor:  [12, 41],
        popupAnchor: [0, -40]
    });  
    
    function displayGeoJSON(GJ) //creates map markers/displays popups
    {    
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

        
        var zoomLvl = map._zoom;
        if(zoomLvl < 9){       //dont show markers past zoom lvl x
            markers.removeFrom(map);
//            delete markers;
        }
    };
        
    map.on('dragend', function(e) { fireGeoJ(geojson,boxCheck) } ); //re-query once map extent changes
    map.on('zoomend', function(e) { fireGeoJ(geojson,boxCheck) } ); //re-query once map zoom changes
    
    markers.addTo(map).on('click', function(evt) //click marker, side panel GET request fires
    { 
        var title = evt.layer.myTitle;
        var href = evt.layer.myLink;
        var fetch = WL.originalURL + 'w/api.php?format=json&action=query&prop=extracts&exchars=2000&titles=' + title;

        JSONP({
            url: fetch,
            success: function resp(response) {
                var abst = Object.values(response.query.pages)[0].extract;

                abst = abst.replace(/<h3>/g, "<h4>");
                abst = abst.replace(/<\/h3>/g, "<\/h4>");               
                abst = abst.replace(/<h2>/g, "<h4>");
                abst = abst.replace(/<\/h2>/g, "<\/h4>");

                var template = '<h4>' + title + '</h4><p><a href="' + href + '" target="_blank" >Read on Wikipedia</a></p><p>' + abst + '</p>';
                sidebar.setContent(L.Util.template(template, evt.layer.data)).show();
            }
        })
	});
    
    
    var langs = " \
    <select > \
    <option>English : en</option> \
    <option>Spanish : es</option> \
    <option>Chinese : zh</option> \
    <option>Russian : ru</option> \
    <option>Abkhaz : ab</option> \
    <option>Afar : aa</option> \
    <option>Afrikaans : af</option> \
    <option>Akan : ak</option> \
    <option>Albanian : sq</option> \
    <option>Amharic : am</option> \
    <option>Arabic : ar</option> \
    <option>Aragonese : an</option> \
    <option>Armenian : hy</option> \
    <option>Assamese : as</option> \
    <option>Avaric : av</option> \
    <option>Avestan : ae</option> \
    <option>Aymara : ay</option> \
    <option>Azerbaijani : az</option> \
    <option>Bambara : bm</option> \
    <option>Bashkir : ba</option> \
    <option>Basque : eu</option> \
    <option>Belarusian : be</option> \
    <option>Bengali, Bangla : bn</option> \
    <option>Bihari : bh</option> \
    <option>Bislama : bi</option> \
    <option>Bosnian : bs</option> \
    <option>Breton : br</option> \
    <option>Bulgarian : bg</option> \
    <option>Burmese : my</option> \
    <option>Catalan : ca</option> \
    <option>Chamorro : ch</option> \
    <option>Chechen : ce</option> \
    <option>Chichewa, Chewa, Nyanja : ny</option> \
    <option>Chuvash : cv</option> \
    <option>Cornish : kw</option> \
    <option>Corsican : co</option> \
    <option>Cree : cr</option> \
    <option>Croatian : hr</option> \
    <option>Czech : cs</option> \
    <option>Danish : da</option> \
    <option>Divehi, Dhivehi, Maldivian : dv</option> \
    <option>Dutch : nl</option> \
    <option>Dzongkha : dz</option> \
    <option>Esperanto : eo</option> \
    <option>Estonian : et</option> \
    <option>Ewe : ee</option> \
    <option>Faroese : fo</option> \
    <option>Fijian : fj</option> \
    <option>Finnish : fi</option> \
    <option>French : fr</option> \
    <option>Fula, Fulah, Pulaar, Pular : ff</option> \
    <option>Galician : gl</option> \
    <option>Georgian : ka</option> \
    <option>German : de</option> \
    <option>Greek (modern) : el</option> \
    <option>Guaraní : gn</option> \
    <option>Gujarati : gu</option> \
    <option>Haitian, Haitian Creole : ht</option> \
    <option>Hausa : ha</option> \
    <option>Hebrew (modern) : he</option> \
    <option>Herero : hz</option> \
    <option>Hindi : hi</option> \
    <option>Hiri Motu : ho</option> \
    <option>Hungarian : hu</option> \
    <option>Interlingua : ia</option> \
    <option>Indonesian : id</option> \
    <option>Interlingue : ie</option> \
    <option>Irish : ga</option> \
    <option>Igbo : ig</option> \
    <option>Inupiaq : ik</option> \
    <option>Ido : io</option> \
    <option>Icelandic : is</option> \
    <option>Italian : it</option> \
    <option>Inuktitut : iu</option> \
    <option>Japanese : ja</option> \
    <option>Javanese : jv</option> \
    <option>Kalaallisut, Greenlandic : kl</option> \
    <option>Kannada : kn</option> \
    <option>Kanuri : kr</option> \
    <option>Kashmiri : ks</option> \
    <option>Kazakh : kk</option> \
    <option>Khmer : km</option> \
    <option>Kikuyu, Gikuyu : ki</option> \
    <option>Kinyarwanda : rw</option> \
    <option>Kyrgyz : ky</option> \
    <option>Komi : kv</option> \
    <option>Kongo : kg</option> \
    <option>Korean : ko</option> \
    <option>Kurdish : ku</option> \
    <option>Kwanyama, Kuanyama : kj</option> \
    <option>Latin : la</option> \
    <option>Luxembourgish, Letzeburgesch : lb</option> \
    <option>Ganda : lg</option> \
    <option>Limburgish, Limburgan, Limburger : li</option> \
    <option>Lingala : ln</option> \
    <option>Lao : lo</option> \
    <option>Lithuanian : lt</option> \
    <option>Luba-Katanga : lu</option> \
    <option>Latvian : lv</option> \
    <option>Manx : gv</option> \
    <option>Macedonian : mk</option> \
    <option>Malagasy : mg</option> \
    <option>Malay : ms</option> \
    <option>Malayalam : ml</option> \
    <option>Maltese : mt</option> \
    <option>Māori : mi</option> \
    <option>Marathi (Marāṭhī) : mr</option> \
    <option>Marshallese : mh</option> \
    <option>Mongolian : mn</option> \
    <option>Nauruan : na</option> \
    <option>Navajo, Navaho : nv</option> \
    <option>Northern Ndebele : nd</option> \
    <option>Nepali : ne</option> \
    <option>Ndonga : ng</option> \
    <option>Norwegian Bokmål : nb</option> \
    <option>Norwegian Nynorsk : nn</option> \
    <option>Norwegian : no</option> \
    <option>Nuosu : ii</option> \
    <option>Southern Ndebele : nr</option> \
    <option>Occitan : oc</option> \
    <option>Ojibwe, Ojibwa : oj</option> \
    <option>Old Church Slavonic, Church Slavonic, Old Bulgarian : cu</option> \
    <option>Oromo : om</option> \
    <option>Oriya : or</option> \
    <option>Ossetian, Ossetic : os</option> \
    <option>(Eastern) Punjabi : pa</option> \
    <option>Pāli : pi</option> \
    <option>Persian (Farsi) : fa</option> \
    <option>Polish : pl</option> \
    <option>Pashto, Pushto : ps</option> \
    <option>Portuguese : pt</option> \
    <option>Quechua : qu</option> \
    <option>Romansh : rm</option> \
    <option>Kirundi : rn</option> \
    <option>Romanian : ro</option> \
    <option>Sanskrit (Saṁskṛta) : sa</option> \
    <option>Sardinian : sc</option> \
    <option>Sindhi : sd</option> \
    <option>Northern Sami : se</option> \
    <option>Samoan : sm</option> \
    <option>Sango : sg</option> \
    <option>Serbian : sr</option> \
    <option>Scottish Gaelic, Gaelic : gd</option> \
    <option>Shona : sn</option> \
    <option>Sinhalese, Sinhala : si</option> \
    <option>Slovak : sk</option> \
    <option>Slovene : sl</option> \
    <option>Somali : so</option> \
    <option>Southern Sotho : st</option> \
    <option>Sundanese : su</option> \
    <option>Swahili : sw</option> \
    <option>Swati : ss</option> \
    <option>Swedish : sv</option> \
    <option>Tamil : ta</option> \
    <option>Telugu : te</option> \
    <option>Tajik : tg</option> \
    <option>Thai : th</option> \
    <option>Tigrinya : ti</option> \
    <option>Tibetan Standard, Tibetan, Central : bo</option> \
    <option>Turkmen : tk</option> \
    <option>Tagalog : tl</option> \
    <option>Tswana : tn</option> \
    <option>Tonga (Tonga Islands) : to</option> \
    <option>Turkish : tr</option> \
    <option>Tsonga : ts</option> \
    <option>Tatar : tt</option> \
    <option>Twi : tw</option> \
    <option>Tahitian : ty</option> \
    <option>Uyghur : ug</option> \
    <option>Ukrainian : uk</option> \
    <option>Urdu : ur</option> \
    <option>Uzbek : uz</option> \
    <option>Venda : ve</option> \
    <option>Vietnamese : vi</option> \
    <option>Volapük : vo</option> \
    <option>Walloon : wa</option> \
    <option>Welsh : cy</option> \
    <option>Wolof : wo</option> \
    <option>Western Frisian : fy</option> \
    <option>Xhosa : xh</option> \
    <option>Yiddish : yi</option> \
    <option>Yoruba : yo</option> \
    <option>Zhuang, Chuang : za</option> \
    <option>Zulu : zu</option> </select>"

    
    var legend = L.control({position: 'topright'});
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = langs;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    legend.addTo(map);
    
    
    $('select').on( //once lang selected from dropdown...
        {
        "change": function() 
            {
            choice = $(this).val().split(" ")[2]; //split by space
              
            console.log(WL.options.url);
                
            markers.removeFrom(map);
            markersNR.removeFrom(map);
            
            WL.options.url = "https://" + choice + ".wikipedia.org/"
            WL.requestData();

            }
        }
    );
    

        
} //init map


