//import { addWMSBhuvanLayers } from './wms_layers.js';
import { addWMSLayers } from './wms_layers.js';
//import { addWMSLayer } from './wms_layers.js';
//import { addJsonLayers } from './wms_layers.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log("Voice-Enabled GIS Application");

    // Define the tile layers
    var osm = new ol.layer.Tile({
        source: new ol.source.OSM(),
        title: 'Standard Map',
        type: 'base'
    });

    var osmHOT = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
        }),
        title: 'Relief Map',
        type: 'base'
    });

    var satellite = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attributions: '© Esri'
        }),
        title: 'Satellite Map',
        type: 'base'
    });

    var map = new ol.Map({
        target: 'map',
        layers: [osm, osmHOT, satellite],
        view: new ol.View({
            projection: 'EPSG:4326',  // Ensure the projection matches your WMS layers
            center: [77.095, 28.643], // Coordinates in EPSG:4326 (Longitude, Latitude)
            zoom: 10
        })
    });
    addWMSLayers(map);
    //addWMSBhuvanLayers(map);
    //addJsonLayers(map)
    // Adding a WMS layer with specific parameters
    //addWMSLayer(map, 'https://ch-osm-services.geodatasolutions.ch/geoserver/ows?service=wms&version=1.3.0&request=GetMap', 'magosm:highways_line', 'Highways Line');



    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Layers'
    });
    map.addControl(layerSwitcher);

    // Web Speech API for voice recognition
    const voiceBtn = document.getElementById('voiceBtn');
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.textContent = 'Listening...';
    });

    let currentBaseLayer = null;

    function showBaseLayer(layer) {
        // Turn off all base layers
        const baseLayers = [osm, osmHOT, satellite, ...map.getLayers().getArray().filter(l => ['OpenRailwayMap', 'OpenTopoMap'].includes(l.get('title')))];

        // Hide all base layers
        baseLayers.forEach(l => l.setVisible(false));
        
        // Make the selected base layer visible
        layer.setVisible(true);
        currentBaseLayer = layer;
    
        // Turn off all WMS and overlay layers, including those from wmsLayerDatabase
        map.getLayers().forEach(l => {
            if (l.get('type') === 'wms' || l.get('type') === 'overlay') {
                l.setVisible(false);
            }
        });
    }
    

    // Establish WebSocket connection to the Python server
    const socket = new WebSocket('ws://localhost:7890');

socket.onopen = () => {
    console.log('Connected to the server');
};

