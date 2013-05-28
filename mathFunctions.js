window.my = window.my || {};
my.math = my.math || {};

if (typeof(Number.prototype.toRad) === "undefined") {
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}
}

//returns the distance in meters between two points
my.math.haversine = function (lat1,lng1,lat2,lng2){
	var R = 6371000;//m
	var dLat = (parseFloat(lat2)-parseFloat(lat1)).toRad();
	var dLon = (parseFloat(lng2)-parseFloat(lng1)).toRad();
	var lat1 = parseFloat(lat1).toRad();
	var lat2 = parseFloat(lat2).toRad();

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c;

	return d;
}

my.math.normalize = function (vector){
	var length = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y))
	return {
		x: vector.x/length,
		y: vector.y/length
	}
}

my.math.getDirectionVector = function (p0, p1){
	var diference={	
		x: p0.x - p1.x,	
		y: p0.y - p1.y
	};
	return my.math.normalize(diference);
}