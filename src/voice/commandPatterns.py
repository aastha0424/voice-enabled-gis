import re
import spacy
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import pandas as pd
from groq import Groq
from groq import Client 
import json

# Load spaCy's English model
nlp = spacy.load('en_core_web_sm')

# Initialize geolocator
geolocator = Nominatim(user_agent="geoapiExercises")

# Initialize the Groq client with your API key
client = Client(
    api_key="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"
)

# Load the Indian cities dataset
cities_df = pd.read_csv(r'src\voice\Indian Cities Database.csv')
indian_cities = set(cities_df['City'].str.lower().tolist())
indian_states = set(cities_df['State'].str.lower().tolist())

def get_location_from_database(location):
    """Check if the location exists in the Indian cities database."""
    return location.lower() if location.lower() in indian_cities or location.lower() in indian_states else None

def get_location_name(location):
    """Use geopy to attempt to find the location if it's not in the database."""
    try:
        location_info = geolocator.geocode(location, timeout=10)
        if location_info:
            address_parts = location_info.address.split(',')
            if address_parts:
                return address_parts[0].strip()  # Return the first part of the address
    except GeocoderTimedOut:
        # Retry on timeout
        return get_location_name(location)
    except Exception as e:
        print(f"Geocoding error: {e}")
    return location

def extract_location(command):
    """Extract and resolve location from the command using spaCy, regex, and geocoder, and check the database if necessary."""
    doc = nlp(command)

    location_name = None  # Initialize to None

    # Extract locations using spaCy
    for ent in doc.ents:
        if ent.label_ in ['GPE', 'LOC']:
            location_name = ent.text
            break

    # If spaCy fails, try to use regex
    if not location_name:
        # Regex to match multi-word locations that are not prefixed by specific keywords
        location_fallback = re.findall(r'\b(?:in|to|into|at|of|show\s+me|show\s+location\s+of|go\s+to)\b\s+([A-Za-z\s]+)', command)
        if location_fallback:
            location_name = ' '.join(location_fallback).strip()
        else:
            # Regex to capture multi-word locations directly mentioned
            location_fallback = re.findall(r'\b([A-Za-z\s]+)\b', command)
            if location_fallback:
                location_name = ' '.join(location_fallback).strip()

    # Normalize the location name to lowercase
    if location_name:
        location_name = location_name.lower()

        # Check if location_name is in the database
        location_from_database = get_location_from_database(location_name)
        if location_from_database:
            return location_from_database

        # If not found in the database, try geopy
        location_from_geopy = get_location_name(location_name)
        return location_from_geopy

    # Final database check if no location identified
    words = re.findall(r'\b\w+\b', command.lower())
    for word in words:
        location_from_database = get_location_from_database(word)
        if location_from_database:
            return location_from_database

    print("No location found")  # Debug statement
    return None

