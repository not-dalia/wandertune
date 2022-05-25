const pixelSize = 4;

function tree(type) {
  return {
    type,
    src: `/tiles/forest/${type}.png`,
    width: 52 / pixelSize,
    height: 52 / pixelSize,
    boundary: {
      x: 4,
      y: 6,
      w: 5,
      h: 4
    },
    shadow: `/tiles/forest/shadow.png`
  }
}

function getRandomInt(upperLimit) {
  return Math.floor(Math.random() * upperLimit)
}

function getPathRow(path) {
  let pathWidth = getRandomInt(path.max_w - path.min_w) + path.min_w;
  let rowPoints = new Array(pathWidth).fill({}).map((p, i) => {
    if ((i == 0 || i == pathWidth - 1) && path.stroke) {
      return {
        type: 'stroke',
        color: path.stroke
      }
    } else {
      return {
        type: 'fill',
        color: path.color
      }
    }
  });
  return [ ...(new Array(getRandomInt(path.max_w - pathWidth))), ...rowPoints];
}

function createPath(tileSize, path) {
  let pointsMap = {};
  let midPoint = Math.round(tileSize / 2);
  let lastPathrow;
  /* for (let py = 0; py < tileSize; py++) {
    let pathRow;
    if (py == 0) {
      pathRow = getPathRow(path);
    } else {
      let newPathChance = getRandomInt(100);
      if (newPathChance < 10) {
        pathRow = getPathRow(path);
      } else {
        pathRow = lastPathrow
      }
    }
    lastPathrow = [...pathRow]
    pathRow.forEach((p, i) => {
      if (!p) return;
      let pathPoint = {
        type: 'path',
        x: midPoint - Math.round(pathRow.length / 2) + i,
        y: py,
        data: { ...p }
      }
      pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
    })
  }

  for (let px = 0; px < tileSize; px++) {
    let pathRow;
    if (px == 0) {
      pathRow = getPathRow(path);
    } else {
      let newPathChance = getRandomInt(100);
      if (newPathChance < 10) {
        pathRow = getPathRow(path);
      } else {
        pathRow = lastPathrow
      }
    }
    lastPathrow = [...pathRow]
    pathRow.forEach((p, i) => {
      if (!p) return;
      let pathPoint = {
        type: 'path',
        x: px,
        y: midPoint - Math.round(pathRow.length / 2) + i,
        data: { ...p }
      }
      if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
      pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
    })
  } */

  for (let ex = 0; ex < tileSize; ex++) {
    let pathRow;
    if (ex == 0) {
      pathRow = getPathRow(path);
    } else {
      let newPathChance = getRandomInt(100);
      if (newPathChance < 10) {
        pathRow = getPathRow(path);
      } else {
        pathRow = lastPathrow
      }
    }
    lastPathrow = [...pathRow]
    pathRow.forEach((p, i) => {
      if (!p) return;
      let pathPoint1 = {
        type: 'path',
        x: ex,
        y: 0 - Math.round(pathRow.length / 2) + i,
        data: { ...p }
      }
      if (pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] && pointsMap[`${pathPoint1.x}_${pathPoint1.y}`].data.type == 'fill') return
      if (pathPoint1.y >= 0) pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] = pathPoint1

      let pathPoint2 = {
        type: 'path',
        x: ex,
        y: tileSize - Math.round(pathRow.length / 2) + i,
        data: { ...p }
      }
      if (pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] && pointsMap[`${pathPoint2.x}_${pathPoint2.y}`].data.type == 'fill') return
      if (pathPoint1.y <= tileSize) pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] = pathPoint2

      
    })
  }

  for (let ey = 0; ey < tileSize; ey++) {
    let pathRow;
    if (ey == 0) {
      pathRow = getPathRow(path);
    } else {
      let newPathChance = getRandomInt(100);
      if (newPathChance < 10) {
        pathRow = getPathRow(path);
      } else {
        pathRow = lastPathrow
      }
    }
    lastPathrow = [...pathRow]
    pathRow.forEach((p, i) => {
      if (!p) return;
      let pathPoint1 = {
        type: 'path',
        x: 0 - Math.round(pathRow.length / 2) + i,
        y: ey,
        data: { ...p }
      }
      if (pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] && pointsMap[`${pathPoint1.x}_${pathPoint1.y}`].data.type == 'fill') return
      if (pathPoint1.x >= 0) pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] = pathPoint1

      let pathPoint2 = {
        type: 'path',
        x: tileSize - Math.round(pathRow.length / 2) + i,
        y: ey,
        data: { ...p }
      }
      if (pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] && pointsMap[`${pathPoint2.x}_${pathPoint2.y}`].data.type == 'fill') return
      if (pathPoint1.x <= tileSize) pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] = pathPoint2

      
    })
  }
  return pointsMap;
}

