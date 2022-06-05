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
    this.color = this.season.color;

    // this.createTile()
  }

  createTile = ({objectsMap={}, shadowMap={}, artifactMap={}, busyAreas={}}, areaSize, offset) => {
    const directions = ['u', 'r', 'd', 'l'];
    if (!this.direction) {
      this.direction = directions[randomInt(directions.length)];
    }

    this.pathMap = this.pathBuilder.makePath(true);
    this.createArtifacts(artifactMap, areaSize, offset, busyAreas, 30, 30);
    let trainPoint = this.createTrainStation(offset);
    objectsMap[`${trainPoint.x}_${trainPoint.y}`] = trainPoint;
    this.createShadows(shadowMap, trainPoint);
    this.streetMap = this.createStreets();
  }

  createShadows = (shadowMap, s) => {
    let boundingBox = {
      x: s.x - 2,
      w: 40,
      y: s.y + 6,
      h: 25
    }
    if (s.data.direction.enter == 'u') {
      boundingBox = {
        x: s.x - 2,
        w: 40,
        y: s.y + 14,
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
  
  createTrainStation = (offset) => {
    let direction = this.direction;
    let trainData = (new Station(direction)).data
    let trainPoint = {
      type: 'station',
      x: this.pathWidth + offset.x,
      y: this.pathWidth + offset.y,
      data: {
        ...trainData
      }
    }
    return trainPoint
  }
}