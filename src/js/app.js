import { addWMSLayers } from './wms_layers.js';

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
            center: ol.proj.fromLonLat([77.095, 28.643]), // Centered on Delhi
            zoom: 10
        })
    });

    addWMSLayers(map);

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
        [osm, osmHOT, satellite].forEach(l => l.setVisible(false));
        layer.setVisible(true);
        currentBaseLayer = layer;

        // Turn off WMS layers
        map.getLayers().forEach(l => {
            if (l.get('type') === 'wms') {
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
    
        const { action, place_name } = result;
    
        if (action === 'StandardMap') {
            showBaseLayer(osm);
        } else if (action === 'ReliefMap') {
            showBaseLayer(osmHOT);
        } else if (action === 'SatelliteMap') {
            showBaseLayer(satellite);
        } else if (action === 'BhuvanMap') {
            map.getLayers().forEach(layer => {
                if (layer.get('title') === 'Delhi LULC') {
                    showBaseLayer(layer);
                }
            });
        } else if (action === 'panToPlace') {
            panToPlace(place_name);
        } else if (action === 'addMarkerToPlace') {
            fetchPlaceInformation(place_name);
            addMarkerToPlace(place_name);
        } else if (action === 'showMyLocation') {
            showCurrentLocation();
        } else {
            console.log('Unknown action or no valid place name detected');
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
                const coords = ol.proj.fromLonLat([lon, lat]);

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
                    const coords = ol.proj.fromLonLat([lon, lat]);

                    map.getView().animate({center: coords, zoom: 10});
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
                const coords = ol.proj.fromLonLat([lon, lat]);
    
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
                    const { lon, lat } = suggestions[0]; // Use the first suggestion
                    const coords = ol.proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
                    map.getView().animate({ center: coords, zoom: 10 });
                    clearSuggestions(); // Clear any existing suggestions
                } else {
                    console.log('No suggestions found for the place.');
                }
            })
            .catch(error => {
                console.error('Error panning to place:', error);
            });
    }

    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var coords = ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
                map.getView().animate({ center: coords, zoom: 14 });

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
            const lonLat = ol.proj.toLonLat(coords);

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
