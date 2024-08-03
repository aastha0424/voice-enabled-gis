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
    }

    recognition.addEventListener('result', (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        console.log('Command:', command);
        voiceBtn.textContent = '🎤 Click to speak';

        if (command.includes('standard map')) {
            showBaseLayer(osm);
        } else if (command.includes('relief map')) {
            showBaseLayer(osmHOT);
        } else if (command.includes('satellite map')) {
            showBaseLayer(satellite);
        } else if (command.includes('bhuvan map')) {
            map.getLayers().forEach(layer => {
                if (layer.get('title') === 'Bhuvan Land Use Land Cover') {
                    showBaseLayer(layer);
                }
            });
        } else if (command.includes('hide bhuvan')) {
            map.getLayers().forEach(layer => {
                if (layer.get('title') === 'Bhuvan Land Use Land Cover') {
                    layer.setVisible(false);
                }
            });
        }
    });

    recognition.addEventListener('end', () => {
        voiceBtn.textContent = '🎤 Click to speak';
    });

    function fetchPlaceSuggestions(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    displaySuggestions(data);
                } else {
                    clearSuggestions();
                }
            })
            .catch(error => {
                console.error('Error fetching place suggestions:', error);
            });
    }

    function displaySuggestions(suggestions) {
        const suggestionBox = document.createElement('div');
        suggestionBox.id = 'suggestion-box';
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.backgroundColor = 'white';
        suggestionBox.style.border = '1px solid #ccc';
        suggestionBox.style.maxHeight = '200px';
        suggestionBox.style.overflowY = 'auto';
        suggestionBox.style.width = '100%';
        suggestionBox.style.zIndex = 1000;

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

    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const { latitude, longitude } = position.coords;
                    const coordinates = ol.proj.fromLonLat([longitude, latitude]);

                    map.getView().setCenter(coordinates);
                    map.getView().setZoom(12);

                    const userLocationFeature = new ol.Feature({
                        geometry: new ol.geom.Point(coordinates)
                    });

                    const userLocationLayer = new ol.layer.Vector({
                        source: new ol.source.Vector({
                            features: [userLocationFeature]
                        }),
                        style: new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 7,
                                fill: new ol.style.Fill({ color: 'red' }),
                                stroke: new ol.style.Stroke({ color: 'black', width: 2 })
                            })
                        })
                    });

                    map.getLayers().forEach(layer => {
                        if (layer instanceof ol.layer.Vector) {
                            map.removeLayer(layer);
                        }
                    });

                    map.addLayer(userLocationLayer);
                },
                function (error) {
                    console.error('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    document.getElementById('show-location').addEventListener('click', showCurrentLocation);

    // Marker functionality
    let markerMode = false;

    const markerSource = new ol.source.Vector();
    const markerLayer = new ol.layer.Vector({
        source: markerSource,
        style: new ol.style.Style({
            image: new ol.style.Icon({
                src: 'https://openlayers.org/en/latest/examples/data/icon.png',
                scale: 0.5 // Adjust the size of the icon
            })
        })
    });

    map.addLayer(markerLayer);

    document.getElementById('toggle-marker').addEventListener('click', () => {
        markerMode = !markerMode;
        document.getElementById('toggle-marker').textContent = markerMode ? 'Marker Mode: ON' : 'Marker Mode: OFF';
    });

    let clickTimeout = null;

    map.on('click', function (evt) {
        if (!markerMode) return;
        
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        } else {
            clickTimeout = setTimeout(() => {
                const coordinates = evt.coordinate;
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(coordinates)
                });

                markerSource.addFeature(feature);
                clickTimeout = null;
            }, 300); // Delay for distinguishing between single and double click
        }
    });

    map.on('dblclick', function (evt) {
        evt.preventDefault(); // Prevent default zoom on double-click

        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }

        const features = map.getFeaturesAtPixel(evt.pixel);
        if (features.length) {
            features.forEach(feature => {
                markerSource.removeFeature(feature);
            });
        }
    });

    // Add event listener to clear suggestion box when clicking outside
    document.addEventListener('click', (event) => {
        const suggestionBox = document.getElementById('suggestion-box');
        if (suggestionBox && !suggestionBox.contains(event.target) && event.target.id !== 'search-input') {
            clearSuggestions();
        }
    });
});
