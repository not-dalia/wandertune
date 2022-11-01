class TownBuilder {
  constructor(tileSize, pathWidth, pixelSize, availableTileCounts) {
    this.tileSize = tileSize/pixelSize;
    this.pathWidth = pathWidth/pixelSize;
    this.pixelSize = pixelSize;
    this.availableTileCounts = availableTileCounts;
    this._tiles = {}
    this._riverCount = 0
    this._riverTiles = []
    this.objectsMap = {}
    this.shadowMap = {}
    this.busyAreas = new rbush()
    this.artifactMap = {}
  }

  parseIndexToCoords(index) {
    let [x, y] = index.split('_');
    x = parseInt(x);
    y = parseInt(y);
    return {
      x,
      y
    };
  }

  getCoordsFromMapElement({
    x,
    y
  }) {
    return {
      x: (x - 1) / 4,
      y: (y - 1) / 4
    }
  }

  getMapElementCoordsFromTile({
    x,
    y
  }) {
    return {
      x: x * 4 + 1,
      y: y * 4 + 1
    }
  }

  registerElementsFromMap(elementMap) {
    this.elementMap = elementMap;
    elementMap.forEach((e, i) => {
      let tileCoords = this.getCoordsFromMapElement(e);
      let id = `${tileCoords.x}_${tileCoords.y}`;
      this._tiles[id] = {
        elementIndex: i,
        neighbors: {
          up: () => {
            let newCoords = {
              x: tileCoords.x,
              y: tileCoords.y - 1
            }
            return this._tiles[`${newCoords.x}_${newCoords.y}`]
          },
          down: () => {
            let newCoords = {
              x: tileCoords.x,
              y: tileCoords.y + 1
            }
            return this._tiles[`${newCoords.x}_${newCoords.y}`]
          },
          left: () => {
            let newCoords = {
              x: tileCoords.x - 1,
              y: tileCoords.y
            }
            return this._tiles[`${newCoords.x}_${newCoords.y}`]
          },
          right: () => {
            let newCoords = {
              x: tileCoords.x + 1,
              y: tileCoords.y
            }
            return this._tiles[`${newCoords.x}_${newCoords.y}`]
          }
        }
      }
    })
  }

  createRiverPath() {
    let availableTileCounts = this.availableTileCounts;
    let side = ['x', 'y'][randomInt(2)]
    let coordinates = {
      x: side == 'x' ? randomInt(availableTileCounts.x - 1) : [0, (availableTileCounts.x - 1)][randomInt(2)],
      y: side == 'y' ? randomInt(availableTileCounts.y - 1) : [0, (availableTileCounts.y - 1)][randomInt(2)],
    }

    let elementId = `${coordinates.x}_${coordinates.y}`
    let elementData = this._tiles[elementId]
    let direction;
    if (coordinates.x == 0) direction = 'l'
    else if (coordinates.x == availableTileCounts.x - 1) direction = 'r'
    else if (coordinates.y == 0) direction = 'u'
    else direction = 'd'
    if (elementData.tile) {
      return
    }
    elementData.tile = riverStart(direction)
    this._riverTiles.push(elementId);
    let canRiverFlow = true;
    while (canRiverFlow) {
      this._riverCount++
      let riverData = this._tiles[elementId].tile.river
      let direction = directions[(directions.indexOf(riverData.direction.exit) + 2) % 4]
      if (!riverData.direction.exit) break;
      if (riverData.direction.exit == 'u') {
        coordinates.y = coordinates.y - 1;
        if (coordinates.y < 0) break;
      } else if (riverData.direction.exit == 'd') {
        coordinates.y = coordinates.y + 1;
        if (coordinates.y > availableTileCounts.y - 1) break;
      } else if (riverData.direction.exit == 'l') {
        coordinates.x = coordinates.x - 1;
        if (coordinates.x < 0) break;
      } else {
        coordinates.x = coordinates.x + 1;
        if (coordinates.x > availableTileCounts.x - 1) break;
      }

      let newElementId = `${coordinates.x}_${coordinates.y}`

      if (this._tiles[newElementId].tile) {
        this._tiles[elementId].tile = riverLake(riverData.direction.enter, 'lake')
      } else {
        elementId = newElementId;
        this._tiles[elementId].tile = riverStart(direction)
        this._riverTiles.push(elementId);
      }
    }

    return this._riverCount
  }

  createTrainStationTile() {
    let c = 12;
    let availableTileCounts = this.availableTileCounts;
    do {
      c--;

      let side = ['x', 'y'][randomInt(2)]
      let coordinates = {
        x: side == 'x' ? randomInt(availableTileCounts.x - 1) : [0, (availableTileCounts.x - 1)][randomInt(2)],
        y: side == 'y' ? randomInt(availableTileCounts.y - 1) : [0, (availableTileCounts.y - 1)][randomInt(2)],
      }

      let elementId = `${coordinates.x}_${coordinates.y}`
      let elementData = this._tiles[elementId]

      if (elementData.tile) continue;
      let direction;
      if (coordinates.x == 0) direction = 'l'
      else if (coordinates.x == (availableTileCounts.x - 1)) direction = 'r'
      else if (coordinates.y == 0) direction = 'u'
      else direction = 'd'

      elementData.tile = trainStart(tileSize, direction)
      break;
    } while (c >= 0)
  }

  createTownCentre() {
    let availableTileCounts = this.availableTileCounts;
    // let townAreaCentreIndex = this._riverTiles[randomInt(this._riverTiles.length)];
    // let townArea = this.parseIndexToCoords(townAreaCentreIndex);
    let townArea = {
      	x: randomInt(availableTileCounts.x),
      	y: randomInt(availableTileCounts.y)
    }
    let radius = Math.max(Math.max(2, Math.ceil(availableTileCounts.x * 0.3), Math.ceil(availableTileCounts.y * 0.3)), randomInt(Math.max(townArea.x, availableTileCounts.x - townArea.x, townArea.y, availableTileCounts.y - townArea.y)))

    console.log(`townArea: ${townArea.x},${townArea.y}`)
    console.log(`radius: ${radius}`)

    Object.keys(this._tiles).forEach((k, i) => {
      let tile = this._tiles[k];
      if (tile.tile) return
      let tileCoords = this.parseIndexToCoords(k);
      let distance = Math.pow((Math.pow(townArea.x - tileCoords.x , 2) + Math.pow(townArea.y - tileCoords.y, 2)), 0.5)
      if (distance <= radius) tile.tile = randomTile(distance / radius * 100)
      else tile.tile = randomTile(95)
    })
  }

  generateStreets() {
    Object.keys(this._tiles).forEach(k => {
      let tile = this._tiles[k]
      if (['forest', 'river'].indexOf(tile.tile.type) >= 0) return;
      let offset = {x: this.elementMap[tile.elementIndex].locX / this.pixelSize, y: this.elementMap[tile.elementIndex].locY / this.pixelSize}
      this.busyAreas.insert({
        minX: offset.x,
        maxX: offset.x + this.tileSize + 2 * this.pathWidth,
        minY: offset.y,
        maxY: offset.y + this.pathWidth
      })
      this.busyAreas.insert({
        minX: offset.x,
        maxX: offset.x + this.tileSize + 2 * this.pathWidth,
        minY: offset.y + this.tileSize + this.pathWidth,
        maxY: offset.y + this.tileSize + 2 * this.pathWidth
      })
      this.busyAreas.insert({
        minX: offset.x,
        maxX: offset.x + this.pathWidth,
        minY: offset.y,
        maxY: offset.y + this.tileSize + 2 * this.pathWidth
      })
      this.busyAreas.insert({
        minX: offset.x + this.tileSize + this.pathWidth,
        maxX: offset.x + this.tileSize + 2 * this.pathWidth,
        minY: offset.y,
        maxY: offset.y + this.tileSize + 2 * this.pathWidth
      })
    })
  }

  generateAllTilesData(elementMap) {
    Object.keys(this._tiles).forEach(k => {
      let tile = this._tiles[k]
      let neighbors = {
        u: tile.neighbors.up(), d: tile.neighbors.down(), l: tile.neighbors.left(), r: tile.neighbors.right()
      }
      let hasStreets = {}
      if (['forest', 'river'].indexOf(tile.tile.type) >= 0) {
        Object.keys(neighbors).forEach(k => {
          hasStreets[k] = neighbors[k] && ['forest', 'river'].indexOf(neighbors[k].tile.type) < 0
        })
      } else {
        hasStreets = {
          u: true, l: true, r: true, d: true
        }
      }
      let baseSize = this.tileSize - 6;
      let areaSize = {
        w: baseSize + (hasStreets.r ? 0 : this.pathWidth) + (hasStreets.l ? 0 : this.pathWidth),
        h: baseSize + (hasStreets.u ? 0 : this.pathWidth) + (hasStreets.d ? 0 : this.pathWidth),
        x: hasStreets.l ? this.pathWidth + 3 : 3,
        y: hasStreets.u ? this.pathWidth + 3 : 3
      }
      // console.log(neighbors)
      // console.log(hasStreets)
      // console.log(areaSize)
      tile.tile.createTile({objectsMap: this.objectsMap, shadowMap: this.shadowMap, artifactMap: this.artifactMap, busyAreas: this.busyAreas, hasStreets}, areaSize, {x: elementMap[tile.elementIndex].locX / this.pixelSize, y: elementMap[tile.elementIndex].locY / this.pixelSize})
      

      elementMap[tile.elementIndex].tileData = tile.tile.data;
    })
  }
}