
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
    this.season.setBuildings(seasonsData.buildings[season]);
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.pixelSize = pixelSize;
    this.type = 'buildings';
    this.color = this.season.color;
    this.pathColor = '#303e44'
    this.pathBuilder = new PathBuilder(this.tileSize, this.pathWidth, this.season.color)
    this.objectKeys = []
    // this.createTile()
  }

  createTile = ({objectsMap={}, shadowMap={}, artifactMap={}, busyAreas={}}, areaSize, offset) => {
    this.pathMap = this.pathBuilder.makePath(true);
    this.createBuildings(objectsMap, areaSize, offset);
    this.createShadows(shadowMap, objectsMap)
    this.createArtifacts(artifactMap, areaSize, offset, busyAreas, 20, 10);
    this.streetMap = this.createStreets();
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