def identify_command_with_groq(command):
    """Use Groq LLM to analyze the command and identify action, place_name, and view."""
    prompt = f"""
    Analyze the following command and identify the view, action, and place_name described. 
    
- If the command involves actions related to moving to a specific place (e.g., "pantoplace, go, going, see, navigate, etc."), return the action as "panToPlace" and the identified place_name.
- If the command is about showing the user's location (e.g., "show my location"), return the action as "showMyLocation" and no place_name.
- If the command is about adding a marker (e.g., "addMarkerToPlace"), return the action as "add marker" and include the location if specified.
- If the command includes any layers ("satellite map", "relief map", "airport", "railway_track", "national_highways", "railway_station"), prioritize identifying the view if the command includes any type of layer.
- If the command includes any type of layer (e.g., "satellite map, relief map, etc."), return the action and view as follows:
  - For actions like "turn on," "open," or "show," return action as "turn on" and the specific view (e.g., "SatelliteMap").
  - For actions like "turn off," "close," or "hide," return action as "turn off" and the specific view (e.g., "SatelliteMap").
- If place_name is not specified, return None.
- If the command contains "show me," check for the view and location. If a view is specified, return action as "turn on"; if place_name is specified, return action as "panToPlace," otherwise return "showMyLocation."
- If the command includes any actions related to a specific layer (e.g., "satellite map," "railway_track," etc.), return the action (e.g., "turn on," "turn off") and view as the specific layer.
- If the command includes any action related to railway tracks, return action as "turn on" or "turn off" and view as "railway_track."
- If the command includes any action related to railway stations, return action as "turn on" or "turn off" and view as "railway_station."
- If the command includes any action related to national highways, return action as "turn on" or "turn off" and view as "national_highways."
- If the command includes any action related to airports, return action as "turn on" or "turn off" and view as "airport."
- If the command contains "airport," then place_name can never be "airport."
- If the command contains "switch to" any layer, then action is "turn on" and view is the specific layer.
- If the command contains actions related to "turn on" any layer, then action is "turn on" and view is the specific layer.
- If the command contains actions related to "show" any layer, then action is "turn on" and view is the specific layer.
- If the command contains actions related to "turn off" or "close" any layer, then action is "turn off" and view is the specific layer.
- If the command contains actions related to "zoom in" or "zoom out," then action is "zoomIn" or "zoomOut" and the place_name is the location to zoom to.
- If the command contains actions related to zoom, then action is "zoomIn" or "zoomOut" and if place_name is specified return the location but if not return showMyLocation.



    Command:
    "{command}"

    Provide the output in the following format:
    - Action: <action>
    - place_name: <location (if applicable)>
    - View: <view (if applicable)>

    Ensure that:
    1. The action is correctly identified based on the command's context.
    2. The location is extracted if the command specifies a place.
    3. The view is clearly identified if applicable.
    """

    response = client.complete(prompt=prompt, temperature=0.7, max_tokens=150) 

    # Process the response
    result_text = response.get('choices')[0].get('text').strip()
    try:
        parsed_result = json.loads(result_text)  # Assuming the response is a JSON string
    except json.JSONDecodeError:
        print("Error decoding JSON from Groq response.")
        parsed_result = {'Action': 'None', 'place_name': None, 'View': None}

    return parsed_result

def split_commands(command):
    """Split the command into individual actions based on common delimiters."""
    # Define delimiters or keywords to split commands
    delimiters = r'(?:;|,|\band\b|\bthen\b)'
    split_commands = re.split(delimiters, command)
    return [cmd.strip() for cmd in split_commands if cmd.strip()]

