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
          ['brick', ['#b9b9b9']],
          ['brick_2', ['#b9b9b9']],
        ],
        spring: [
          ['brick', ['#b9b9b9']],
          ['brick_2', ['#b9b9b9']],
        ],
        autumn: [
          ['brick', ['#b9b9b9']],
          ['brick_2', ['#b9b9b9']],
        ],
        winter: [
          ['brick', ['#b9b9b9']],
          ['brick_2', ['#b9b9b9']],
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
    this.color = '#dcdcdc';

    // this.createTile()
  }

  createTile = ({objectsMap={}, shadowMap={}, artifactMap={}, busyAreas={}}, areaSize, offset) => {
    const directions = ['u', 'r', 'd', 'l'];
    if (!this.direction) {
      this.direction = directions[randomInt(directions.length)];
    }

    // this.pathMap = this.pathBuilder.makePath(true);
    this.createArtifacts(artifactMap, areaSize, offset, busyAreas, 10, 5);
    let trainPoint = this.createTrainStation(offset);
    objectsMap[`${trainPoint.x}_${trainPoint.y}`] = trainPoint;
    this.createShadows(shadowMap, trainPoint);
    this.createBuildingArtifacts(artifactMap, this.pathWidth, this.tileSize, offset)
    this.streetMap = this.createStreets();
  }

  createBuildingArtifacts = (artifactMap, pathWidth, tileSize, offset) => {
    this.artifactMap = artifactMap;
    for (let x = this.pathWidth; x < this.pathWidth + this.tileSize; x++) {
      let s = {
        x: offset.x + x,
        y: offset.y + this.pathWidth,
        type: 'shadow',
        data: {
          color: 'darkgray'
        }
      }
      artifactMap[`${s.x}_${s.y}`] = s

      let s2 = {
        y: offset.y + x,
        x: offset.x + this.pathWidth,
        type: 'shadow',
        data: {
          color: 'darkgray'
        }
      }
      artifactMap[`${s2.x}_${s2.y}`] = s2
      
      let s3 = {
        y: offset.y + x,
        x: offset.x + this.pathWidth + this.tileSize - 1,
        type: 'shadow',
        data: {
          color: 'darkgray'
        }
      }
      artifactMap[`${s3.x}_${s3.y}`] = s3

          
      let s4 = {
        x: offset.x + x,
        y: offset.y + this.pathWidth + this.tileSize - 2,
        type: 'shadow',
        data: {
          color: 'darkgray'
        }
      }
      artifactMap[`${s4.x}_${s4.y}`] = s4
    }
    for (let x = this.pathWidth; x < this.pathWidth + this.tileSize; x++) {

      let s5 = {
        x: offset.x + x,
        y: offset.y + this.pathWidth + this.tileSize - 1,
        type: 'shadow',
        data: {
          color: 'lightslategray'
        }
      }
      artifactMap[`${s5.x}_${s5.y}`] = s5
    }    
    return artifactMap;
  }

  createShadows = (shadowMap, s) => {
    let boundingBox = {
      x: s.x - 2 + this.pathWidth,
      w: 40,
      y: s.y + 6 + this.pathWidth,
      h: 25
    }
    if (s.data.direction.enter == 'u') {
      boundingBox = {
        x: s.x - 2 + this.pathWidth,
        w: 40,
        y: s.y + 14 + this.pathWidth,
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
      x: offset.x,
      y: offset.y,
      data: {
        ...trainData
      }
    }
    return trainPoint
  }
}