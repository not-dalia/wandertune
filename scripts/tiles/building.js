
class Building extends TileObject {
  constructor(type, ext = 'png') {
    super();
    this.type = 'building';
    this.subtype = type;
    this.width = 24;
    this.height = 30;
    this.src = `tiles/building/${type}.${ext}`;
  }
}

class BuildingsTile extends Tile {
  constructor({
    season,
    tileSize,
    pathWidth,
    pixelSize,
    type
  }) {
    super();
    const seasonsData = {
      buildings: {
        summer: [new Building('building_1'), new Building('building_2'), new Building('building_3')],
        spring: [new Building('building_1'), new Building('building_2'), new Building('building_3')],
        autumn: [new Building('building_1'), new Building('building_2'), new Building('building_3')],
        winter: [new Building('building_1'), new Building('building_2'), new Building('building_3')]
      },
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
    this.season.setBuildings(seasonsData.buildings[season]);
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.pixelSize = pixelSize;
    this.type = 'buildings';
    this.color = '#dcdcdc';
    this.pathColor = '#303e44'
    this.pathBuilder = new PathBuilder(this.tileSize, this.pathWidth, this.season.color)
    this.objectKeys = []
    // this.createTile()
  }

  createTile = ({objectsMap={}, shadowMap={}, artifactMap={}, busyAreas={}}, areaSize, offset) => {
    // this.pathMap = this.pathBuilder.makePath(true);
    this.createBuildings(objectsMap, areaSize, offset);
    this.createShadows(shadowMap, objectsMap, areaSize, offset)
    this.createArtifacts(artifactMap, areaSize, offset, busyAreas, 10, 5);
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

  createBuildings = (objectsMap, areaSize, offset) => {
    let buildingsMap = objectsMap;
    let buildingTypes = [... this.season.buildings]
    for (let t = 0; t < 2; t++) {
      let buildingIndex = randomInt(buildingTypes.length);
      let building = buildingTypes[buildingIndex].data;
      buildingTypes.splice(buildingIndex, 1);
      let tx = t * building.width + areaSize.x + offset.x - 1 - (1*t);
      let ty =  areaSize.y + offset.y - 14 + randomInt(16);
      let buildingPoint = {
        type: 'building',
        x: tx,
        y: ty,
        data: {
          ...building
        }
      }
      buildingsMap[`${buildingPoint.x}_${buildingPoint.y}`] = buildingPoint
      this.objectKeys.push([`${buildingPoint.x}_${buildingPoint.y}`])
    }

    return buildingsMap;
  }

  createShadows = (shadowMap, objectMap) => {
    let buildingsMap = objectMap;
    this.objectKeys.forEach(k => {
      let t = buildingsMap[k];
      let boundingBox = {
        x: t.x,
        w: 23,
        y: t.y + 28,
        h: 16
      }

      for (let sy = boundingBox.y; sy < boundingBox.y + boundingBox.h; sy++) {
        for (let sx = boundingBox.x; sx < boundingBox.x + boundingBox.w; sx++) {
          if ((sx == boundingBox.x || sx == boundingBox.x + boundingBox.w - 1) && (sy == boundingBox.y || sy == boundingBox.y + boundingBox.h - 1)) continue;
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