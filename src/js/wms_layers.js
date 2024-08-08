// wms_layers.js
const commonTileGrid = new ol.tilegrid.WMTS({
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
export const wmsLayers = [
    {
        title: 'Delhi LULC',
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
        }),
        params: {
            'LAYERS': 'lulc:DL_LULC50K_1516',
            'FORMAT': 'image/png'
        },
        attributions: '© Bhuvan'
    },
    {
        title: 'Assam LULC',
        url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/gwc/service/wmts/',
        layer: 'lulc:AS_LULC50K_1516',
        matrixSet: 'EPSG:4326',
        format: 'image/png',
        projection: 'EPSG:4326',
        tileGrid: commonTileGrid,
        params: {
            'LAYERS': 'lulc:AS_LULC50K_1516',
            'FORMAT': 'image/png'
        },
        attributions: '© Bhuvan'
    },
    {
        title: 'HP Geomorphology',
        url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/gwc/service/wmts/',
        layer: 'geomorphology:HP_GM50K_0506',
        matrixSet: 'EPSG:4326',
        format: 'image/png',
        projection: 'EPSG:4326',
        tileGrid: commonTileGrid,
        params: {
            'LAYERS': 'geomorphology:HP_GM50K_0506',
            'FORMAT': 'image/png'
        },
        attributions: '© Bhuvan'
    }
    // Add more WMS layers here as needed
];



export function addWMSLayers(map) {
    wmsLayers.forEach(layerConfig => {
        const wmsLayer = new ol.layer.Tile({
            source: new ol.source.WMTS({
                url: layerConfig.url,
                layer: layerConfig.layer,
                matrixSet: layerConfig.matrixSet,
                format: layerConfig.format,
                projection: layerConfig.projection,
                tileGrid: layerConfig.tileGrid,
                attributions: layerConfig.attributions
            }),
            title: layerConfig.title,
            type: 'overlay'
        });
        map.addLayer(wmsLayer);
    });
}
