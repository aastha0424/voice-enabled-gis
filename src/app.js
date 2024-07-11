// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13);

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker
var marker = L.marker([51.5, -0.09]).addTo(map)
  .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
  .openPopup();

  // Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Function to handle the start button click event
document.getElementById('startButton').addEventListener('click', startRecognition);

async function startRecognition() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recognizedText = await transcribeAudio(stream); // Placeholder function for audio transcription

        const { action, location } = parseCommand(recognizedText);

        if (action && location) {
            if (action.toLowerCase() === "zoom in") {
                await zoomToLocation(map, location);
            }
            // Add additional conditions for other actions (e.g., zoom out, pan, etc.)
        }
    } catch (error) {
        console.error('Error during voice recognition:', error);
    }
}

// Placeholder function for transcribing audio using a speech-to-text model
async function transcribeAudio(stream) {
    // Implement actual speech-to-text model integration here
    // Returning a dummy result for demonstration purposes
    return "zoom in to Ahmedabad";
}

// Function to parse the recognized text command
function parseCommand(command) {
    const actionMatch = command.match(/zoom (in|out)/i);
    const locationMatch = command.match(/to (.+)/i);
    const action = actionMatch ? actionMatch[0] : null;
    const location = locationMatch ? locationMatch[1] : null;
    return { action, location };
}

// Function to zoom to a specified location
async function zoomToLocation(map, location) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    if (data.length > 0) {
        const { lat, lon } = data[0];
        map.setView([lat, lon], 13); // Adjust zoom level as needed
    } else {
        console.log("Location not found");
    }
}
