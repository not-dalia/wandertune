import { Tile, TileObject, PathBuilder } from '../index.js'
import { Season } from './season.js'

let treeShadowRows = {}

class Tree extends TileObject {
  constructor(type, ext = 'png') {
    super();

    this.type = 'tree';
    this.subtype = type;
    this.width = 20;
    this.height = 20;
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
    this.color = this.season.color;
    this.treeBusyAreas = [];
    // this.createTile()
  }

  createTile = ({objectsMap={}, shadowMap={}, artifactMap={}, busyAreas={}, hasStreets={}}, areaSize, offset) => {
    this.busyAreas = busyAreas
    this.createTrees(objectsMap, areaSize, offset);
    this.createShadows(shadowMap, objectsMap)
    this.createArtifacts(artifactMap, areaSize, offset, busyAreas, 35, 30);
    // console.log(hasStreets)
    this.pathMap = this.pathBuilder.makePathFrame(hasStreets, areaSize, offset);
    return {objectsMap, shadowMap, artifactMap}
  }

  createTrees = (treeMap, areaSize, offset) => {
    // let treeCount = 1;
    let treeCount = randomInt(10) + 15;
    for (let t = 0; t < treeCount; t++) {
      let tree = this.season.trees[randomInt(this.season.trees.length)].data;

      // create a random point inside of the area so that tree boundaries are contained within
      let tx = randomInt(areaSize.w - (tree.boundary.x + tree.boundary.w) + 1) + areaSize.x + offset.x;
      let ty = randomInt(areaSize.h - (tree.boundary.y + tree.boundary.h) + 1) + areaSize.y + offset.y;

      let treeBoundaryX = [tx + tree.boundary.x, tx + tree.boundary.x + tree.boundary.w];
      let treeBoundaryY = [ty + tree.boundary.y, ty + tree.boundary.y + tree.boundary.h];
      let treeBoundaryItem = {
        minX: treeBoundaryX[0],
        maxX: treeBoundaryX[1],
        minY: treeBoundaryY[0],
        maxY: treeBoundaryY[1],
        type: 'tree'
      }

      let canPlant = !this.busyAreas.collides(treeBoundaryItem);
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
      /* for (let tbx = treeBoundaryX[0]; tbx <= treeBoundaryX[1]; tbx++) {
        for (let tby = treeBoundaryY[0]; tby <= treeBoundaryY[1]; tby++) {
          this.busyAreas[`${tbx}_${tby}`] = true
        }
      } */

      this.busyAreas.insert(treeBoundaryItem)
      this.treeBusyAreas.push(treeBoundaryItem)
    }
    this.treeBusyAreas.forEach(item => {
      this.busyAreas.remove(item)
    })
    return treeMap;
  }

  createShadows = (shadowMap, objectsMap) => {
    let treeMap = objectsMap;
    let treeKeys = Object.keys(treeMap);
    treeKeys.forEach(k => {
      let t = treeMap[k];
      if (t.type != 'tree') return;
      let boundingBox = {
        x: t.x + 2,
        w: t.data.width - 4,
        y: t.y + t.data.height - 5,
        h: 8
      }

      // Make rounded shadows. Rows increase width by 2 every step until half of shadow height then decrease 2
      if (!treeShadowRows[t.data.subtype]) {
        treeShadowRows[t.data.subtype] = []
        let zeroBoundingBox = {
          x: 2,
          w: t.data.width - 4,
          y: t.data.height - 5,
          h: 8
        }
        let xRows = new Array(zeroBoundingBox.h).fill(0).map((e, i) => {
          if (i >= zeroBoundingBox.h / 2) {
            return zeroBoundingBox.w - (i - zeroBoundingBox.h / 2) * 2
          } else {
            return zeroBoundingBox.w - ((zeroBoundingBox.h / 2 - (i + 1))) * 2
          }
        })
        for (let sy = zeroBoundingBox.y; sy < zeroBoundingBox.y + zeroBoundingBox.h; sy++) {
          for (let sx = zeroBoundingBox.x; sx < zeroBoundingBox.x + zeroBoundingBox.w; sx++) {
            let missingCorner = (zeroBoundingBox.w - xRows[sy - zeroBoundingBox.y]) / 2
            if (sx - zeroBoundingBox.x < missingCorner || sx - zeroBoundingBox.x >= missingCorner + xRows[sy - zeroBoundingBox.y]) continue;
            treeShadowRows[t.data.subtype].push([sx, sy])
          }
        }
      }
      let zeroShadow = treeShadowRows[t.data.subtype]
      zeroShadow.forEach(p => {
        let sy = p[1] + t.y
        let sx = p[0] + t.x
        if (!shadowMap[sy]) shadowMap[sy] = {}
        shadowMap[sy][sx] = true
      })
    })
    return shadowMap
  }
}

export { ForestTile, Tree }