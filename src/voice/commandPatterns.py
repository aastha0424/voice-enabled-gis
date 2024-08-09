import re
import spacy
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import pandas as pd

# Load spaCy's English model
nlp = spacy.load('en_core_web_sm')

# Initialize geolocator
geolocator = Nominatim(user_agent="geoapiExercises")

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
        location_fallback = re.findall(r'\b(?:in|to|at|of)\b\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)', command)
        if location_fallback:
            location_name = ' '.join(location_fallback).strip()

    # Check if location_name is not None
    if location_name:
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

def identify_command(command):
    # Convert command to lowercase for easier matching
    lower_command = command.lower()
    
    # Define patterns and corresponding actions
    patterns = {    
    'StandardMap': [
        r'standard map|show standard view|set view to standard|default map|normal map|regular map|switch map to standard view|switch to standard map|switch to standard view'
    ],
    'ReliefMap': [
        r'relief map|show relief view|set view to relief|topographic map|terrain map|elevation map|switch map to relief view|switch to relief map|switch to relief view'
    ],
    'SatelliteMap': [
        r'satellite map|show satellite view|set view to satellite|aerial view|satellite imagery|overhead view|switch map to satellite view|switch to satellite map|switch to satellite view'
    ],
    'BhuvanMap': [
        r'bhuvan map|show bhuvan view|set view to bhuvan|delhi lulc map|land use map|land cover map|switch map to bhuvan view|switch to bhuvan map of delhi'
    ],
    'panToPlace': [
        r'focus on|take me to|show me|pan to|navigate to|set view to|move to|go|display|center on|move map to|locate on|locate to'
    ],
    'addMarkerToPlace': [
        r'add marker to|mark|place marker at|pin|drop pin at|set marker at|add pin|create marker|point'
    ],
    'showMyLocation': [
        r'show my location|where am i|show me where i am|current location|locate me|find my location|where is my position|my current location|find my current spot'
    ],
    'zoomIn': [
        r'zoom in to [a-zA-Z\s]+|zoom in|increase zoom|zoom closer|magnify|enlarge|tighten view|focus closer|come closer|bring in closer|magnified|shrink|enhance|move closer|pull out|pull in'
    ],
    'zoomOut': [
        r'zoom out from [a-zA-Z\s]+|zoom out|decrease zoom|zoom farther|reduce zoom|widen view|pull back|zoom away|back off|wide view'
    ]
}


    # Check for base layer commands
    for action, regex_list in patterns.items():
        if action == 'showBaseLayer':
            for regex in regex_list:
                if re.search(regex, lower_command):
                    return {'action': 'showBaseLayer'}

    # Check for zoom commands
    for action in ['zoomIn', 'zoomOut']:
        for regex in patterns.get(action, []):
            if re.search(regex, lower_command):
                # Extract the location if available
                location = extract_location(command)
                return {'action': action, 'place_name': location if location else 'unknown'}

    # Check for other commands if no base layer command matched
    for action, regex_list in patterns.items():
        if action not in ['showBaseLayer', 'zoomIn', 'zoomOut']:
            for regex in regex_list:
                match = re.search(regex, lower_command)
                if match:
                    location = extract_location(command)
                    return {'action': action, 'place_name': location if location else 'unknown'}

    return {'action': 'unknown'}

# Test cases
if __name__ == "__main__":
    test_commands = [
        "zoom in to bihar",
        "zoom in to himachal pradesh",
        "zoom out gagal"
    ]

    for cmd in test_commands:
        result = identify_command(cmd)
        print(f"Command: {cmd}, Parsed Result: {result}")
