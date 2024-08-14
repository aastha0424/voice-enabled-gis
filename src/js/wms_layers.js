// Define your projection here if needed
const projection = ol.proj.get('EPSG:4326'); // Example projection, adjust as needed
const tileSize = [256, 256];  // Example tile size, adjust as needed
const resolutions = [];
const maxResolution = ol.extent.getWidth(projection.getExtent()) / tileSize[0];
for (let i = 0; i < 18; ++i) {
    resolutions[i] = maxResolution / Math.pow(2, i);
}

const tileGrid = new ol.tilegrid.TileGrid({
    origin: [-180, 90],  // Ensure this matches your WMS layer's origin
    resolutions: resolutions,
    tileSize: tileSize
});

const layersConfig = {
    national_highway: {
        Title: "National Highway",
        id: "national_highway",
        isShow: true,
        type: "imageWMS",
        layerFactoryParams: {
            urlTemplate: "https://vedas.sac.gov.in/geoserver/vedas/wms",
            layerParams: {
                LAYERS: "vedas:INDIA_NHROADS",
                VERSION: '1.1.1',
                CRS: "EPSG:4326",
            },
            format: "image/png",
        },
        zIndex: 0,
        baseIndex: 150,
    },
    railway_tracks: {
        Title: "Railway Tracks",
        id: "railway_tracks",
        isShow: true,
        type: "imageWMS",
        layerFactoryParams: {
            urlTemplate: "https://vedas.sac.gov.in/geoserver/vedas/wms",
            layerParams: {
                LAYERS: "vedas:INDIA_RLWY_TRACKS",
                VERSION: '1.1.1',
                CRS: "EPSG:4326",
            },
            format: "image/png",
        },
        zIndex: 0,
        baseIndex: 150,
    },
    railway_stations: {
        Title: "Railway Stations",
        id: "railway_stations",
        isShow: true,
        type: "imageWMS",
        layerFactoryParams: {
            urlTemplate: "https://vedas.sac.gov.in/geoserver/vedas/wms",
            layerParams: {
                LAYERS: "vedas:INDIA_RLWY_STATIONS",
                VERSION: '1.1.1',
                CRS: "EPSG:4326",
            },
            format: "image/png",
        },
        zIndex: 0,
        baseIndex: 150,
    },
    airports: {
        Title: "Airports",
        id: "airports",
        isShow: true,
        type: "imageWMS",
        layerFactoryParams: {
            urlTemplate: "https://vedas.sac.gov.in/geoserver/vedas/wms",
            layerParams: {
                LAYERS: "vedas:INDIA_AIRPORTS",
                VERSION: '1.1.1',
                CRS: "EPSG:4326",
            },
            format: "image/png",
        },
        zIndex: 0,
        baseIndex: 150,
    }
};


// Function to add all WMS layers to the map
export function addWMSLayers(map) {
    Object.keys(layersConfig).forEach(layerKey => {
        const layerConfig = layersConfig[layerKey];

        // Ensure required parameters are available
        if (!layerConfig.layerFactoryParams || !layerConfig.layerFactoryParams.layerParams.LAYERS) {
            console.error(`Layer '${layerKey}' is missing required parameters.`);
            return;
        }

        const source = new ol.source.TileWMS({
            url: layerConfig.layerFactoryParams.urlTemplate,
            params: {
                'LAYERS': layerConfig.layerFactoryParams.layerParams.LAYERS,
                'VERSION': layerConfig.layerFactoryParams.layerParams.VERSION || '1.1.1',
                'CRS': layerConfig.layerFactoryParams.layerParams.CRS || 'EPSG:4326',
                'FORMAT': layerConfig.layerFactoryParams.format || 'image/png',
                // Include other params if needed
                ...layerConfig.layerFactoryParams.layerParams
            },
            tileSize: [256, 256], // or layerConfig.tileSize
            attributions: layerConfig.layerFactoryParams.attributions || ''
        });

        const layer = new ol.layer.Tile({
            source: source,
            title: layerConfig.Title, // Use Title for display
            visible: layerConfig.isShow || false,
            zIndex: layerConfig.zIndex || 0
        });

        map.addLayer(layer);
    });
}

//Function to add a WMS layer to the map
export function addWMSLayer(map, wmsUrl, layerName, title) {
    const wmsLayer = new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: wmsUrl,
            params: {
                'LAYERS': layerName,
                'FORMAT': 'image/png',
                'TILED': true
            },
            serverType: 'geoserver' // Adjust if necessary
        }),
        title: title,
        type: 'overlay'
    });
    map.addLayer(wmsLayer);
}

const bhuvanTileGrid = new ol.tilegrid.WMTS({
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
});

// Function to add Bhuvan layers
export function addBhuvanLayer(map, layerName, title) {
    const wmsLayer = new ol.layer.Tile({
        source: new ol.source.WMTS({
            url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/gwc/service/wmts/',
            layer: layerName,
            matrixSet: 'EPSG:4326',
            format: 'image/png',
            projection: 'EPSG:4326',
            tileGrid: bhuvanTileGrid,
            attributions: '© Bhuvan'
        }),
        title: title || layerName,
        type: 'overlay'
    });
    map.addLayer(wmsLayer);
}

export function addWMSBhuvanLayers(map) {
    // Add Bhuvan layers
    addBhuvanLayer(map, 'lulc:DL_LULC50K_1516', 'Delhi LULC');
    addBhuvanLayer(map, 'lulc:AS_LULC50K_1516', 'Assam LULC');
    addBhuvanLayer(map, 'geomorphology:HP_GM50K_0506', 'HP Geomorphology');
    addBhuvanLayer(map, 'lulc:UP_LULC50K_1516', 'UP LULC');

    // Add non-Bhuvan layers
}
// Function to add JSON layers to the map
export async function addJsonLayers(map) {
    try {
        const response = await fetch('/static/wms_layers.json');  // Path to your JSON file
        const jsonData = await response.json();

        jsonData.forEach(layer => {
            const wmsLayer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: 'https://ch-osm-services.geodatasolutions.ch/geoserver/ows?service=wms&version=1.3.0&request=GetMap',
                    params: {
                        'LAYERS': layer.layer,
                        'FORMAT': 'image/png',
                        'TILED': true
                    },
                    serverType: 'geoserver'
                }),
                title: layer.title,
                type: 'overlay'
            });
            map.addLayer(wmsLayer);
        });
    } catch (error) {
        console.error('Failed to load JSON layers:', error);
    }
}


