/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

otp.namespace("otp.layers");

var StopIcon20 = L.Icon.extend({
    options: {
        iconUrl: resourcePath + 'images/stop20.png',
        shadowUrl: null,
        iconSize: new L.Point(20, 20),
        iconAnchor: new L.Point(10, 10),
        popupAnchor: new L.Point(0, -5)
    }
});

otp.layers.StopsLayer = 
    otp.Class(L.LayerGroup, {
   
    module : null,
    
    minimumZoomForStops : 15,
    
    initialize : function(module) {
        L.LayerGroup.prototype.initialize.apply(this);
        this.module = module;

        this.stopsLookup = {};
        
        this.module.addLayer("stops", this);
        this.module.webapp.map.lmap.on('dragend zoomend', $.proxy(this.refresh, this));
    },
    
    refresh : function() {
        this.clearLayers();                
        var lmap = this.module.webapp.map.lmap;
        if(lmap.getZoom() >= this.minimumZoomForStops) {
            this.module.webapp.transitIndex.loadStopsInRectangle(null, lmap.getBounds(), this, function(data) {
                this.stopsLookup = {};
                for(var i = 0; i < data.stops.length; i++) {
                    var agencyAndId = data.stops[i].id.agencyId + "_" + data.stops[i].id.id;
                    this.stopsLookup[agencyAndId] = data.stops[i];
                }
                this.updateStops();
            });
        }
    },
    
    updateStops : function(stops) {
        var stops = _.values(this.stopsLookup);
        var this_ = this;
        
        for(var i=0; i<stops.length; i++) {

            var stop = stops[i];
            stop.lat = stop.lat || stop.stopLat;
            stop.lon = stop.lon || stop.stopLon;

            //console.log(stop);
            
            var icon = new StopIcon20();
            
            var popupContent = ich['otp-stopsLayer-popup'](stop);

            popupContent.find('.planFromLink').data('stop', stop).click(function() {
                var thisStop = $(this).data('stop');
                this_.module.setStartPoint(new L.LatLng(thisStop.lat, thisStop.lon), false, thisStop.stopName);
                this_.module.webapp.map.lmap.closePopup();
            });

            popupContent.find('.planToLink').data('stop', stop).click(function() {
                var thisStop = $(this).data('stop');
                this_.module.setEndPoint(new L.LatLng(thisStop.lat, thisStop.lon), false, thisStop.stopName);
                this_.module.webapp.map.lmap.closePopup();
            });

            if(stop.routes) {
                var routeList = popupContent.find('.routeList');
                for(var r = 0; r < stop.routes.length; r++) {
                    var agencyAndId = stop.routes[r].agencyId + '_' + stop.routes[r].id;
                    var routeData = this.module.webapp.transitIndex.routes[agencyAndId].routeData;
                    ich['otp-stopsLayer-popupRoute'](routeData).appendTo(routeList);
                    // TODO: click opens RouteViewer
                    //routeList.append('<div>'+agencyAndId+'</div>');
                }
            }
                    
            L.marker([stop.lat, stop.lon], {
                icon : icon,
            }).addTo(this)
            .bindPopup(popupContent.get(0));
            
            

            
        }

    },
});