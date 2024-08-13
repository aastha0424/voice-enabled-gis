import os
from groq import Groq

# Initialize the Groq client with your API key
client = Groq(
    api_key="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"
)

# Define the command to analyze
user_command = " take me to the airport"  # You can change this to test different commands
print(f"User Command: {user_command}")

# Craft the prompt for extracting view, action, and place_name
prompt = f"""
Analyze the following command and identify the view, action, and place_name described. 

- If the command involves actions related to moving to a specific place (e.g., "pantoplace,go, going, see, navigate etc."), return the action as "panToPlace" and the identified place_name.
- If the command is about showing the user's location (e.g., "show my location"), return the action as "showMyLocation" and no place_name.
- If the command is about adding a marker (e.g., "addMarkerToPlace"), return the action as "add marker" and include the location if specified.
- If the command have following layers ("satellite map","relief map","satellite map","airport","railway_track","national_highways","railway_station") ,priotize the view if the command include any type of layer.
- If the command include any type of layer (e.g., "satellite map, etc."), return action(e.g.,"turn on") and view specific type(e.g. "SatelliteMap).
- If place_name is not specified return None.
- If the command contain "show me" then check for the view and location.If view then return action(e.g. "turn on") and if place_name specified then action("panToPlace") otherwise showMyLocation.
- If the command include any actions related to that layer ,then action is "turn on" and view is specific layer. 
-If the command include any action related to railway tracks, then action is "turn on" and view is "railway_track".
-If the command include any action related to railway station ,then action is "turn on" and view is "railway_station". 
- If the command include any action related to national highways ,then action is "turn on" and view is "national_highways".
- If the command include any action related to airport ,then action is "turn on" and view is "airport".
-If the command contain airport, then place_name can never be airport".

Command:
"{user_command}"

Provide the output in the following format:
- Action: <action>
- place_name: <location (if applicable)>
- View: <view (if applicable)>

Ensure that:
1. The action is correctly identified based on the command's context.
2. The location is extracted if the command specifies a place.
3. The view is clearly identified if applicable.
4. If the action is about showing location or adding a marker, clearly specify that in the action field.
5. Include any relevant explanations at the end.
"""

# Create a chat completion request
chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": prompt,
        }
    ],
    model="llama3-8b-8192",
)

# Extract and print the results
response_content = chat_completion.choices[0].message.content
print("Command Analysis Result:")
print(response_content)