socket.onmessage = (event) => {
    const result = JSON.parse(event.data);
    console.log('Received result from server:', result);

    
    const { action, place_name, view } = result;

    if (action === 'turn on') {
        // Handle 'turn on' actions for different views
        if (view === 'StandardMap') {
            showBaseLayer(osm);
        } else if (view === 'ReliefMap') {
            showBaseLayer(osmHOT);
        } else if (view === 'SatelliteMap') {
            showBaseLayer(satellite);
        } else if (view === 'railway_track') {
            showLayerByTitle('Railway Tracks');
        } else if (view === 'railway_station') {
            showLayerByTitle('Railway Station');
        } else if (view === 'national_highways') {
            showLayerByTitle('National Highway');
        } else if (view === 'airport') {
            showLayerByTitle('Airports');
        } else {
            console.log('View not recognized or handled:', view);
        }
    } else if (action === 'turn off') {
        // Handle 'turn off' actions for different views
        if (view === 'StandardMap') {
            hideBaseLayer(osm);
        } else if (view === 'ReliefMap') {
            hideBaseLayer(osmHOT);
        } else if (view === 'SatelliteMap') {
            hideBaseLayer(satellite);
        } else if (view === 'railway_track') {
            hideLayerByTitle('Railway Tracks');
        } else if (view === 'railway_station') {
            hideLayerByTitle('Railway Station');
        } else if (view === 'national_highways') {
            hideLayerByTitle('National Highway');
        } else if (view === 'airport') {
            hideLayerByTitle('Airports');
        } else {
            console.log('View not recognized or handled:', view);
        }
    } else if (action === 'zoomIn') {
        if (place_name === 'unknown') {
            zoomIn(); // Zoom in from the current view
        } else {
            // Zoom in to a specific location
            fetchPlaceInformation(place_name);
            zoomIn();
        }
    } else if (action === 'zoomOut') {
        if (place_name === 'unknown') {
            zoomOut(); // Zoom out from the current view
        } else {
            // Zoom out from a specific location
            fetchPlaceInformation(place_name);
            zoomOut();
        }
    } else if (action === 'panToPlace') {
        if (place_name === 'unknown') {
            alert('Action not location is unknown');
        } else {
            panToPlace(place_name);
        }
    } else if (action === 'addMarkerToPlace') {
        if (place_name === 'unknown') {
            alert('Action not location is unknown');
        } else {
            fetchPlaceInformation(place_name);
            addMarkerToPlace(place_name);
        }
    } else if (action === 'showMyLocation') {
        showCurrentLocation();
    } else {
        alert('Action not determined');
    }
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

socket.onclose = () => {
    console.log('Disconnected from the server');
};

    // Voice recognition event listener
    recognition.addEventListener('result', (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        console.log('Command:', command);
        voiceBtn.textContent = '🎤 Click to speak';

        // Send the command to the WebSocket server
        socket.send(command);
    });

    recognition.addEventListener('end', () => {
        voiceBtn.textContent = '🎤 Click to speak';
    });

    function showLayerByTitle(title) {
        map.getLayers().forEach(layer => {
            if (layer.get('title') === title) {
                layer.setVisible(true);
            } else {
                layer.setVisible(false);
            }
        });
    }
    

    function fetchPlaceSuggestions(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    displaySuggestions(data);
                } else {
                    clearSuggestions();
                    console.log('No suggestions found.');
                }
                return data; // Ensure to return data for further chaining
            })
            .catch(error => {
                console.error('Error fetching place suggestions:', error);
                clearSuggestions(); // Clear suggestions in case of an error
            });
    }

    function displaySuggestions(suggestions) {
        clearSuggestions(); // Clear any existing suggestions

        if (suggestions.length === 0) {
            console.log('No suggestions available');
            return;
        }

        const suggestionBox = document.createElement('div');
        suggestionBox.id = 'suggestion-box';
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.backgroundColor = 'white';
        suggestionBox.style.border = '1px solid #ccc';
        suggestionBox.style.maxHeight = '200px';
        suggestionBox.style.overflowY = 'auto';
        suggestionBox.style.width = '100%';
        suggestionBox.style.zIndex = 1000;

        console.log(`Displaying ${suggestions.length} suggestions`);

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion.display_name;
            item.onclick = () => {
                const lon = parseFloat(suggestion.lon);
                const lat = parseFloat(suggestion.lat);
                const coords = [lon, lat];

                map.getView().animate({center: coords, zoom: 10});
                clearSuggestions();
            };
            suggestionBox.appendChild(item);
        });

        const searchBar = document.getElementById('search-bar');
        searchBar.appendChild(suggestionBox);
    }

    function clearSuggestions() {
        const suggestionBox = document.getElementById('suggestion-box');
        if (suggestionBox) {
            suggestionBox.remove();
        }
    }

    document.getElementById('search-input').addEventListener('input', () => {
        const query = document.getElementById('search-input').value;
        if (query) {
            fetchPlaceSuggestions(query);
        } else {
            clearSuggestions();
        }
    });

    document.getElementById('search-button').addEventListener('click', () => {
        const query = document.getElementById('search-input').value;
        if (query) {
            fetchPlaceInformation(query);
        }
    });

    function fetchPlaceInformation(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const place = data[0];
                    const lon = parseFloat(place.lon);
                    const lat = parseFloat(place.lat);
    
                    // Use EPSG:4326 coordinates directly if the map view is set to EPSG:4326
                    map.getView().animate({ center: [lon, lat], zoom: 10 });
                } else {
                    alert('No information found');
                }
            })
            .catch(error => {
                console.error('Error fetching place information:', error);
            });
    }
    

    function fetchPlaceInformationp(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    return data[0]; // Return the first result
                } else {
                    throw new Error('No place information found');
                }
            })
            .catch(error => {
                console.error('Error fetching place information:', error);
                throw error; // Re-throw the error to be caught in the calling function
            });
    }
    
    function addMarkerToPlace(placeName) {
        fetchPlaceInformationp(placeName)
            .then(place => {
                const lon = parseFloat(place.lon);
                const lat = parseFloat(place.lat);
                const coords = [lon, lat];
    
                // Add the marker to the map
                const markerFeature = new ol.Feature({
                    geometry: new ol.geom.Point(coords)
                });
    
                markerSource.addFeature(markerFeature);
    
                // Optionally, set a style for the marker
                const markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
                        scale: 0.5
                    })
                });
    
                markerFeature.setStyle(markerStyle);
            })
            .catch(error => {
                console.error('Error adding marker:', error);
            });
    }

    function panToPlace(placeName) {
        fetchPlaceSuggestions(placeName)
            .then(suggestions => {
                if (suggestions.length > 0) {
                    // Use the first suggestion
                    const suggestion = suggestions[0];
                    const lon = parseFloat(suggestion.lon);
                    const lat = parseFloat(suggestion.lat);
    
                    // Use EPSG:4326 coordinates directly if the map is in EPSG:4326
                    map.getView().animate({
                        center: [lon, lat],
                        zoom: 10
                    });
                    clearSuggestions(); // Clear any existing suggestions
                } else {
                    console.log('No suggestions found for the place.');
                }
            })
            .catch(error => {
                console.error('Error panning to place:', error);
            });
    }
    
    function hideBaseLayer(layer) {
        const layers = map.getLayers().getArray();
        const baseLayer = layers.find(l => l === layer);
        if (baseLayer) {
            baseLayer.setVisible(false);
            console.log('Base layer hidden:', layer);
        } else {
            console.log('Base layer does not exist:', layer);
        }
    }
    
    function handleCommand(command) {
        const action = command.action; // Extract the action from the command
        const view = command.view; // Extract the view (layer name) from the command
    
        if (action === 'turn on') {
            turnOnLayer(view); // Call the function to turn on the layer
        } else if (action === 'turn off') {
            turnOffLayer(view); // Call the function to turn off the layer
        } else {
            console.log('Unknown action:', action);
            // Handle other actions...
        }
    }

    // Function to turn on a layer
