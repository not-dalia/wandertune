class ArtifactPoint {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.color = color
  }

  get data() {
    return {
      x: this.x,
      y: this.y,
      color: this.color
    }
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

class Tree extends TileObject {
  constructor(type, ext = 'png') {
    super();

    this.type = 'tree';
    this.subtype = type;
    this.width = 20;
    this.height = 0;
    this.src = `tiles/forest/${type}.${ext}`;
    this.calculateBoundary();
  }

  calculateBoundary = () => {
    /**
     * A collision boundary that prevents other trees from spawning and prevents this tree from growing outside the allocated tile.
     */
    this.boundary = {
      x: 0,
      y: 0,
      w: 0,
      h: 0
    }
    if (['tree', 'tree_1', 'tree_2', 'tree_3', 'tree_4', 'tree_5', 'tree_6', 'tree_7', 'tree_8', 'tree_9', 'tree_10', 'tree_11'].includes(this.subtype)) {
      this.boundary = {
        x: 4,
        y: 12,
        w: 12,
        h: 8
      };
    } else if (['tree_tall', 'tree_tall_1', 'tree_tall_2', 'tree_tall_3'].includes(this.subtype)) {
      this.width = 19;
      this.boundary = {
        x: 2,
        y: 12,
        w: 15,
        h: 8
      };
    }
  }
}

class River extends TileObject {
  constructor(type, direction) {
    super();

    this.directions = ['u', 'r', 'd', 'l'];
    this.type = 'river';
    this.subtype = type;
    this.width = 50;
    this.height = 50;
    this.direction = {};
    this.direction.enter = direction;
    this.direction.exit = 'r';
    this.rotation = 0;
    this.src = `tiles/river/river-${type}.png`;
    this.calculateDirectionAndRotation()
  }

  calculateDirectionAndRotation = () => {
    // rotation value ranges from 0 to 3 and representes 90° or PI/2
    switch (this.subtype) {
      case 'straight':
        /* 
         * Entry direction is used to determine if river segment is horisontal or vertical.
         * Rotation is odd when the river is horisontal, even when vertical.
         */
        if (this.direction.enter == 'l' || this.direction.enter == 'r') {
          this.rotation = randomInt(4, 'odd')
        } else {
          this.rotation = randomInt(4, 'even')
        }
        // For a straight segment, exit direction is always 2 steps from entry.
        this.direction.exit = this.directions[(this.directions.indexOf(this.direction.enter) + 2) % 4]
        break;
      case 'bend':
        /*
         * For a bent river segment, the exit is one direction step before or after the entry.
         * for this to happen, the rotation of the tile has to be equal to or one step lower than the entry direction
         * (default tile entry is up, exit is r, to match `this.directions`) 
         */
        this.rotation = (this.directions.indexOf(this.direction.enter) - randomInt(2)) % 4
        if (this.directions.indexOf(this.direction.enter) == this.rotation) {
          // exit direction is on step clockwise from entry direction
          this.direction.exit = this.directions[(this.directions.indexOf(this.direction.enter) + 1) % 4]
        } else {
          // exit direction is on step counterclockwise from entry direction
          let exitDirectionIndex = this.directions.indexOf(this.direction.enter) - 1;
          if (exitDirectionIndex < 0) exitDirectionIndex = 3;
          this.direction.exit = this.directions[exitDirectionIndex]
        }
        break;
      case 'lake':
        // Lakes have no exits
        this.src = `tiles/river/river-${this.subtype}-${this.direction.enter}.png`
        this.direction.exit = null
        break;
    }
  }
}

class Station extends TileObject {
  constructor(direction) {
    super();

    this.type = 'station';
    this.width = 50;
    this.height = 50;
    this.direction = {};
    this.direction.enter = direction;
    this.src = `tiles/station/station_${direction}.png`;
  }
}

class ArtifactDefinitionsRegistry {
  constructor() {
    if (ArtifactDefinitionsRegistry.exists) {
      return ArtifactDefinitionsRegistry.instance;
    }
    this._artifacts = {}
    ArtifactDefinitionsRegistry.instance = this;
    ArtifactDefinitionsRegistry.exists = true;
    return this;
  }

  registerArtifact = (name, points, colors = ['#a3c89b']) => {
    if (this._artifacts[name]) {
      throw new Error('Trying to register an existing artifact.');
    }
    this._artifacts[name] = {
      type: name,
      colors,
      points
    }
  }

  getArtifact(name, colors = []) {
    let artifact = {
      ...this._artifacts[name]
    }
    artifact.colors = [...this._artifacts[name].colors]
    colors.forEach((c, i) => {
      artifact.colors[i] = c
    })
    return artifact
  }
}

class PathBuilder {
  constructor(tileSize, pathWidth, tileColor) {
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.minW = 2;
    this.maxW = 5;
    // this.color = 'rgba(0,0,0,0)';
    this.color = '#d1a263';
    this.stroke = '#edc487';
    this.tileColor = tileColor;
    this.boundary = {
      w: 6
    }
  }

  makePathEdge = () => {
    let lastPathValue = 0;
    let pathRowArr = new Array(this.tileSize).fill({}).map((_, i) => {
      if (i == 0) {
      } else if (i >= this.tileSize - 4) {
        lastPathValue = Math.max(0, Math.min(lastPathValue - 1, 3))
      } else {
        let newPathChance = randomInt(100);
        if (newPathChance < 10) {
          lastPathValue = Math.max(1, Math.min(lastPathValue + [1, -1][randomInt(2)], 3))
        }
      }
      return this.getPathRow(lastPathValue);
    })
    return pathRowArr;
  }

  makePath = () => {
    let pointsMap = {};
    let lastPathValue = 1;
  
    let bottomEdgePath = this.makePathEdge()
    bottomEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          x: ex + this.pathWidth,
          y: this.tileSize - Math.round(pathRow.length / 2) + i + this.pathWidth,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let topEdgePath = this.makePathEdge()
    topEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          x: (this.tileSize - 1 - ex) + this.pathWidth,
          y: (3-i) - 2 + this.pathWidth ,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let leftEdgePath = this.makePathEdge()
    leftEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          y: ex + this.pathWidth,
          x: (3-i) - 2 + this.pathWidth ,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let rightEdgePath = this.makePathEdge()
    rightEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          y: (this.tileSize - 1 - ex) + this.pathWidth,
          x: this.tileSize - Math.round(pathRow.length / 2) + i + this.pathWidth,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })
  
    return pointsMap;
  }

  getPathRow = (position) => {
    let rowWidth = 4;
    let rowPoints = new Array(rowWidth).fill({ }).map((_, i) => {
      if (i == position) {
        return {
          type: 'stroke',
          color: this.stroke
        }
      } else if (i == position - 1) {
        return {
          type: 'fill',
          color: 'rgba(0,0,0,0.1)'
        }
      } else if (i > position) {
        return {
          type: 'fill',
          color: this.color
        }
      }
      return {
        type: 'fill',
        color: 'rgba(0,0,0,0)'
      }
    });
    return rowPoints;
  }
}

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
  }

  setTrees(trees) {
    this.trees = [...trees];
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

class TileFactory {
  constructor(season, tileSize, pathWidth, pixelSize) {
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
    console.log(type)
    return new this._tileTypes[type]({
      direction,
      type: type,
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
      color: this.season.color,
      pathMap: this.pathMap,
      objectsMap: this.objectsMap,
      shadowMap: this.shadowMap,
      artifactMap: this.artifactMap,
      bridges: this.bridges
    }
  }

  createArtifacts = (countMin, countRand) => {
    let artifactMap = {};
    let artifactCount = randomInt(countRand) + countMin;
    for (let t = 0; t < artifactCount; t++) {
      let artifact = this.season.artifacts[randomInt(this.season.artifacts.length)];
      let tx = randomInt(this.tileSize - 9) + 3 + this.pathWidth;
      let ty = randomInt(this.tileSize - 9) + 3 + this.pathWidth;
      artifact.points.forEach(p => {
        let a = {
          type: 'artifact',
          x: tx + p.x,
          y: ty + p.y,
          data: {
            color: artifact.colors[p.color || 0]
          }
        }
  
        artifactMap[`${a.x}_${a.y}`] = a
      })
    }
    return artifactMap;
  }
}

class ForestTile extends Tile {
  constructor({
    season,
    tileSize,
    pathWidth,
    pixelSize,
    type
  }) {
    super();
    const seasonsData = {
      trees: {
        summer: [new Tree('tree_2'), new Tree('tree_1'), new Tree('tree_3')],
        spring: [new Tree('tree_1'), new Tree('tree_1'), new Tree('tree_1'), new Tree('tree_4')],
        autumn: [new Tree('tree_6'), new Tree('tree_7'), new Tree('tree_8'), new Tree('tree_11')],
        winter: [new Tree('tree_tall_1'), new Tree('tree_tall_2'), new Tree('tree_tall_3')]
      },
      artifacts: {
        summer: [
          // ['dot_b', ['#a3c89b']],
          ['grass_2', ['#96e057']],
          ['grass_3', ['#96e057']],
          ['grass_4', ['#96e057']],
          ['grass_5', ['#96e057']],
          ['dot_s', ['#FFD700']],
          ['dot_s', ['#FFD700']],
          ['dot_s', ['#FFD700']],
          ['flower_1', ['#FFD700']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
        ],
        spring: [
          ['grass_4', ['#a3c89b']],
          ['grass_5', ['#a3c89b']],
          ['flower_1', ['#ffffff']],
          ['flower_1', ['#ffffff', '#FFD700']],
          ['flower_1', ['#DB7093', '#FFD700']],
        ],
        autumn: [
          ['grass_2', ['#c6d087']],
          ['grass_3', ['#c6d087']],
          ['grass_4', ['#c6d087']],
          ['grass_5', ['#c6d087']],
          ['leaf_1', ['#CD853F']],
          ['dot_s', ['#CD853F']],
          ['zigzag_1', ['#CD853F']],
        ],
        winter: [
          ['dot_b', ['#bdecff']],
          ['grass_2', ['#bdecff']],
          ['grass_3', ['#bdecff']],
          ['grass_4', ['#bdecff']],
          ['grass_5', ['#bdecff']],
        ]
      }
    }

    this.season = new Season(season);
    this.season.setArtifacts(seasonsData.artifacts[season]);
    this.season.setTrees(seasonsData.trees[season]);
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.pixelSize = pixelSize;
    this.pathBuilder = new PathBuilder(this.tileSize, this.pathWidth, this.season.color)
    this.type = 'forest';

    this.createTile()
  }

  createTile = () => {
    this.pathMap = this.pathBuilder.makePath();
    this.objectsMap = this.createTrees(this.tileSize - 4, 1, 1);
    this.shadowMap = this.createShadows()
    this.artifactMap = this.createArtifacts(35, 30);
  }

  createTrees = (areaSize, offsetX = 0, offsetY = 0) => {
    let treeMap = {};
    // let treeCount = 1;
    let treeCount = randomInt(10) + 15;
    for (let t = 0; t < treeCount; t++) {
      let tree = this.season.trees[randomInt(this.season.trees.length)].data;

      // create a random point inside of the area so that tree boundaries are contained within
      let tx = randomInt(areaSize - (tree.boundary.x + tree.boundary.w) + 1) + offsetX + this.pathWidth;
      let ty = randomInt(areaSize - (tree.boundary.y + tree.boundary.h) + 1) + offsetY + this.pathWidth;

      let treeBoundaryX = [tx + tree.boundary.x, tx + tree.boundary.x + tree.boundary.w];
      let treeBoundaryY = [ty + tree.boundary.y, ty + tree.boundary.y + tree.boundary.h];
      
      let canPlant = true;
      for (let tbx = treeBoundaryX[0]; tbx <= treeBoundaryX[1]; tbx++) {
        for (let tby = treeBoundaryY[0]; tby <= treeBoundaryY[1]; tby++) {
          if (treeMap[`${tbx}_${tby}`] && treeMap[`${tbx}_${tby}`].type == 'boundaryBox') canPlant = false;
        }
      }
      if (!canPlant) continue;

      let treePoint = {
        type: 'tree',
        x: tx,
        y: ty,
        data: {
          ...tree
        }
      }
      treeMap[`${treePoint.x}_${treePoint.y}`] = treePoint
      for (let tbx = treeBoundaryX[0]; tbx <= treeBoundaryX[1]; tbx++) {
        for (let tby = treeBoundaryY[0]; tby <= treeBoundaryY[1]; tby++) {
          treeMap[`${tbx}_${tby}`] = {
            type: 'boundaryBox',
            x: tbx,
            y: tby,
            data: {
              parent: `${treePoint.x}_${treePoint.y}`
            }
          }
        }
      }
    }
    return treeMap;
  }

  createShadows = () => {
    let treeMap = this.objectsMap;
    let treeKeys = Object.keys(treeMap);
    let shadowMap = {};
    treeKeys.forEach(k => {
      let t = treeMap[k];
      if (t.type != 'tree') return;
      let boundingBox = {
        x: t.x + 2,
        w: t.data.width - 4,
        y: t.y + t.data.height + 14,
        h: 8
      }

      // Make rounded shadows. Rows increase width by 2 every step until half of shadow height then decrease 2
      let xRows = new Array(boundingBox.h).fill(0).map((e, i) => {
        if (i >= boundingBox.h / 2) {
          return boundingBox.w - (i - boundingBox.h / 2) * 2
        } else {
          return boundingBox.w - ((boundingBox.h / 2 - (i + 1))) * 2
        }
      })
      for (let sy = boundingBox.y; sy < boundingBox.y + boundingBox.h; sy++) {
        for (let sx = boundingBox.x; sx < boundingBox.x + boundingBox.w; sx++) {
          let missingCorner = (boundingBox.w - xRows[sy - boundingBox.y]) / 2
          if (sx - boundingBox.x < missingCorner || sx - boundingBox.x >= missingCorner + xRows[sy - boundingBox.y]) continue;
          shadowMap[`${sx}_${sy}`] = {
            type: 'shadow',
            x: sx,
            y: sy,
            data: {
              parent: k
            }
          }
        }
      }
    })
    return shadowMap
  }
}

class RiverTile extends Tile {
  constructor({
    season,
    tileSize,
    pathWidth,
    pixelSize,
    type,
    direction,
    subtype
  }) {
    super();

    const seasonsData = {
      artifacts: {
        summer: [
          ['grass_2', ['#96e057']],
          ['grass_3', ['#96e057']],
          ['grass_4', ['#96e057']],
          ['grass_5', ['#96e057']],
          ['dot_s', ['#FFD700']],
          ['dot_s', ['#FFD700']],
          ['dot_s', ['#FFD700']],
          ['flower_1', ['#FFD700']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
        ],
        spring: [
          ['grass_4', ['#a3c89b']],
          ['grass_5', ['#a3c89b']],
          ['flower_1', ['#ffffff']],
          ['flower_1', ['#ffffff', '#FFD700']],
          ['flower_1', ['#DB7093', '#FFD700']],
        ],
        autumn: [
          ['grass_2', ['#c6d087']],
          ['grass_3', ['#c6d087']],
          ['grass_4', ['#c6d087']],
          ['grass_4', ['#CD853F']],
          ['grass_5', ['#c6d087']],
          ['grass_5', ['#CD853F']],
          ['leaf_1', ['#CD853F']],
          ['dot_s', ['#CD853F']],
          ['zigzag_1', ['#CD853F']],
        ],
        winter: [
          ['dot_b', ['#bdecff']],
          ['grass_2', ['#bdecff']],
          ['grass_3', ['#bdecff']],
          ['grass_4', ['#bdecff']],
          ['grass_5', ['#bdecff']],
        ]
      }
    }

    this._riverPaths = ['straight', 'bend', 'lake'];


    this.season = new Season(season);
    this.season.setArtifacts(seasonsData.artifacts[season]);
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.pixelSize = pixelSize;
    this.pathBuilder = new PathBuilder(tileSize, pathWidth, this.season.color)
    this.type = 'river';
    this.subtype = subtype;
    this.direction = direction;

    this.createTile()
  }

  createTile = () => {
    const directions = ['u', 'r', 'd', 'l'];

    if (!this.subtype) {
      this.subtype = this._riverPaths[randomInt(this._riverPaths.length)];
    }
    if (!this.direction) {
      this.direction = directions[randomInt(directions.length)];
    }

    this.pathMap = this.pathBuilder.makePath();
    this.artifactMap = this.createArtifacts(20, 10);
    this.objectsMap = this.createRiver();
    this.bridges = this.createBridges(this.objectsMap[0].data.direction);
  }

  createBridges = (direction) => {
    let bridges = []
    let tileSize = this.tileSize;

    if (direction.enter == 'l' || direction.exit == 'l') {
      bridges.push({
        type: 'bridge',
        y: (tileSize - 10) / 2 + this.pathWidth/2,
        x: 0,
        data: {
          rotation: 0,
          src: `tiles/river/bridge.png`,
          width: 8,
          height: 20,
        }
      })
    }
    if (direction.enter == 'u' || direction.exit == 'u') {
      bridges.push({
        type: 'bridge',
        x: (tileSize - 10) / 2 + this.pathWidth/2,
        y: 0,
        data: {
          rotation: 0,
          src: `tiles/river/bridge_h.png`,
          height: 20,
          width: 8,
        }
      })
    }
    return bridges;
  }

  createRiver = () => {
    let riverData = (new River(this.subtype, this.direction)).data
  
    let riverPoint = {
      type: 'river',
      x: this.pathWidth,
      y: this.pathWidth,
      data: {
        ...riverData
      }
    }
    return[riverPoint];
  }
}

class StationTile extends Tile {
  constructor({
    season,
    tileSize,
    pathWidth,
    pixelSize,
    type,
    direction
  }) {
    super();

    const seasonsData = {
      artifacts: {
        summer: [
          ['grass_2', ['#96e057']],
          ['grass_3', ['#96e057']],
          ['grass_4', ['#96e057']],
          ['grass_5', ['#96e057']],
          ['dot_s', ['#FFD700']],
          ['dot_s', ['#FFD700']],
          ['dot_s', ['#FFD700']],
          ['flower_1', ['#FFD700']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
          ['dot_s', ['#FFFFFF']],
        ],
        spring: [
          ['grass_4', ['#a3c89b']],
          ['grass_5', ['#a3c89b']],
          ['flower_1', ['#ffffff']],
          ['flower_1', ['#ffffff', '#FFD700']],
          ['flower_1', ['#DB7093', '#FFD700']],
        ],
        autumn: [
          ['grass_2', ['#c6d087']],
          ['grass_3', ['#c6d087']],
          ['grass_4', ['#c6d087']],
          ['grass_4', ['#CD853F']],
          ['grass_5', ['#c6d087']],
          ['grass_5', ['#CD853F']],
          ['leaf_1', ['#CD853F']],
          ['dot_s', ['#CD853F']],
          ['zigzag_1', ['#CD853F']],
        ],
        winter: [
          ['dot_b', ['#bdecff']],
          ['grass_2', ['#bdecff']],
          ['grass_3', ['#bdecff']],
          ['grass_4', ['#bdecff']],
          ['grass_5', ['#bdecff']],
        ]
      }
    }

    this.season = new Season(season);
    this.season.setArtifacts(seasonsData.artifacts[season]);
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.pixelSize = pixelSize;
    this.pathBuilder = new PathBuilder(tileSize, pathWidth, this.season.color)
    this.type = 'station';
    this.direction = direction;

    this.createTile()
  }

  createTile = () => {
    const directions = ['u', 'r', 'd', 'l'];
    if (!this.direction) {
      this.direction = directions[randomInt(directions.length)];
    }

    this.pathMap = this.pathBuilder.makePath();
    this.artifactMap = this.createArtifacts(30, 30);
    let trainPoint = this.createTrainStation();
    this.objectsMap = trainPoint;
    this.shadowMap = this.createShadows(trainPoint[0]);
  }

  createShadows = (s) => {
    let shadowMap = {}
    let boundingBox = {
      x: s.x + 1,
      w: 39,
      y: s.y + 8,
      h: 25
    }
    if (s.data.direction.enter == 'u') {
      boundingBox = {
        x: s.x + 1,
        w: 39,
        y: s.y + 16,
        h: 25
      }
    }
    for (let sy = boundingBox.y; sy < boundingBox.y + boundingBox.h; sy++) {
      for (let sx = boundingBox.x; sx < boundingBox.x + boundingBox.w; sx++) {
        if ((sx == boundingBox.x || sx == boundingBox.x + boundingBox.w - 1) && (sy == boundingBox.y || sy == boundingBox.y + boundingBox.h - 1)) continue;
        // let missingCorner = (boundingBox.w - xRows[sy - boundingBox.y]) / 2
        // if (sx - boundingBox.x < missingCorner || sx - boundingBox.x >= missingCorner + xRows[sy - boundingBox.y]) continue;
        shadowMap[`${sx}_${sy}`] = {
          type: 'shadow',
          x: sx + this.pathWidth/2,
          y: sy + this.pathWidth/2,
          data: {}
        }
      }
    }
  
    return shadowMap
  }
  
  createTrainStation = () => {
    let direction = this.direction;
    let trainData = (new Station(direction)).data
    let trainPoint = {
      type: 'station',
      x: this.pathWidth,
      y: this.pathWidth,
      data: {
        ...trainData
      }
    }
    return [trainPoint]
  }
}

function randomTile() {
  return tileFactory.make('forest');
}

function riverStart(direction) {
  return tileFactory.make('river', direction, ['bend', 'straight'][randomInt(2)]);
}

function riverLake(direction) {
  return tileFactory.make('river', direction, 'lake');
}

function trainStart(tileSize, direction) {
  return tileFactory.make('station', direction);
}



function randomInt(upperLimit, type = 'all') {
  switch (type) {
    case 'even':
      return Math.floor(Math.random() * upperLimit / 2) * 2;
    case 'odd':
      return Math.floor(Math.random() * upperLimit / 2) * 2 + 1;
    case 'all':
    default:
      return Math.floor(Math.random() * upperLimit);
  }
}

function registerArtifacts() {
  ArtifactDefinitions.registerArtifact('zigzag_1', [new ArtifactPoint(0, 0), new ArtifactPoint(1, 1), new ArtifactPoint(2, 0), new ArtifactPoint(3, 1)]);
  ArtifactDefinitions.registerArtifact('dot_b', [new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, 0), new ArtifactPoint(1, 1)]);
  ArtifactDefinitions.registerArtifact('dot_s', [new ArtifactPoint(0, 0)]);
  ArtifactDefinitions.registerArtifact('flower_1', [new ArtifactPoint(1, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, 1, 1), new ArtifactPoint(2, 1), new ArtifactPoint(1, 2)], ['#a3c89b', '#d9682f']);
  ArtifactDefinitions.registerArtifact('leaf_1', [new ArtifactPoint(-1, 0), new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, -1)]);
  ArtifactDefinitions.registerArtifact('grass_1', [new ArtifactPoint(0, 2), new ArtifactPoint(2, 2), new ArtifactPoint(2, 1), new ArtifactPoint(2, 0), new ArtifactPoint(4, 2), new ArtifactPoint(4, 1)]);
  ArtifactDefinitions.registerArtifact('grass_2', [new ArtifactPoint(0, 1), new ArtifactPoint(1, 2), new ArtifactPoint(2, 0), new ArtifactPoint(2, 1), new ArtifactPoint(2, 2), new ArtifactPoint(3, 2), new ArtifactPoint(4, 1)]);
  ArtifactDefinitions.registerArtifact('grass_3', [new ArtifactPoint(0, 2), new ArtifactPoint(1, 0), new ArtifactPoint(2, 1), new ArtifactPoint(2, 2)]);
  ArtifactDefinitions.registerArtifact('grass_4', [new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(0, 2), new ArtifactPoint(2, 2), new ArtifactPoint(2, 1)]);
  ArtifactDefinitions.registerArtifact('grass_5', [new ArtifactPoint(0, 0), new ArtifactPoint(1, 1), new ArtifactPoint(1, 2), new ArtifactPoint(3, 0), new ArtifactPoint(3, 1), new ArtifactPoint(3, 2), new ArtifactPoint(4, 2), new ArtifactPoint(5, 1)]);
}

function registerTiles() {
  tileFactory.registerTileType('forest', ForestTile);
  tileFactory.registerTileType('river', RiverTile);
  tileFactory.registerTileType('station', StationTile);
}

const directions = ['u', 'r', 'd', 'l'];

const ArtifactDefinitions = new ArtifactDefinitionsRegistry();
registerArtifacts();

const tileFactory = new TileFactory();
registerTiles();