// refer to the IControl interface
// http://leafletjs.com/reference.html#icontrol
// sample influenced by leaflet-geocoder
//https://github.com/odoe/leaflet-control-sample/blob/master/js/controls/search.js



function sortR(a, b) {
    var _a = a.myTitle;
    var _b = b.myTitle;

    if (_a < _b) {
        return -1;
    }
    if (_a > _b) {
        return 1;
    }
    return 0;
}



L.Control.Search = L.Control.extend({
    
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'topleft',
        placeholder: 'Search...'
    },
    
    initialize: function (options /*{ data: {...}  }*/) {
        // constructor
        L.Util.setOptions(this, options);
    },
    
    onAdd: function (map) {
        // happens after added to map
        var container = L.DomUtil.create('div', 'search-container');
        this.form = L.DomUtil.create('form', 'form', container);
        var group = L.DomUtil.create('div', 'form-group', this.form);
        this.input = L.DomUtil.create('input', 'form-control input-sm', group);
        this.input.type = 'text';
        this.input.placeholder = this.options.placeholder;
        this.results = L.DomUtil.create('div', 'list-group', group);
        L.DomEvent.addListener(this.input, 'keyup', _.debounce(this.keyup, 300), this);
        L.DomEvent.addListener(this.form, 'submit', this.submit, this);
        L.DomEvent.disableClickPropagation(container);
        return container;
    },
    
    onRemove: function (map) {
        // when removed
        L.DomEvent.removeListener(this._input, 'keyup', this.keyup, this);
        L.DomEvent.removeListener(form, 'submit', this.submit, this);
    },
    
    keyup: function(e) {
        this.results.innerHTML = '';

        if (this.input.value.length > 2) {
            var value = this.input.value;

//                console.log(this.options.data);

            var results = _.take(_.filter(this.options.data._layers, function(x) {
                return x.myTitle.toUpperCase().indexOf(value.toUpperCase()) > -1;
            }).sort(sortR), 15);

            var res = this.results;
            var res2 = this;
            
            _.map(results, function(x) {
                var a = L.DomUtil.create('a', 'list-group-item');
                a.href = x.myLink;
                a.setAttribute('data-result-name', x.myTitle);
                a.innerHTML = x.myTitle;
                a.target = "_blank";
                res.appendChild(a);
                L.DomEvent.addListener(a, 'click', res2.itemSelected, res2);

                return a;
            }, this);
        }
    },
    

    itemSelected: function(e) {
        L.DomEvent.preventDefault(e);
        var elem = e.target;
        var value = elem.innerHTML;
        var inVal = elem.getAttribute('data-result-name'); //clicked value in dropdown
        var theData = this.options.data;
        
        var feature = _.find(theData._layers, function(x) {
            return x.myTitle === inVal;
        }, this);
        
        var featLat = feature._latlng.lat;
        var featLng = feature._latlng.lng;
        
        if (feature) {
             
            map.setView(new L.LatLng(featLat, featLng),15);
            
            console.log(feature)
            feature.addTo(map);
            feature.openPopup();
        }
        this.results.innerHTML = '';
    },
    
    
    submit: function(e) {
        L.DomEvent.preventDefault(e);
    }
    
});


L.control.search = function(id, options) {
    return new L.Control.Search(id, options);
}