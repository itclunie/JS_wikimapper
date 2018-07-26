
//<![CDATA[
// this variable will collect the html which will eventually be placed in the side_bar 


var side_bar_html = ""; 
var gmarkers = [];
var map = null;
var startLocation = null;
var endLocation = null;
var geojson = {
"name":"NewFeatureType",
"type":"FeatureCollection",
"features":[{
	"type":"Feature",
	"geometry":{
		"type":"LineString",
		"coordinates":[]
	},
	"properties":null
	}]
};

function initialize() {
	var center = new google.maps.LatLng(24.7756,121.0062);
	
	map = new google.maps.Map(document.getElementById('map_canvas'), {
		center: center,
		zoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
		
	google.maps.event.addListener(map, 'click', function() {
		infowindow.close();
	});

	var directionsService = new google.maps.DirectionsService(); 
	var request = { 
		origin: "lat,lon",  //lat lon as string
		destination: "lat,lon", 
		travelMode: google.maps.DirectionsTravelMode.DRIVING 
	}; 

	var polyline = new google.maps.Polyline({
		path: [],
		strokeColor: '#FF0000',
		strokeWeight: 3
	});
		
	directionsService.route(request, function(response, status) {
	  if (status == google.maps.DirectionsStatus.OK) {
		var bounds = new google.maps.LatLngBounds();
		var route = response.routes[0];
		var summaryPanel = document.getElementById("directions_panel");
		var detailsPanel = document.getElementById("direction_details");
		startLocation = new Object();
		endLocation = new Object();

		summaryPanel.innerHTML = "";
		detailsPanel.innerHTML = '<ul>';

		// For each route, display summary information.
		for (var i = 0; i < route.legs.length; i++) {
		  var routeSegment = i + 1;
		  summaryPanel.innerHTML += "<b>Route Segment: " + routeSegment + "</b><br />";
		  summaryPanel.innerHTML += route.legs[i].start_address + " to ";
		  summaryPanel.innerHTML += route.legs[i].end_address + "<br />";
		  summaryPanel.innerHTML += route.legs[i].distance.text + "<br /><br />";
		}
		
		var path = response.routes[0].overview_path;
		var legs = response.routes[0].legs;
		
		for (i=0;i<legs.length;i++) {
		  if (i == 0) { 
			startLocation.latlng = legs[i].start_location;
			startLocation.address = legs[i].start_address;
			createMarker(legs[i].start_location,"start",legs[i].start_address,"green");
		  }
		  endLocation.latlng = legs[i].end_location;
		  endLocation.address = legs[i].end_address;
		  var steps = legs[i].steps;
		  for (j=0;j<steps.length;j++) {
			var nextSegment = steps[j].path;
			detailsPanel.innerHTML += "<li>"+steps[j].instructions;
			var dist_dur = "";
			if (steps[j].distance && steps[j].distance.text) dist_dur += "&nbsp;"+steps[j].distance.text;
			if (steps[j].duration && steps[j].duration.text) dist_dur += "&nbsp;"+steps[j].duration.text;
			if (dist_dur != "") {
			  detailsPanel.innerHTML += "("+dist_dur+")<br /></li>";
			} else {
			  detailsPanel.innerHTML += "</li>";

			}
			for (k=0;k<nextSegment.length;k++) {
			  polyline.getPath().push(nextSegment[k]);
			  bounds.extend(nextSegment[k]);

			}
		  }
		}

		detailsPanel.innerHTML += "</ul>"
		polyline.setMap(map);
		
		//---------------------------------------------------------------------
		function saveToFile(content, filename) {
			var file = filename + '.geojson';
			saveAs(new File([JSON.stringify(content)], file, {
			type: "text/plain;charset=utf-8"
			}), file);
		}
		
		for (var i=0; i<polyline.latLngs.b[0].b.length; i++) { 
			var mySeg = polyline.latLngs.b[0].b[i]

			//geojson.features[0].geometry.coordinates.push([mySeg["lat"](), mySeg["lng"]()]);
			geojson.features[0].geometry.coordinates.push([mySeg["lng"](), mySeg["lat"]()]);
		
		};
		
		saveToFile(geojson,"test2");
		
		//---------------------------------------------------------------------
		
		
		map.fitBounds(bounds);
		createMarker(endLocation.latlng,"end",endLocation.address,"red");
		// == create the initial sidebar ==
		makeSidebar();
													
	  }
	});
  }



var icons = new Array();
icons["red"] = new google.maps.MarkerImage("mapIcons/marker_red.png",
	  // This marker is 20 pixels wide by 34 pixels tall.
	  new google.maps.Size(20, 34),
	  // The origin for this image is 0,0.
	  new google.maps.Point(0,0),
	  // The anchor for this image is at 9,34.
	  new google.maps.Point(9, 34));
	  
	  
function getMarkerImage(iconColor) {
   if ((typeof(iconColor)=="undefined") || (iconColor==null)) { 
	  iconColor = "red"; 
   }
   if (!icons[iconColor]) {
	  icons[iconColor] = new google.maps.MarkerImage("mapIcons/marker_"+ iconColor +".png",
	  // This marker is 20 pixels wide by 34 pixels tall.
	  new google.maps.Size(20, 34),
	  // The origin for this image is 0,0.
	  new google.maps.Point(0,0),
	  // The anchor for this image is at 6,20.
	  new google.maps.Point(9, 34));
   } 
   return icons[iconColor];

}

  // Marker sizes are expressed as a Size of X,Y
  // where the origin of the image (0,0) is located
  // in the top left of the image.
 
  // Origins, anchor positions and coordinates of the marker
  // increase in the X direction to the right and in
  // the Y direction down.

var iconImage = new google.maps.MarkerImage('mapIcons/marker_red.png',
	// This marker is 20 pixels wide by 34 pixels tall.
	new google.maps.Size(20, 34),
	// The origin for this image is 0,0.
	new google.maps.Point(0,0),
	// The anchor for this image is at 9,34.
	new google.maps.Point(9, 34));
var iconShadow = new google.maps.MarkerImage('http://www.google.com/mapfiles/shadow50.png',
	// The shadow image is larger in the horizontal dimension
	// while the position and offset are the same as for the main image.
	new google.maps.Size(37, 34),
	new google.maps.Point(0,0),
	new google.maps.Point(9, 34));
// Shapes define the clickable region of the icon.
// The type defines an HTML &lt;area&gt; element 'poly' which
// traces out a polygon as a series of X,Y points. The final
// coordinate closes the poly by connecting to the first
// coordinate.
var iconShape = {
	coord: [9,0,6,1,4,2,2,4,0,8,0,12,1,14,2,16,5,19,7,23,8,26,9,30,9,34,11,34,11,30,12,26,13,24,14,21,16,18,18,16,20,12,20,8,18,4,16,2,15,1,13,0],
	type: 'poly'
};
var infowindow = new google.maps.InfoWindow(
  { 
	size: new google.maps.Size(150,50)
  });
	
function createMarker(latlng, label, html, color) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");
	var contentString = '<b>'+label+'</b><br>'+html;
	var marker = new google.maps.Marker({
		position: latlng,
		map: map,
		shadow: iconShadow,
		icon: getMarkerImage(color),
		shape: iconShape,
		title: label,
		zIndex: Math.round(latlng.lat()*-100000)<<5
		});
		marker.myname = label;
		gmarkers.push(marker);

	google.maps.event.addListener(marker, 'click', function() {
		infowindow.setContent(contentString); 
		infowindow.open(map,marker);
		});
}

function myclick(i) {
	google.maps.event.trigger(gmarkers[i],"click");
}
// == rebuilds the sidebar to match the markers currently displayed ==
function makeSidebar() {
	var html = "";
	for (var i=0; i<gmarkers.length; i++) {
		html += '<a href="javascript:myclick(' + i + ')">' + gmarkers[i].myname + '<\/a><br>';
	}
	document.getElementById("side_bar").innerHTML = html;
}
//]]>
