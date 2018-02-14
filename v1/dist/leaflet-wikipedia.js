
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['leaflet', 'browser-jsonp'], factory);
  } 
    else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'), require('browser-jsonp'));
  } 
    else {
    root.L = factory(root.L, root.JSONP);
  }
}

 
(this, function(L, JSONP) {
    /*global L, JSONP*/

    'use strict';


    /**
        A Wikipedia layer group for leaflet.
        @class WikipediaLayer
        @param {Object} [options] - These layer options are merged with the default options
        @param {string} [options.url='https://en.wikipedia.org/'] - The URL for Wikipedia
        @param {number} [options.limit=100] - The maximum number of search results to return
        @param {Boolean} [options.popupOnMouseover=false] - If true then the popup will open on mouse over; otherwise it won't
        @param {Boolean} [options.clearOutsideBounds=false] - If true then markers outside the current map bounds will be removed; otherwise they won't
        @param {string} [options.target='_self'] - specifies where to open the linked Wikipedia page
        @param {string} [options.images='images/'] - specifies the folder that contains the Wikipedia icon images
        @param {number} [options.minZoom='0'] - minimum zoom number
        @param {number} [options.maxZoom='18'] - maximum zoom number
    */


    var allResults = {};
    L.LayerGroup.WikipediaLayer = L.LayerGroup.extend(
        /** @lends module:wikipedia-layer~WikipediaLayer */
        {
            /**
                Query string fragment to use when linking to a Wikipedia page.
                @constant
                @default
                @private
            */
            PAGE: '?curid=',
            /**
                URL fragment to use when connecting to the API.
                @constant
                @default
                @private
            */
            API: 'w/api.php',
            /**
                Default layer options.
                @default
                @private
            */

            options: {
                url: 'https://en.wikipedia.org/',
                limit: 100,
                popupOnMouseover: false,
                clearOutsideBounds: true,
                target: '_blank', //open in new tab
                images: 'images/',
                minZoom: 0,
                maxZoom: 18,
            },


            /**
                Create the layer group using the passed options.
                @param {Object} options
                @private
            */
            initialize: function (options) {
                options = options || {};
                L.Util.setOptions(this, options);

                if (this.options.images.indexOf('/', this.options.images.length - 1) === -1) {
                    this.options.images += '/';
                }

                this._layers = {};
                
                map.on('move', this.requestData, this); //pasted from 'onAdd: function (map) {'
                this._map = map;
                this.requestData();
            },

            
            /**
                Send a query request for JSONP data.
                @private
            */
            requestData: function () {
                this.myExtent = this._map.getZoom();
                this.myOrigin = this._map.getCenter();
                this.myRadius = this.getRadius();
                this.myBounds = this.get_Bounds();
                this.allResults = allResults;
                    
                var zoom = this._map.getZoom(),
                    origin = this._map.getCenter(),

                    data = {
                        format: 'json',
                        action: 'query',
                        gsprop: 'country|type|name|region',
                        list: 'geosearch',
                        gslimit: this.options.limit,
                        gsradius: this.getRadius(),
                        gscoord: origin.lat + '|' + origin.lng,

                    },
                    self = this;
//                console.log(this.myBounds);

                if (zoom >= this.options.minZoom && zoom <= this.options.maxZoom) {
                    JSONP({
                        url: this.options.url + this.API,
                        data: data,
                        success: function (response) {
                            self.parseData(response);
                        }
                    });
                } 
            },
  

            
            parseData: function (response) {
                this.tmpResults = response.query.geosearch,
                    length = this.tmpResults.length;
                    this._layers = []; //change 2 array no obj
                    
                for (var i=0; i < length; i++) {  //iterate thru each result                    
                    this._layers.push(this.tmpResults[i].pageid);
                    
                    var pageID = this.tmpResults[i].pageid;
                    allResults[pageID] = this.tmpResults[i]; //keep appening to allResults obj. page id as key
                }
                
            },


            /**
                Get the radius for the Wikipedia search based on the current map bounds.
                This is limited to the maximum supported by the API, which is 10000.
                @return {number} The radius to search.
                @private
            */
            getRadius: function () {
                var bounds = this._map.getBounds(),
                    northWest = bounds.getNorthWest(),
                    southEast = bounds.getSouthEast(),
                    radius = northWest.distanceTo(southEast) / 2;

                return radius > 10000 ? 10000 : radius;
            },
            get_Bounds: function () {
                var bounds = this._map.getBounds();
                return bounds;
            },

        }
    );


    /**
        Creates a new Wikipedia layer.
        @method wikipediaLayer
        @returns {module:wikipedia-layer~WikipediaLayer} A new Wikipedia layer.
    */
    L.layerGroup.wikipediaLayer = function (options) { 
        return new L.LayerGroup.WikipediaLayer(options);

    };
return L;   
}));