def identify_command(command):
    """Identify command using rule-based approach first, fallback to Groq if needed."""
    # Convert command to lowercase for easier matching
    commands = split_commands(command)
    results = []

    for cmd in commands:
        result = {}
        # Convert command to lowercase for easier matching
        lower_command = cmd.lower()
    
    # Define patterns and corresponding actions
    patterns = {
        'StandardMap': [
            r'standard map|show standard view|set view to standard|default map|normal map|regular map|switch map to standard view|switch to standard map|switch to standard view|standard view'
        ],
        'ReliefMap': [
            r'relief map|show relief view|set view to relief|topographic map|terrain map|elevation map|switch map to relief view|switch to relief map|switch to relief view|relief view'
        ],
        'SatelliteMap': [
            r'satellite map|show satellite view|set view to satellite|aerial view|satellite imagery|overhead view|switch map to satellite view|switch to satellite map|switch to satellite view|satellite view'
        ],
        'panToPlace': [
            r'focus on|take me to|show me|pan to|navigate to|set view to|move to|go|display|center on|move map to|locate on|locate to|shift to|move towards|find|zoom to|direct me to|show location of|take map to'
        ],
        'addMarkerToPlace': [
            r'add marker to|mark|place marker at|pin|drop pin at|set marker at|add pin|create marker|point|flag this place|put a marker|put a pin|add a marker|place a pin|drop a marker|mark this spot|tag this location|tag'
        ],
        'showMyLocation': [
            r'show my location|where am i|show me where i am|current location|locate me|find my location|where is my position|my current location|find my current spot'
        ],
        'zoomIn': [
            r'zoom in to [a-zA-Z\s]+|zoom in|increase zoom|zoom closer|magnify|enlarge|tighten view|focus closer|come closer|bring in closer|magnified|shrink|enhance|move closer|pull out|pull in'
        ],
        'zoomOut': [
            r'zoom out from [a-zA-Z\s]+|zoom out|decrease zoom|zoom farther|reduce zoom|widen view|pull back|zoom away|back off|wide view'
        ],
        'DelhiLULC': [
            r'delhi lulc|show delhi lulc|delhi land use|delhi land cover|delhi map|show delhi land use|show delhi land cover|switch to delhi lulc|show the land use in delhi'
        ],
        'UPLULC': [
            r'up lulc|show up lulc|up land use|up land cover|up map|show up land use|show up land cover|switch to up lulc|show the land use in uttar pradesh'
        ],
        'AssamLULC': [
            r'assam lulc|show assam lulc|assam land use|assam land cover|assam map|show assam land use|show assam land cover|switch to assam lulc'
        ],
        'HPLULC': [
            r'hp lulc|show hp lulc|hp land use|hp land cover|hp map|show hp land use|show hp land cover|switch to hp lulc'
        ],
        'HPGeomorphology': [
            r'hp geomorphology|show hp geomorphology|hp landforms|hp geology|hp map|show hp geomorphology|show hp landforms|show hp geology|switch to hp geomorphology'
        ],
        'airport':[
            r'airport|show airport|airport map|show airport location|airport view|airport area|airport place|airport on map|airport on screen|airport location|airport spot|airport point|airport view|airport'
        ],
        'railway_track':[
            r'railway track|show railway track|railway track map|show railway track location|railway track view|railway track area|railway track place|railway track on map|railway track on screen|railway track location|railway track spot|railway track point|railway track view|railway track'
        ],
        'national_highways':[
            r'national highways|show national highways|national highways map|show national highways location|national highways view|national highways area|national highways place|national highways on map|national highways on screen|national highways location|national highways spot|national highways point|national highways view|national highways'
        ],
        'railway_station':[
            r'railway station|show railway station|railway station map|show railway station location|railway station view|railway station area|railway station place|railway station on map|railway station on screen|railway station location|railway station spot|railway station point|railway station view|railway station'
        ]

    }
    
    # Check for specific layers or maps first
    for layer in ['satellite', 'relief', 'standard', 'airport', 'railway_track', 'national_highways', 'railway_station']:
        if layer in lower_command:
            if 'turn off' in lower_command or 'close' in lower_command or 'hide' in lower_command or 'disable' in lower_command:
                return {'action': 'turn off', 'view': f'{layer.capitalize()}Map'}
            elif 'turn on' in lower_command or 'open' in lower_command or 'show' in lower_command or 'enable' in lower_command:
                return {'action': 'turn on', 'view': f'{layer.capitalize()}Map'}
            
    # Check for base layer commands first
    for view, regex_list in patterns.items():
        if view not in ['panToPlace', 'zoomIn', 'zoomOut']:
            for regex in regex_list:
                if re.search(regex, lower_command):
                    return {'action': 'turn on', 'view': view}

    # Check for zoom commands
    for action in ['panToPlace', 'zoomIn', 'zoomOut']:
        regex_list = patterns.get(action, [])
        for regex in regex_list:
            if re.search(regex, lower_command):
                location = extract_location(command)
                result['action'] = action
                result['place_name'] = location if location else 'unknown'
                return result

    # Check for other commands if no base layer or zoom command matched
    for action, regex_list in patterns.items():
        if action not in ['satellite map', 'relief map', 'standard map', 'airport', 'railway_track', 'national_highways', 'railway_station', 'DelhiLULC', 'UPLULC', 'AssamLULC', 'HPLULC', 'HPGeomorphology', 'zoomIn', 'zoomOut']:
            for regex in regex_list:
                if re.search(regex, lower_command):
                    location = extract_location(command)
                    result['action'] = action
                    result['place_name'] = location if location else 'unknown'
                    return result

    # If no match in rule-based approach, fallback to Groq
    groq_result = identify_command_with_groq(command)
    action = groq_result.get('Action', 'unknown')
    place_name = groq_result.get('place_name', None)
    view = groq_result.get('View', None)

    if view and action == 'unknown':
        action = 'turn on'  # Default to 'turn on' if view is identified but action is not

    return {'action': action, 'place_name': place_name, 'view': view}


if __name__ == "__main__":
    test_commands = [
        "go to mumbai" 
    ]

    for command in test_commands:
        result = identify_command(command)
        print(f"Command: {command}")
        print(f"Result: {result}")

