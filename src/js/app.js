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

    // Create a map instance and add the layers
    var map = new ol.Map({
        target: 'map',
        layers: [osm, osmHOT, openTopoMap, satellite],
        view: new ol.View({
            center: ol.proj.fromLonLat([72.5714, 23.0225]), // Centered on Ahmedabad
            zoom: 13 // Zoom level 13 (adjust as needed)
        })
    });

    // Add a basic layer switcher control
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Layers' // Optional label for button
    });
    map.addControl(layerSwitcher);
});
