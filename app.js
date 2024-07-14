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
            controls: {
                profileSwitcher: false
            }
        });

        
        map.addControl(directions, 'top-left');
    
        // Adds buttons to zoom in and zoom out at the bottom right of the screen
        const nav = new mapboxgl.NavigationControl();
        map.addControl(nav, 'bottom-right');   
    
        // TODO: Gets the map data in GeoJSON format when a route is found
        directions.on('route', (e) => {
            savedRoute = e
            if (noNeed) {
                return
            }
            // alert('route found')
            // alert('test')

            routeDistance = e.route[0].distance / 1000
            // alert('hi')

            // If loop mode, check loop % error 
            let loopPath = checkTripType()
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
            



        })
}
document.getElementById('exportButton').addEventListener('click', function() {
    try {
        if (savedRoute) {
            beginDownload(savedRoute);
        } else {
            throw new ReferenceError('No route found to download');
        }
    } catch (error) {
        alert("No route created");
    }
});

function beginDownload(e) {
    try{
        // Decode the encoded polyline manually
        const encodedPolyline = e.route[0].geometry;
        const decodedCoordinates = decodePolyline(encodedPolyline);

        // Convert decoded coordinates to GeoJSON LineString format
        const routeGeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: decodedCoordinates
            }
        };

        console.log("Route geometry (GeoJSON): ", routeGeoJSON);
        const gpxData = geoJSONtoGPX(routeGeoJSON);
        console.log("Route geometry (GPX): ", gpxData);
        downloadGPX(gpxData)
    }
    catch(ex){
        alert("No Route")
    }
}

// Function to decode an encoded polyline to coordinates
function decodePolyline(encoded) {
    let index = 0;
    const len = encoded.length;
    const polyline = [];
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        const point = [lng / 1e5, lat / 1e5];
        polyline.push(point);
    }

    return polyline;
}

function geoJSONtoGPX(geojson) {
    const gpx = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Your App">\n';
    const points = geojson.geometry.coordinates.map(coord => `<wpt lat="${coord[1]}" lon="${coord[0]}"></wpt>`).join('\n');
    return gpx + points + '\n</gpx>';
}


function downloadGPX(data) {
    console.log("download triggered");

    try {
        let filename = prompt("Enter the file name for the GPX file:", "");
        if (!filename) {
            alert("File name is required");
            return;
        }

        // Ensure the filename ends with .gpx
        if (!filename.toLowerCase().endsWith('.gpx')) {
            filename += '.gpx';
        }

        const blob = new Blob([data], { type: 'application/gpx+xml' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("download finished");
    } catch (error) {
        console.error("Error downloading GPX:", error);
    }
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
    let loopPath = checkTripType()

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


var loopbutton = document.getElementById('loopbutton-container')
var oneway = document.getElementById('oneway')
var roundtrip = document.getElementById('roundtrip')
var buttonTrack = document.getElementById('toggle-loop-button')

var where = document.getElementById('for-button')

var buttonState = true;

loopbutton.addEventListener('click', function(){
  if (buttonState) {
    document.getElementById("toggle-loop-button").style.transform = "translateX(100px)"; 
    buttonState = false;
    oneway.innerText = 'Round Trip'
    roundtrip.innerText = 'One Way'
    roundtrip.style.transform = "translateX(-90px)";
    where.value = 'roundtrip'
    buttonTrack.style.borderRadius = "0px 20px 20px 0px";
    
  } else {
    document.getElementById("toggle-loop-button").style.transform = "translateX(0px)";
    buttonState = true;
    oneway.innerText = 'One Way'
    roundtrip.innerText = 'Round Trip'
    roundtrip.style.transform = "translateX(0px)";
    where.value = 'oneway'
    buttonTrack.style.borderRadius = "20px 0px 0px 20px";
  }
    
})



function checkTripType() {
    if (where.value === 'roundtrip') {
        return (loopPath == false) // One Way is active
    } else {
        return (loopPath == true); // Round Trip is active
    }
}
