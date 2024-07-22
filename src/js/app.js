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

    var openTopoMap = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attributions: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
        }),
        title: 'Terrain Map',
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

    // Bhuvan WMTS Layer
    var bhuvanWMTS = new ol.layer.Tile({
        source: new ol.source.WMTS({
            url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/gwc/service/wmts/',
            layer: 'lulc:DL_LULC50K_1516',
            matrixSet: 'EPSG:4326',
            format: 'image/png',
            projection: 'EPSG:4326',
            tileGrid: new ol.tilegrid.WMTS({
                origin: [-180.0, 90.0],
                resolutions: [
                    0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125,
                    0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 
                    0.001373291015625, 0.0006866455078125, 0.00034332275390625, 
                    0.000171661376953125, 0.0000858306884765625, 0.00004291534423828125
                ],
                matrixIds: [
                    'EPSG:4326:0', 'EPSG:4326:1', 'EPSG:4326:2', 'EPSG:4326:3',
                    'EPSG:4326:4', 'EPSG:4326:5', 'EPSG:4326:6', 'EPSG:4326:7',
                    'EPSG:4326:8', 'EPSG:4326:9', 'EPSG:4326:10', 'EPSG:4326:11',
                    'EPSG:4326:12', 'EPSG:4326:13', 'EPSG:4326:14'
                ]
            })
        }),
        title: 'Bhuvan Land Use Land Cover',
        type: 'overlay'
    });

    // Create a map instance and add the layers
    var map = new ol.Map({
        target: 'map',
        layers: [osm, osmHOT, openTopoMap, satellite, bhuvanWMTS],
        view: new ol.View({
            center: ol.proj.fromLonLat([77.095, 28.643]), // Centered on Delhi
            zoom: 10 // Zoom level 10
        })
    });

    // Add a basic layer switcher control
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Layers' // Optional label for button
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

    recognition.addEventListener('result', (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        console.log('Command:', command);
        voiceBtn.textContent = '🎤 Click to speak';

        if (command.includes('standard map')) {
            map.getLayers().item(0).setVisible(true);
            map.getLayers().item(1).setVisible(false);
            map.getLayers().item(2).setVisible(false);
            map.getLayers().item(3).setVisible(false);
            bhuvanWMTS.setVisible(false);
        } else if (command.includes('relief map')) {
            map.getLayers().item(0).setVisible(false);
            map.getLayers().item(1).setVisible(true);
            map.getLayers().item(2).setVisible(false);
            map.getLayers().item(3).setVisible(false);
            bhuvanWMTS.setVisible(false);
        } else if (command.includes('terrain map')) {
            map.getLayers().item(0).setVisible(false);
            map.getLayers().item(1).setVisible(false);
            map.getLayers().item(2).setVisible(true);
            map.getLayers().item(3).setVisible(false);
            bhuvanWMTS.setVisible(false);
        } else if (command.includes('satellite map')) {
            map.getLayers().item(0).setVisible(false);
            map.getLayers().item(1).setVisible(false);
            map.getLayers().item(2).setVisible(false);
            map.getLayers().item(3).setVisible(true);
            bhuvanWMTS.setVisible(false);
        } else if (command.includes('bhuvan land use')) {
            bhuvanWMTS.setVisible(true);
        } else if (command.includes('hide bhuvan')) {
            bhuvanWMTS.setVisible(false);
        }
    });

    recognition.addEventListener('end', () => {
        voiceBtn.textContent = '🎤 Click to speak';
    });
});