function getTreeQuarter(tileQuarter, trees, treeMap, offsetX = 0, offsetY = 0) {
  let treeCount = getRandomInt(20) + 24;
  for (let t = 0; t < treeCount; t++) {
    let tree = trees[getRandomInt(trees.length)];
    let tx = getRandomInt(tileQuarter - (tree.boundary.x + tree.boundary.w)) + 2 + offsetX;
    let ty = getRandomInt(tileQuarter - (tree.boundary.y + tree.boundary.h) + 1) + 1 + offsetY;
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
      data: { ...tree }
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

function getTreeShadows(treeMap) {
  let treeKeys = Object.keys(treeMap);
  let shadowMap = {}
  treeKeys.forEach(k => {
    let t = treeMap[k];
    if (t.type != 'tree') return;
    let boundingBox = {
      x: t.x - 3,
      w: 9,
      y: t.y + t.data.height/2 - 1,
      h: 4
    }
    for (let sx = boundingBox.x; sx < boundingBox.x + boundingBox.w; sx++) {
      for (let sy = boundingBox.y; sy < boundingBox.y + boundingBox.h; sy++) {
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

function createTrees(tileSize, trees, boundary) {
  let treeMap = {};
  let tileQuarter = (tileSize - 2 * boundary) / 2;
  treeMap = getTreeQuarter(tileSize - 2, trees, treeMap, 1, 1);
  let shadowMap = getTreeShadows(treeMap);
  // getTreeQuarter(tileQuarter, trees, treeMap, tileQuarter + boundary);
  // getTreeQuarter(tileQuarter, trees, treeMap, 0, tileQuarter + boundary);
  // getTreeQuarter(tileQuarter, trees, treeMap, tileQuarter + boundary, tileQuarter + boundary);


  return {treeMap, shadowMap};
}

function createArtifacts(tileSize, artifacts, artifactColor) {
  let artifactMap = {};
  let artifactCount = getRandomInt(20) + 15;
  for (let t = 0; t < artifactCount; t++) {
    let artifact = artifacts[getRandomInt(artifacts.length)];
    let tx = getRandomInt(tileSize - 8) + 4;
    let ty = getRandomInt(tileSize - 8) + 4;
    artifact.forEach(p => {
      let a = {
        type: 'artifact',
        x: tx + p[0],
        y: ty + p[1],
        data: {
          color: artifactColor
        }
      }

      artifactMap[`${a.x}_${a.y}`] = a
    })
  }
  return artifactMap;
}

const tileDefinitions = {
	forest: {
    seasons: {
      summer: {
        trees: [ tree('tree_1'), tree('tree_2'), tree('tree_3')],
        color: '#71c62b',
        artifactColor: '#96e057',
      },
      spring: {
        trees: [ tree('tree_1'), tree('tree_4'), tree('tree_5')],
        color: '#71c62b',
        artifactColor: '#96e057',
      },
      autumn: {
        trees: [ tree('tree_6'), tree('tree_7'), tree('tree_8')],
        color: '#f7c834',
        artifactColor: '#ec7300',
      },
      winter: {
        trees: [ tree('tree_3'), tree('tree_9'), tree('tree_10')],
        color: '#f0f8ff',
        artifactColor: '#bdecff',
      },
    },
    path: {
      min_w: 2,
      max_w: 5,
      color: '#726d67',
      stroke: '#fbe193',
      boundary: {
        w: 6
      }
    },
    artifacts: [
      [[0, 0], [1, 1], [2, 0], [3, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 1], [1, 0], [2, 1]],
      [[0, 0]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [1, 1], [2, 1], [0, 2]]
    ],
    createTile: (realTileSize, season) => {
      if (!season) {
        let seasons = Object.keys(tileDefinitions.forest.seasons);
        season = seasons[getRandomInt(seasons.length)];
      }
      let tileSize = (realTileSize / pixelSize);
      let pathMap = createPath(tileSize, tileDefinitions.forest.path);
      let {treeMap: objectsMap, shadowMap} = createTrees(tileSize, tileDefinitions.forest.seasons[season].trees, tileDefinitions.forest.path.boundary.w);
      let artifactMap = createArtifacts(tileSize, tileDefinitions.forest.artifacts, tileDefinitions.forest.seasons[season].artifactColor);
      return {
        type: 'forest',
        season: season,
        color: tileDefinitions.forest.seasons[season].color,
        pathMap,
        objectsMap,
        shadowMap,
        artifactMap
      }
    }
	}
}

function randomTile(tileSize) {
  let tileTypes = Object.keys(tileDefinitions);
  let type = getRandomInt(tileTypes.length);
  return tileDefinitions[tileTypes[type]].createTile(tileSize)
}
