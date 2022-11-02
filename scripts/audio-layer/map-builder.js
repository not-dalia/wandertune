import { MapCanvas } from './map-canvas.js'

class MapBuilder {
  constructor () {
    this.map = {
      "type": "FeatureCollection",
      "features": []
    }
    this.tree = new rbush();
    this.built = false;
  }

  addFeatureToMap (geometry, properties) {
    this.map.features.push({
      type: 'Feature',
      geometry,
      properties
    })
  }

  addTileToMap (coordinates, tileType, index) {
    let geometry = {
      type: 'Polygon',
      coordinates: [
        [
          coordinates
        ]
      ]
    }
    let properties = {
      tileType,
      index
    }
    this.addFeatureToMap(geometry, properties)
  }

  buildMap (mapData) {
    if (this.built) return this.map;
    this.mapCanvas = new MapCanvas('.panner-container');
    mapData.forEach((e, i) => {
      if (e.type != 'tile') return
      const x1 = (e.locX + pathWidth) / zoomFactor;
      const x2 = (e.locX + e.w - pathWidth) / zoomFactor;
      const y1 = (e.locY + pathWidth) / zoomFactor;
      const y2 = (e.locY + e.h - pathWidth) / zoomFactor;
      const coordinates = [
        [x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]
      ];
      this.addTileToMap(coordinates, e.tileData.type, i);

      if (e.tileData.boundary) {
        let resultPoly;
        e.tileData.boundary.forEach(b => {
          let {minX, minY, maxX, maxY} = b
          minX = Math.max(minX * pixelSize, e.locX + pathWidth/2) / zoomFactor
          maxX = Math.min(maxX * pixelSize, e.locX + e.w - pathWidth/2) / zoomFactor
          minY = Math.max(minY * pixelSize, e.locY + pathWidth/2) / zoomFactor
          maxY = Math.min(maxY * pixelSize, e.locY + e.h - pathWidth/2) / zoomFactor
          let poly = turf.polygon([[[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]]])
          if (!resultPoly) resultPoly = poly
          else resultPoly = turf.union(resultPoly, poly)
        })
        const item = {
          minX: Number.MAX_VALUE,
          minY: Number.MAX_VALUE,
          maxX: Number.MIN_VALUE,
          maxY: Number.MIN_VALUE,
        }

        resultPoly.geometry.coordinates[0].forEach(p => {
          if (p[0] < item.minX) item.minX = p[0]
          if (p[0] > item.maxX) item.maxX = p[0]
          if (p[1] < item.minY) item.minY = p[1]
          if (p[1] > item.maxY) item.maxY = p[1]
        })

        item.lineString = turf.lineString(resultPoly.geometry.coordinates[0])
        item.index = i
        this.tree.insert(item);
        this.mapCanvas.drawPolygon(resultPoly)
      } else {
        const item = {
          minX: (e.locX + pathWidth) / zoomFactor,
          minY: (e.locY + pathWidth) / zoomFactor,
          maxX: (e.locX + e.w - pathWidth) / zoomFactor,
          maxY: (e.locY + e.h - pathWidth) / zoomFactor,
          index: i,
          lineString: turf.lineString(coordinates)
        };
        this.tree.insert(item);
        this.mapCanvas.drawPolygon([[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]])
      }
    });
    this.built = true;
    return this.map
  }
}

export { MapBuilder }