function turnOnLayer(layerName) {
    const layers = map.getLayers().getArray();
    const layer = layers.find(layer => layer.get('name') === layerName);
    if (layer) {
        layer.setVisible(true);
        console.log(`${layerName} layer turned on`);
    } else {
        console.log(`${layerName} layer does not exist`);
    }
}

// Function to turn off a layer
function turnOffLayer(layerName) {
    const layers = map.getLayers().getArray();
    const layer = layers.find(layer => layer.get('name') === layerName);
    if (layer) {
        layer.setVisible(false);
        console.log(`${layerName} layer turned off`);
    } else {
        console.log(`${layerName} layer does not exist`);
    }
}
  
    

    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lon = position.coords.longitude;
                const lat = position.coords.latitude;
                const coords = [lon, lat];
            
                // Directly use coordinates if the map view is in EPSG:4326
                map.getView().animate({
                    center: [lon, lat], // Coordinates in EPSG:4326
                    zoom: 14
                });

                const locationMarker = new ol.Feature({
                    geometry: new ol.geom.Point(coords)
                });

                locationMarker.setStyle(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
                        scale: 0.5
                    })
                }));

                markerSource.clear(); // Clear existing markers
                markerSource.addFeature(locationMarker);

                // Add "My Location" layer if not already added
                if (!map.getLayers().getArray().includes(locationLayer)) {
                    map.addLayer(locationLayer);
                }

                locationLayer.setVisible(true); // Ensure it's visible

            }, function(error) {
                console.error('Error retrieving location:', error);
                alert('Unable to retrieve your location');
            });
        } else {
            alert('Geolocation is not supported by your browser');
        }
    }
    document.getElementById('show-location').addEventListener('click', () => {
        showCurrentLocation();
    });
    // Function to zoom in from the current view
    function zoomIn() {
    const view = map.getView();
    const zoom = view.getZoom();
    view.setZoom(zoom + 1);
    }

    

    // Function to zoom out from the current view
    function zoomOut() {
        const view = map.getView();
        const zoom = view.getZoom();
        view.setZoom(zoom - 1);
    }

    // "My Location" Layer
    const locationLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        title: 'My Location'
    });
    // Initialize marker source and layer
    const markerSource = new ol.source.Vector();
    const markerLayer = new ol.layer.Vector({
    source: markerSource
    });
    map.addLayer(markerLayer);
    map.on('dblclick', function(event) {
    const pixel = event.pixel;
    console.log('Double-click pixel:', pixel); // Debugging line

    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer === markerLayer) {
            console.log('Removing feature:', feature); // Debugging line

            // Remove the feature
            markerSource.removeFeature(feature);

            // Verify if the feature was removed
            if (!markerSource.getFeatures().includes(feature)) {
                console.log('Feature successfully removed.');
            } else {
                console.log('Feature was not removed.');
            }

            return true; // Stop iteration after removing the feature
        }
    });
});

    

    // Add double-click event to remove markers
    map.getInteractions().forEach(function(interaction) {
        if (interaction instanceof ol.interaction.DoubleClickZoom) {
            map.removeInteraction(interaction);
        }
    });

    
    // Marker mode toggle
    let markerMode = false;
    const markerToggleBtn = document.getElementById('toggle-marker');
    markerToggleBtn.addEventListener('click', () => {
        markerMode = !markerMode;
        markerToggleBtn.textContent = markerMode ? 'Disable Marker Mode' : 'Enable Marker Mode';
    });

    map.on('click', function(event) {
        if (markerMode) {
            const coords = map.getCoordinateFromPixel(event.pixel);
            
            // Add marker at the clicked location
            const markerFeature = new ol.Feature({
                geometry: new ol.geom.Point(coords)
            });

            markerSource.addFeature(markerFeature);

            const markerStyle = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'https://openlayers.org/en/latest/examples/data/icon.png',
                    scale: 0.5
                })
            });

            markerFeature.setStyle(markerStyle);
        }
    });
    function clearSuggestions() {
    const suggestionBox = document.getElementById('suggestion-box');
    if (suggestionBox) {
        suggestionBox.remove();
    }
}

document.addEventListener('click', function(event) {
    if (!document.getElementById('search-bar').contains(event.target)) {
        clearSuggestions();
    }
});
function clearSuggestions() {
    const suggestionBox = document.getElementById('suggestion-box');
    if (suggestionBox) {
        suggestionBox.remove();
    }
}

document.addEventListener('click', function(event) {
    if (!document.getElementById('search-bar').contains(event.target)) {
        clearSuggestions();
    }
});



});
//new file
