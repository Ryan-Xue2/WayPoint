// Declare map as a global variable
let map;
let directions;
let currentPosition = null;
let targetDistance = -1;  
let routeDistance = -1;
let noNeed = false;
let loopPath = false;

// let coords = [];
// let sum = 0;
// let sumBack = 0;
 
/* MAPBOX API */

mapboxgl.accessToken = 'pk.eyJ1IjoibWF0cm93eSIsImEiOiJjbHdjNm91aHYwdG9uMmpwNTcxeXhqeWNwIn0.TjvcVEr5Zyn7Gu2H3bSnmw';


function setupMap(center){
        map = new mapboxgl.Map({
            container: 'map', // container ID
            style: 'mapbox://styles/mapbox/streets-v12', // style URL
            center: center, // starting position [lng, lat]
            zoom: 14, // starting zoom
        });
        
        directions = new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit: 'metric',
            profile: 'mapbox/cycling', // Prioritizes bike lanes and paths
            geometries: 'geojson',
            alternatives: true,
            radiuses: 'infinite',

        });

        
        map.addControl(directions, 'top-left');
    
        // Adds buttons to zoom in and zoom out at the bottom right of the screen
        const nav = new mapboxgl.NavigationControl();
        map.addControl(nav, 'bottom-right');   
    
        // TODO: Gets the map data in GeoJSON format when a route is found
        directions.on('route', (e) => {
            // if (loopPath) {
            //     routeDistance = e.route[0].distance / 1000
            //     if (Math.abs(routeDistance-targetDistance) / targetDistance > 0.05) {
            //         waypoint = directions.getWaypoints()[0]
            //         directions.removeWaypoint(0)
            //         directions.setDestination(waypoint.coords.longitude, waypoint.coords.latitude)
            //         generateLoop(targetDistance)
            //     }
            //     else {
            //         loopPath = false;
            //     }
            // }
            if (noNeed) {
                return
            }
            // alert('route found')
            // alert('test')

            routeDistance = e.route[0].distance / 1000
            // alert('hi')

            // If loop mode, check loop % error 
            let loopPath = loopToggle.checked
            console.log("Looppath is: ", loopPath)
            
            if (loopPath){
                if (Math.abs(routeDistance-targetDistance) / targetDistance > 0.05) {
                    for (i = 0; i < directions.getWaypoints().length; i++)
                        directions.removeWaypoint(i)  // Clear waypoints
                    generateLoop(targetDistance)
                } 
            }
            
            // If regular mode, check path % error

            else if (!loopPath) {
                if (Math.abs(routeDistance-targetDistance) / targetDistance > 0.05) {
                    generatePath(targetDistance)
                } 
            }
            
            else {
                noNeed = true;
            }
            // alert(e.route[0].distance)
            // console.log(e)
            // console.log(e.route)
            // console.log(e.route[0].geometry)  // encoded polyline thingy  // https://developers.google.com/maps/documentation/utilities/polylineutility
            
            // longInit = 0
            // latInit = 0
            // longDest = -80
            // latDest = 40
            // if (directions.getWaypoints().length == 0) {
            //     url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/'+longInit+'%2C'+latInit+'%3B'+longDest+'%2C'+latDest+'.json?geometries=geojson&alternatives=true&steps=true&overview=full&language=en&access_token=pk.eyJ1IjoibWF0cm93eSIsImEiOiJjbHdjNm91aHYwdG9uMmpwNTcxeXhqeWNwIn0.TjvcVEr5Zyn7Gu2H3bSnmw'
            // }
            // else {
            //     url = "https://api.mapbox.com/directions/v5/mapbox/cycling/-80.554%2C43.474%3B-80.5518977635979%2C43.42887542070156%3B-80.554%2C43.474.json?geometries=geojson&alternatives=true&steps=true&overview=full&language=en&access_token=pk.eyJ1IjoibWF0cm93eSIsImEiOiJjbHdjNm91aHYwdG9uMmpwNTcxeXhqeWNwIn0.TjvcVEr5Zyn7Gu2H3bSnmw"
            // }
            // fetch(url) 
            //     .then(response => {
            //         if (!response.ok) {
            //             throw new Error(':(')
            //         }
            //         return response.json()
            //     })
            //     .then(data => {
            //         console.log(data)
            //         coords = data.routes[0].geometry.coordinates
            //         sum = 0
            //         for (i=0; i<coords.length;i++) {
            //             // if (coords[0] == )
            //             sum += coords[0] + coords[1]
            //             // if (coords[0] )
            //         }
            //     })
        })
}


// Get the user's position
navigator.geolocation.getCurrentPosition(successLoc, errorLoc, {
    enableHighAccuracy: true
}) 
function successLoc(position) {
    console.log(position)
    currentPosition = position
    setupMap([position.coords.longitude, position.coords.latitude])
}
function errorLoc() {
    setupMap([127.510094,40.339851])
    alert("No Location Found")
}


