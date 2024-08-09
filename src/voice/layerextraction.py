import requests
import xml.etree.ElementTree as ET

def fetch_wms_capabilities(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raises HTTPError for bad responses
        return response.content
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def parse_wms_capabilities(xml_content):
    tree = ET.ElementTree(ET.fromstring(xml_content))
    root = tree.getroot()

    # Define namespace for WMS
    namespaces = {
        'wms': 'http://www.opengis.net/wms'
    }

    layers = []

    for layer in root.findall('.//wms:Layer', namespaces):
        # Fetch name and title safely
        name_element = layer.find('wms:Name', namespaces)
        title_element = layer.find('wms:Title', namespaces)

        name = name_element.text if name_element is not None else 'No Name'
        title = title_element.text if title_element is not None else 'No Title'

        layers.append({'name': name, 'title': title})

    return layers

# Replace with your actual WMS URL
wms_url = 'https://ch-osm-services.geodatasolutions.ch/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities'
xml_content = fetch_wms_capabilities(wms_url)
if xml_content:
    layers = parse_wms_capabilities(xml_content)
    for layer in layers:
        print(f"name: '{layer['name']}', title: '{layer['title']}'")
