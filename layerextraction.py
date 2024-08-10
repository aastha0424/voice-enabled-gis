import asyncio
import json
import requests
import xml.etree.ElementTree as ET
from aiohttp import web
import os

# Function to fetch WMS capabilities
def fetch_wms_capabilities(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

# Function to parse WMS capabilities
def parse_wms_capabilities(xml_content):
    tree = ET.ElementTree(ET.fromstring(xml_content))
    root = tree.getroot()

    namespaces = {'wms': 'http://www.opengis.net/wms'}

    layers = []
    for layer in root.findall('.//wms:Layer', namespaces):
        name_element = layer.find('wms:Name', namespaces)
        title_element = layer.find('wms:Title', namespaces)

        name = name_element.text if name_element is not None else 'No Name'
        title = title_element.text if title_element is not None else 'No Title'

        layers.append({'name': name, 'title': title})

    return layers

# Function to save layers to a JSON file
def save_layers_to_json(layers, file_name='static/wms_layers.json'):
    os.makedirs(os.path.dirname(file_name), exist_ok=True)  # Ensure the static directory exists
    with open(file_name, 'w') as json_file:
        json.dump(layers, json_file, indent=4)
        print(f"Layer data saved to {file_name}")

# Web server setup using aiohttp
async def static_file_server():
    app = web.Application()

    # Serve files from the 'src' directory
    app.add_routes([web.static('/src', './src')])

    # Serve files from the 'static' directory
    app.add_routes([web.static('/static', './static')])

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 5500)
    await site.start()
    print("Static file server running on http://localhost:5500/")

    # Keep the server running
    await asyncio.Event().wait()

if __name__ == "__main__":
    wms_url = 'https://ch-osm-services.geodatasolutions.ch/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities&srsName=EPSG:2056'
    xml_content = fetch_wms_capabilities(wms_url)
    if xml_content:
        layers = parse_wms_capabilities(xml_content)
        save_layers_to_json(layers, file_name='static/wms_layers.json')  # Save to static directory

    # Start the static file server
    asyncio.run(static_file_server())