// Function to generate a biking loop of a specified distance
function generatePath(distanceInKm) {
    for (i = 0; i < directions.getWaypoints().length; i++)
        directions.removeWaypoint(i)  // Clear waypoints

    noNeed = false
    
    targetDistance = distanceInKm
    // const center = map.getCenter() // Get the current center of the map
    // const coordinates = [center.lng, center.lat] // Get the longitude and latitude
    
    angle = Math.random() * 2.0 * Math.PI;
    currentOrigin = directions.getOrigin()

    // directions.addWaypoint([127.510094,40.339851]) 
    console.log(directions)
    
    let deltaLatitude = distanceInKm * Math.sin(angle) / 110.574
    // let deltaLongitude = distanceInKm * Math.cos(angle) / (111.32 * Math.cos((currentOrigin.geometry.coordinates[1]) * Math.PI / 180.0))
    
    
    // If no origin set, use current location as point A
    if (Object.keys(currentOrigin).length === 0) {
        let deltaLongitude = distanceInKm * Math.cos(angle) / 111.32 * Math.cos((currentPosition.coords.latitude + deltaLatitude) * Math.PI / 180.0)
        directions.setOrigin([currentPosition.coords.longitude, currentPosition.coords.latitude]);
        directions.setDestination([currentPosition.coords.longitude + deltaLongitude, currentPosition.coords.latitude + deltaLatitude])
    }

    // If origin set, use origin as point A

    else if (Object.keys(currentOrigin).length != 0) {
        let deltaLongitude = distanceInKm * Math.cos(angle) / 111.32 * Math.cos((currentOrigin.geometry.coordinates[1] + deltaLatitude) * Math.PI / 180.0)
        directions.setOrigin([currentOrigin.geometry.coordinates[0], currentOrigin.geometry.coordinates[1]]);
        directions.setDestination([currentOrigin.geometry.coordinates[0] + deltaLongitude, currentOrigin.geometry.coordinates[1] + deltaLatitude])
    }

    // If no origin set and no location permission, give error message
    else{
        alert("Please input a starting point")
    }
}

function generateLoop(distanceInKm) {
    
    targetDistance = distanceInKm / 3.5
    generatePath(targetDistance)
    
    // If generated path is close to 95% of targetDistance run the rest
    // Else, regenerate possible path

    // Remove all waypoints
    // Not sure why, but there are three waypoints if don't remove
    // Probably something to do with setting the destination when generating path
    for (i = 0; i < directions.getWaypoints().length; i++)
        directions.removeWaypoint(i)  // Clear waypoints

    // Create waypoints to form a right angle so that a loop is likely to be formed
    // Assumes that longitude and latitude can be approximated as x and y coordinates on a 2d plane  

    // Set waypoint at original destination
    wayPoint1 = directions.getDestination().geometry.coordinates
    directions.addWaypoint(0, wayPoint1)

    // Add second waypoint
    diffLong = wayPoint1[0] - directions.getOrigin().geometry.coordinates[0]
    diffLat = wayPoint1[1] - directions.getOrigin().geometry.coordinates[1]
    // Slope and slope of perpendicular line
    m1 = diffLat / diffLong
    m2 = -1/m1
    // Form a right angle with the waypoints
    // The two waypoints should form a corner of a square
    // diffLat is the "x-change" for waypoint2 because when right-triangle rotated 90 degrees, slope = -1/m
    // slope = y / x
    // new slope = -x / y
    wayPoint2 = [wayPoint1[0] + diffLat, wayPoint1[1] + diffLat * m2]  // Make an entirely different array because you can't have the same reference
    directions.addWaypoint(1, wayPoint2)

    targetDistance = distanceInKm
    
    
    currentOrigin = directions.getOrigin()
    directions.setDestination(currentOrigin.geometry.coordinates)
    console.log(directions.getWaypoints())
}

// Get references to input field and button
const pathDistanceInput = document.getElementById('pathDistance');
const generatePathButton = document.getElementById('generatePathButton');
const loopToggle = document.getElementById('loopCheckbox')

// Add event listener to button to generate loop
generatePathButton.addEventListener('click', function() {
    for (i = 0; i < directions.getWaypoints().length; i++)
        directions.removeWaypoint(i)  // Clear waypoints

    const distanceInKm = parseFloat(pathDistanceInput.value); // Get the loop distance from input field
    let loopPath = loopToggle.checked

    if (!isNaN(distanceInKm) && distanceInKm > 0) {
        if (loopPath) {
            generateLoop(distanceInKm);
            // noNeed = true;
        } // Call the generatePath function with the specified distance
        else generatePath(distanceInKm);
    } else {
        alert('Please enter a valid loop distance.');
    }
});


// Export GPX

function convertGeoJSONtoGPX(geojson) {
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gpx += '<gpx version="1.1" creator="Mapbox">\n';
    gpx += '<trk><trkseg>\n';

    geojson.coordinates.forEach(coord => {
        gpx += `<trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>\n`;
    });

    gpx += '</trkseg></trk>\n';
    gpx += '</gpx>';

    return gpx;
}

function downloadGPX(gpxData, filename) {
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
