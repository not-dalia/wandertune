# Wandertune

Wandertune is an interactive demo that maps audio data to GeoJSON. It generates a fictional town map with GeoJSON-defined zones, providing an audio tour of the generated townscape.

**THis project is a work in progress.**

## Features

- Procedurally generated town map with various tile types (forest, river, buildings, etc.)
- Each tile type is associated with a specific ambient sound
- Directional sound support **(best experienced with headphones)**
- Debug overlay showing GeoJSON zones and audio nodes

## How to Use

1. Open the demo in a web browser
2. Click on the map to create waypoints for your path
3. Press Enter to start the sonified walk
4. Use the following controls during the walk:
   - 'i': Toggle debug overlay
   - 'p': Pause/resume the walk
   - 'Space': Stand still at the current point
   - Left/Right arrows: Skip backward/forward along the path

## Technical Details

- Built with JavaScript
- Uses Web Audio API to generate directional sound
- Graphics rendered on HTML5 canvas
