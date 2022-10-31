class Season {
  constructor(name) {
    this._colors = {
      summer: '#71c62b',
      spring: '#7fb76f',
      autumn: '#b0b964',
      winter: '#f0f8ff'
    }

    this._artifactColors = {
      summer: '#96e057',
      spring: '#a3c89b',
      autumn: '#c6d087',
      winter: '#bdecff'
    }

    this._name = name;
    this._color = this._colors[name];
    this._artifactColor = this._artifactColors[name];
    this.trees = [];
    this.artifacts = [];
    this.buildings = [];
  }

  setTrees(trees) {
    this.trees = [...trees];
  }

  setBuildings(buildings) {
    this.buildings = [...buildings];
  }

  setArtifacts(artifacts = []) {
    this.artifacts = []
    artifacts.forEach(a => {
      let [name, colors] = a;
      if (!colors) colors = [this._artifactColor]
      this.artifacts.push(ArtifactDefinitions.getArtifact(name, colors))
    })
  }

  get color() {
    return this._color
  }

  get name() {
    return this._name;
  }
}

class TileObject {
  get data() {
    return {
      type: this.type,
      subtype: this.subtype,
      src: this.src,
      width: this.width,
      height: this.height,
      boundary: this.boundary,
      direction: this.direction,
      rotation: this.rotation
    };
  }
}

class TileFactory {
  constructor() {
    this._tileTypes = {}
  }

  init(season, tileSize, pathWidth, pixelSize) {
    this.season = season;
    this.pixelSize = pixelSize;
    this.realTileSize = tileSize;
    this.realPathWidth = pathWidth;
    this.tileSize = this.realTileSize / pixelSize;
    this.pathWidth = this.realPathWidth / pixelSize;
  }

  make(type, direction, subtype) {
    return new this._tileTypes[type]({
      direction,
      type: type,
      subtype,
      season: this.season,
      tileSize: this.tileSize,
      pathWidth: this.pathWidth,
      pixelSize: this.pixelSize
    })
  }

  registerTileType(type, tileClass) {
    this._tileTypes[type] = tileClass
  }
}

class Tile {
  get data() {
    return {
      type: this.type,
      color: this.color,
      pathMap: this.pathMap,
      objectsMap: this.objectsMap,
      shadowMap: this.shadowMap,
      artifactMap: this.artifactMap,
      bridges: this.bridges,
      streets: this.streetMap,
      boundary: this.boundary,
      extraData: this.extraData
    }
  }

  createArtifacts = (artifactMap, areaSize, offset, busyAreas, countMin, countRand) => {
    this.artifactMap = artifactMap;
    let artifactCount = randomInt(countRand) + countMin;
    for (let t = 0; t < artifactCount; t++) {
      let artifact = this.season.artifacts[randomInt(this.season.artifacts.length)];
      if (!artifact) continue;
      let tx = randomInt(areaSize.w) + areaSize.x + offset.x;
      let ty = randomInt(areaSize.h) + areaSize.y + offset.y;
      let artifactBoundary =  {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
      }

      let artifactPoints = []
      artifact.points.forEach(p => {
        let a = {
          type: 'artifact',
          x: tx + p.x,
          y: ty + p.y,
          data: {
            color: artifact.colors[p.color || 0]
          }
        }

        artifactBoundary.minX = Math.min(artifactBoundary.minX, a.x)
        artifactBoundary.minY = Math.min(artifactBoundary.minY, a.y)
        artifactBoundary.maxX = Math.max(artifactBoundary.maxX, a.x)
        artifactBoundary.maxY = Math.max(artifactBoundary.maxY, a.y)
  
        artifactPoints.push(a)
      })
      if (!busyAreas.collides(artifactBoundary)) artifactPoints.forEach(a => {
        artifactMap[`${a.x}_${a.y}`] = a
      });
    }
    return artifactMap;
  }

  createStreet(direction = 'h', step) {
    let streetMap = {};
    for (let x = this.pathWidth + step - 1; x < this.tileSize + this.pathWidth - step; x+=step) {
      let tx = x;
      let ty = this.pathWidth / 2 - 1;
      Array(Math.floor(step/2)).fill({}).forEach((_, i) => {
        let a = {
          type: 'artifact',
          x: direction == 'h' ? tx + i : ty + 0.5,
          y: direction == 'h' ? ty + 0.5 : tx + i,
          data: {
            color: '#bbc5ca'
          }
        }
        streetMap[`${a.x}_${a.y}`] = a

        let b = {
          type: 'artifact',
          x: direction == 'h' ? tx + i : ty + this.tileSize + this.pathWidth + 0.5,
          y: direction == 'h' ? ty + this.tileSize + this.pathWidth + 0.5 : tx + i,
          data: {
            color: '#bbc5ca'
          }
        }
        streetMap[`${b.x}_${b.y}`] = b
      })
    }
    return streetMap;
  }

  createStreets = () => {
    let step = 8;
    let streetMap = { ...this.createStreet('h', step), ...this.createStreet('v', step), ...this.createCrossings('h', step), ...this.createCrossings('v', step)}
    return streetMap;
  }

  createCrossings = (direction = 'h', step) => {
    let artifactMap = {}
    for (let x = 1; x < this.pathWidth; x+=2) {
      Array(Math.floor(step/2)).fill({}).forEach((_, i) => {
        [
          {x: (tx, ty) => tx, y: (tx, ty) => (ty + i)},
          {x: (tx, ty) => tx, y: (tx, ty) => (ty + this.tileSize - step / 2 + i)},
          {x: (tx, ty) => (tx + this.tileSize + this.pathWidth), y: (tx, ty) => (ty + i)},
          {x: (tx, ty) => (tx + this.tileSize + this.pathWidth), y: (tx, ty) => (ty + this.tileSize - step / 2 + i)}
        ].forEach(p => {
          let tx = x;
          let ty = this.pathWidth;
          let a = {
            type: 'artifact',
            x: direction == 'h' ? p.x(tx, ty) : p.y(tx, ty),
            y: direction == 'h' ? p.y(tx, ty) : p.x(tx, ty),
            data: {
              color: '#bbc5ca'
            }
          }
          artifactMap[`${a.x}_${a.y}`] = a
        })
      })
    }
    return artifactMap;
  }
}
