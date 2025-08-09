# Voice-enabled Geospatial Web Application

This project is a voice-enabled geospatial web application that allows users to interact with a map using voice commands. The application leverages TensorFlow.js for GIS interaction and integrates with open-source GIS libraries like OpenLayers.

## Features

- Display interactive maps with various geospatial layers.
- Execute geospatial queries using voice commands.
- Voice recognition using Python libraries like `speech_recognition` and `pyttsx3`.
- Integration with open access WMS services such as OpenStreetMap (OSM), Bhoonidhi/Bhuvan, NASA Worldview, and Copernicus.

## Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)
- [Python](https://www.python.org/) (v3.6 or higher)
- [pip](https://pip.pypa.io/en/stable/)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/aastha0424/voice-enabled-gis.git
    cd voice-enabled-gis
    ```

2. Install the Node.js dependencies:
    ```bash
    npm install
    ```

3. Install the Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

1. Start the backend server:
    ```bash
    python voice/server.py
    ```

2. Start the development server:
    ```bash
    npm start
    ```

3. Open your browser and navigate to `http://localhost:8080` to see the application in action.

## Project Structure

```plaintext
voice-enabled-gis/
│
├── datasets/                # Directory for storing geospatial datasets
├── ol/                      # Directory for OpenLayers related files
│   └── ...                  # OpenLayers files and configurations
├── src/
│   ├── css/
│   │   └── styles.css       # Stylesheet for the application
│   ├── js/
│   │   └── app.js           # Main JavaScript file for the application
│   └── index.html           # Main HTML file for the application
├── voice/
│   ├── voice.py             # Python script for voice recognition
│   ├── server.py            # Python script for backend server
│   └── ...                  # Other Python scripts related to voice functionality
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

## Additional Information

- The application uses the `speech_recognition` library to capture and process voice commands.
- The `pyttsx3` library is used for text-to-speech functionality.
- OpenLayers is used for rendering the map and interacting with various geospatial layers.
- The backend server (implemented in Python) handles voice command processing and communication between the frontend and backend.
