//     GmapsHiddenMarkers.js 1.0.0

//     (c) 2013 Mateu Yábar
//     GmapsHiddenMarkers may be freely distributed under the MIT license.
//     For all details and documentation:
//     XXXXX

// Package definition
// -------------

//Define pakages names
window.my = window.my || {};
my.ggmaps = my.ggmaps || {};

// DirectionMarker class
// -------------

// Draws an icon at the border of a google maps, when a marker is outside the map bounds.
// The icon is updated if the map is moved.

//###DirectionMarker.Constructor
//Creates a new direction marker. The options should be like
//> options={
//> 	*map: google_map,
//> 	*position: {latitude: 1.0, longitude:1.0},
//> 	*icon: "assets/image1.png",
//> 	*icon_NE: "assets/image1_NE.png",
//> 	*icon_size: [34, 30]
//> }
my.ggmaps.DirectionMarker = function(options){
	this.options=options;
	this._initView();
	this._updateView();
	this._addListeners();
}

// ###DirectionMarker.unrender
// Deletes the view of the marker. After this method is called, the DirectionMarker should not be used again.
my.ggmaps.DirectionMarker.prototype.unrender = function(){
	this.$figure.detach();
}

// ###DirectionMarker.update
//	Call to update the images or position of the marker. The view will be updated
my.ggmaps.DirectionMarker.prototype.update = function(options){
	this.options = $.extend(this.options, options);
	this._updateView();
}

//###DirectionMarker._addListeners
// Private method. It adds the listeners to the map, so the markers is modified when map bounds change
my.ggmaps.DirectionMarker.prototype._addListeners = function(){
	var map= this.options.map;
	var self=this;
	var selfUpdate = function() {self._updateView.call(self);}
	google.maps.event.addListener(map, 'bounds_changed', selfUpdate);
			
}

// ###DirectionMarker._isMarkerOutside
// Private method. Returns if the given position is not displayed in the map (is outside the map bounds)
// 
my.ggmaps.DirectionMarker.prototype._isMarkerOutside = function(){
		var map= this.options.map;
		var marker = this.options.position;
		//map not initialized, return null
		if(!map.getBounds()){
			return null;
		}
		return !map.getBounds().contains(new google.maps.LatLng(marker.latitude,marker.longitude));
	}

// ###DirectionMarker._initView
// Private method. Inits the direction marker view, creating its html representation. Must be called before _updateView
// 
my.ggmaps.DirectionMarker.prototype._initView = function(){
	var imagePath=this.options.icon;
	this.$img=$('<img style="position: absolute; left: 0px; top: 0px; -webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; width: 34px; height: 30px;" src="'+imagePath+'" draggable="false">');
	this.$figure =$("<div style='z-index: 999; position:fixed; opacity:0'></div>");
	this.$figure.append(this.$img);
	$("#content").prepend(this.$figure);
}

// ###DirectionMarker._updateView
// Private method. Updates the html representation:
// *(hide/display) if in bounds
// *change postion
// *change icon
my.ggmaps.DirectionMarker.prototype._updateView = function(){
	if(!this._isMarkerOutside()){
		this.$figure.css("display","none");
		return;
	} else {
		this.$figure.css("display","block");
	}

	var marker = this.options.position;
	var map= this.options.map;
	var image= this.options.icon;
	var imageNE = this.options.icon_NE;
	var iconSize = this.options.icon_size;

	var direction=my.ggmaps.getDirectionVector(map, new google.maps.LatLng(marker.latitude,marker.longitude));
	var height = $("#map").height();
	var width = $("#map").width();
	var halfHeight = height/2.0;
	var halfWidth = width/2.0;

	var sizeFactor = Math.min(Math.abs(halfWidth/direction.x), Math.abs(halfHeight/direction.y));

	var arrowWidth= sizeFactor * direction.x +halfWidth;
	var arrowHeight= sizeFactor * (direction.y) + halfHeight;
	
	//translate y to bottom of image size
	arrowHeight-=iconSize[1]

	//allways in
	arrowWidth=Math.min(arrowWidth, width-iconSize[0]);
	arrowHeight=Math.max(arrowHeight, 0);

	//opacity deppending on relative distance
	var opacity = Math.max(0, 2 - direction.relativeDistance);

	//dummy fast way to chek if is on the top of right corner
	var imagePath=image;
	if(arrowWidth<=halfWidth && arrowHeight <= halfHeight && arrowWidth/width>arrowHeight/height) imagePath=imageNE;
	else if(arrowWidth>halfWidth && arrowHeight <= halfHeight) imagePath=imageNE;
	else if(arrowWidth>halfWidth && arrowHeight > halfHeight && arrowWidth/width>arrowHeight/height) imagePath=imageNE;

	if(this.$img.attr("src")!=imagePath)
		this.$img.attr("src", imagePath);
	this.$figure.css("top", arrowHeight+"px");
	this.$figure.css("left", arrowWidth+"px");
	this.$figure.css("opacity", opacity);
	
	return this.$figure;
}

// Utility Functions
// -------------------

// ##getDistanceFromCenterToCorner
// Returns the distance (in meters) from the center of the map to one corner
my.ggmaps.getDistanceFromCenterToCorner = function(map){
	var boundsNE=map.getBounds().getNorthEast();
	var mapCenter=map.getCenter();
	return my.math.haversine(boundsNE.lat(),boundsNE.lng(),mapCenter.lat(),mapCenter.lng());
}

//##getDirectionVector
// Calculates the direction vector from the center of the map, to a latlng. 
// Input:
// *map: google map
// *latlng1: google.maps.LatLng of the marker
// It returns:
// 	>{
// 	>	*x: (float) x component of the normalized direction vector
// 	>	*y: (float) y component of the normalized direction vector
// 	>	*distance: (float) distance in meters between the two points
// 	>	*relativeDistance: (float) division between the distance and the distance from the center of the map to a corner
// 	>}
my.ggmaps.getDirectionVector = function(map, latlng1){
	var mapCenter=map.getCenter();
	
	var mapCenter_pixel=map.getProjection().fromLatLngToPoint(mapCenter);
	var marker_pixel=map.getProjection().fromLatLngToPoint(latlng1);
	var result = my.math.getDirectionVector(marker_pixel, mapCenter_pixel);
	

	var distance=my.math.haversine(mapCenter.lat(), mapCenter.lng(), latlng1.lat(),latlng1.lng());
	result.distance = distance;

	var relativeDistance = distance / my.ggmaps.getDistanceFromCenterToCorner(map);
	result.relativeDistance = relativeDistance;

	return result;
}