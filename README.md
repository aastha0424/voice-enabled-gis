# voice-enabled-gis

# Voice-enabled Geospatial Web Application

This project is a voice-enabled geospatial web application that allows users to interact with a map using voice commands. The application leverages TensorFlow.js for on-device voice recognition and integrates with open-source GIS libraries like Leaflet.

## Features

- Display interactive maps with various geospatial layers.
- Execute geospatial queries using voice commands.
- On-device voice recognition using TensorFlow.js.
- Integration with open access WMS services such as OpenStreetMap (OSM), Bhoonidhi/Bhuvan, NASA Worldview, and Copernicus.

## Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/aastha0424/voice-enabled-gis.git
    cd voice-enabled-gis
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

## Usage

1. Start the development server:
    ```bash
    npm start
    ```

2. Open your browser and navigate to `http://localhost:8080` to see the application in action.

## Project Structure

```plaintext
voice-enabled-gis/
│
├── datasets/                # Directory for storing geospatial datasets
├── src/
│   ├── css/
│   │   └── styles.css       # Stylesheet for the application
│   ├── js/
│   │   └── app.js           # Main JavaScript file for the application
│   └── index.html           # Main HTML file for the application
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
└── README.md                # Project documentation
