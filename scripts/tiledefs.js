const pixelSize = 4;
const directions = ['u', 'r', 'd', 'l']
let currentSeason = 'spring'

function point(x, y, color) {
  return {
    x,
    y,
    color
  }
}

function tree(type, ext = 'png') {
  let boundary = {}
  let width;
  switch (type) {
    case 'tree_1':
    boundary = {
      x: -1,
      y: 2,
      w: 22,
      h: 18
    }
    break;
    case 'tree_2':
    boundary = {
      x: 4,
      y: 14,
      w: 12,
      h: 6
    }
    break;
    case 'tree_3':
    width = 76
    boundary = {
      x: 2,
      y: 4,
      w: 16,
      h: 16
    }
    break;
    case 'tree_4':
    boundary = {
      x: -1,
      y: 4,
      w: 22,
      h: 16
    }
    break;
  }
  return {
    type,
    src: `tiles/forest/${type}.${ext}`,
    width: (width || 80) / pixelSize,
    height: 80 / pixelSize,
    boundary: {
      x: 7,
      y: 14,
      w: 6,
      h: 6
    },
    shadow: `tiles/forest/shadow.png`
  }
}

// let globalRotation = 0;

function river(type, direction) {
  let exitDirection = 'r';
  let rotation;
  let src = `tiles/river/river-${type}.png`;
  switch (type) {
    case 'straight':
      if (direction == 'l' || direction == 'r') {
        rotation = getRandomInt(2) * 2 + 1
      } else {
        rotation = getRandomInt(2) * 2
      }
      exitDirection = directions[(directions.indexOf(direction) + 2) % 4]
      break;
    case 'bend':
      rotation = (directions.indexOf(direction) - getRandomInt(2)) % 4
      exitDirection = (directions.indexOf(direction) == rotation) ? directions[(directions.indexOf(direction) + 1) % 4] : directions[(directions.indexOf(direction) - 1) < 0 ? 3 : directions.indexOf(direction) - 1]
      break;
    case 'lake':
      // rotation = directions.indexOf(direction)
      src = `tiles/river/river-${type}-${direction}.png`
      exitDirection = null
      break;
  }

  // rotation = globalRotation%4;
  // globalRotation++;

  return {
    type,
    src,
    width: 200 / pixelSize,
    height: 200 / pixelSize,
    direction: {
      enter: direction,
      exit: exitDirection
    },
    rotation
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
  return [...(new Array(getRandomInt(path.max_w - pathWidth))), ...rowPoints];
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
        data: {
          ...p
        }
      }
      if (pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] && pointsMap[`${pathPoint1.x}_${pathPoint1.y}`].data.type == 'fill') return
      if (pathPoint1.y >= 0 && pathPoint1.y < 10) pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] = pathPoint1

      let pathPoint2 = {
        type: 'path',
        x: ex,
        y: tileSize - Math.round(pathRow.length / 2) + i - 1,
        data: {
          ...p
        }
      }
      if (pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] && pointsMap[`${pathPoint2.x}_${pathPoint2.y}`].data.type == 'fill') return
      if (pathPoint1.y <= tileSize - 2 && pathPoint1.y > -1) pointsMap[`${pathPoint2.x}_${pathPoint2.y - 1}`] = pathPoint2
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
        data: {
          ...p
        }
      }
      if (pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] && pointsMap[`${pathPoint1.x}_${pathPoint1.y}`].data.type == 'fill') return
      if (pathPoint1.x >= 0 && pathPoint1.x < 3) pointsMap[`${pathPoint1.x}_${pathPoint1.y}`] = pathPoint1

      let pathPoint2 = {
        type: 'path',
        x: tileSize - Math.round(pathRow.length / 2) + i,
        y: ey,
        data: {
          ...p
        }
      }
      if (pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] && pointsMap[`${pathPoint2.x}_${pathPoint2.y}`].data.type == 'fill') return
      if (pathPoint2.x <= tileSize && pathPoint2.x > 47) pointsMap[`${pathPoint2.x}_${pathPoint2.y}`] = pathPoint2


    })
  }
  return pointsMap;
}

function getTreeQuarter(tileQuarter, trees, treeMap, offsetX = 0, offsetY = 0) {
  // let treeCount = 1 ;
  let treeCount = getRandomInt(5) + 5;
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

function getTreeShadows(treeMap) {
  let treeKeys = Object.keys(treeMap);
  let shadowMap = {}
  treeKeys.forEach(k => {
    let t = treeMap[k];
    if (t.type != 'tree') return;
    let boundingBox = {
      x: t.x - (t.data.width - ( t.data.width - 4)) + 1,
      w: t.data.width - 4,
      y: t.y + (t.data.height - 6) - 4,
      h: 8
    }
    let xRows = new Array(boundingBox.h).fill(0).map((e, i) => {
      if (i >= boundingBox.h / 2) {
        return boundingBox.w - (i - boundingBox.h / 2) * 2
      } else {
        return boundingBox.w - ((boundingBox.h / 2 - (i + 1))) * 2
      }
    })
    for (let sy = boundingBox.y; sy < boundingBox.y + boundingBox.h; sy++) {
      for (let sx = boundingBox.x; sx < boundingBox.x + boundingBox.w; sx++) {
        // if ((sx == boundingBox.x || sx == boundingBox.x + boundingBox.w - 1) && (sy == boundingBox.y || sy == boundingBox.y + boundingBox.h - 1)) continue;
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

function createTrees(tileSize, trees, boundary) {
  let treeMap = {};
  let tileQuarter = (tileSize - 2 * boundary) / 2;
  treeMap = getTreeQuarter(tileSize - 2, trees, treeMap, 1, 1);
  let shadowMap = getTreeShadows(treeMap);
  // getTreeQuarter(tileQuarter, trees, treeMap, tileQuarter + boundary);
  // getTreeQuarter(tileQuarter, trees, treeMap, 0, tileQuarter + boundary);
  // getTreeQuarter(tileQuarter, trees, treeMap, tileQuarter + boundary, tileQuarter + boundary);


  return {
    treeMap,
    shadowMap
  };
}

function createArtifacts(tileSize, artifacts, countMin, countRand) {
  let artifactMap = {};
  let artifactCount = getRandomInt(countRand) + countMin;
  for (let t = 0; t < artifactCount; t++) {
    let artifact = artifacts[getRandomInt(artifacts.length)];
    let tx = getRandomInt(tileSize - 12) + 6;
    let ty = getRandomInt(tileSize - 12) + 6;
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



function createBridges(tileSize, direction) {
  let bridges = []
  if (direction.enter == 'l' || direction.exit == 'l') {
    rotation = 0
    bridges.push({
      type: 'bridge',
      y: (tileSize - 10) / 2,
      x: 0,
      data: {
        rotation,
        src: `tiles/river/bridge.png`,
        width: 8,
        height: 20,
      }
    })
  }
  if (direction.enter == 'u' || direction.exit == 'u') {
    rotation = 0
    bridges.push({
      type: 'bridge',
      x: (tileSize - 10) / 2,
      y: 0,
      data: {
        rotation,
        src: `tiles/river/bridge_h.png`,
        height: 20,
        width: 8,
      }
    })
  }
  return bridges;
}

function createRiver(type, direction) {
  let riverData = river(type, direction)

  let riverPoint = {
    type: 'river',
    x: pathWidth / 4,
    y: pathWidth / 4,
    data: {
      ...riverData
    }
  }
  return {
    riverMap: [riverPoint]
  };
}

const artifactDefinitions = {
  'dot_b': {
    colors: ['#a3c89b'],
    points: [
      point(0, 0), point(0, 1), point(1, 0), point(1, 1)
    ]
  },
  'dot_s': {
    colors: ['#a3c89b'],
    points: [
      point(0, 0)
    ]
  },
  'flower_1': {
    colors: ['#a3c89b', '#d9682f'],
    points: [
      point(1, 0), point(0, 1), point(1, 1, 1), point(2, 1), point(1, 2)
    ]
  },
  'grass_1': {
    colors: ['#a3c89b'],
    points: [
      point(0, 2), point(2, 2), point(2, 1), point(2, 0), point(4, 2), point(4, 1)
    ]
  },
  'grass_2': {
    colors: ['#a3c89b'],
    points: [
      point(0, 1), point(1, 2), point(2, 0), point(2, 1), point(2, 2), point(3, 2), point(4, 1)
    ]
  },
  'grass_3': {
    colors: ['#a3c89b'],
    points: [
      point(0, 2), point(1, 0), point(2, 1), point(2, 2)
    ]
  },
  'grass_4': {
    colors: ['#a3c89b'],
    points: [
      point(0, 0), point(0, 1), point(0, 2), point(2, 2), point(2, 1)
    ]
  },
  'grass_5': {
    colors: ['#a3c89b'],
    points: [
      point(0, 0), point(0, 1), point(0, 2), point(2, 2), point(2, 1)
    ]
  },
  'grass_6': {
    colors: ['#a3c89b'],
    points: [
      point(0, 0), point(1, 1), point(1, 2), point(3, 0), point(3, 1), point(3, 2), point(4, 2), point(5, 1)
    ]
  }
}

function artifact(type, colors = []) {
  let artifact = {
    ...artifactDefinitions[type],
    type
  }
  artifact.colors = [...artifactDefinitions[type].colors]
  colors.forEach((c, i) => {
    artifact.colors[i] = c
  })
  return artifact
}

const tileDefinitions = {
  forest: {
    seasons: {
      summer: {
        trees: [tree('tree_4'), tree('tree_1'), tree('tree_3')],
        color: '#7fb76f',
        artifactColor: '#a3c89b',
        artifacts: [
          // artifact('dot_b', ['#a3c89b']),
          artifact('grass_2', ['#a3c89b']),
          artifact('grass_3', ['#a3c89b']),
          artifact('grass_4', ['#a3c89b']),
          artifact('grass_5', ['#a3c89b']),
          artifact('grass_6', ['#a3c89b']),
        ]
      },
      spring: {
        trees: [tree('tree_4'), tree('tree_1'), tree('tree_3')],
        color: '#71c62b',
        artifactColor: '#96e057',
        artifacts: [
          artifact('grass_4', ['#96e057']),
          artifact('grass_6', ['#96e057']),
          artifact('flower_1', ['#ffffff']),
          artifact('flower_1', ['#ffffff', '#FFD700']),
          artifact('flower_1', ['#DB7093', '#FFD700']),
        ]
      },
      autumn: {
        trees: [tree('tree_4'), tree('tree_1'), tree('tree_3')],
        color: '#b0b964',
        artifactColor: '#c6d087',
        artifacts: [
          // artifact('dot_b', ['#c6d087']),
          artifact('grass_2', ['#c6d087']),
          artifact('grass_3', ['#c6d087']),
          artifact('grass_4', ['#c6d087']),
          artifact('grass_5', ['#c6d087']),
          artifact('grass_6', ['#c6d087']),
        ]
      },
      winter: {
        trees: [tree('tree_4'), tree('tree_1'), tree('tree_3')],
        color: '#f0f8ff',
        artifactColor: '#bdecff',
        artifacts: [
          artifact('dot_b', ['#bdecff']),
          artifact('grass_2', ['#bdecff']),
          artifact('grass_3', ['#bdecff']),
          artifact('grass_4', ['#bdecff']),
          artifact('grass_5', ['#bdecff']),
          artifact('grass_6', ['#bdecff']),
        ]
      },
    },
    path: {
      min_w: 2,
      max_w: 5,
      color: '#d1a263',
      stroke: '#edc487',
      boundary: {
        w: 6
      }
    },
    createTile: (realTileSize, season) => {
      if (!season) {
        let seasons = Object.keys(tileDefinitions.forest.seasons);
        season = seasons[getRandomInt(seasons.length)];
      }
      let tileSize = (realTileSize / pixelSize);
      let pathMap = createPath(tileSize, tileDefinitions.forest.path);
      let {
        treeMap: objectsMap,
        shadowMap
      } = createTrees(tileSize, tileDefinitions.forest.seasons[season].trees, tileDefinitions.forest.path.boundary.w);
      let artifactMap = createArtifacts(tileSize, tileDefinitions.forest.seasons[season].artifacts, 35, 30);
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
  },
  river: {
    seasons: {
      summer: {
        color: '#7fb76f',
        artifactColor: '#a3c89b',
        artifacts: [
          // artifact('dot_b', ['#a3c89b']),
          artifact('grass_2', ['#a3c89b']),
          artifact('grass_3', ['#a3c89b']),
          artifact('grass_4', ['#a3c89b']),
          artifact('grass_5', ['#a3c89b']),
          artifact('grass_6', ['#a3c89b']),
        ]
      },
      spring: {
        color: '#71c62b',
        artifactColor: '#96e057',
        artifacts: [
          artifact('grass_4', ['#96e057']),
          artifact('grass_6', ['#96e057']),
          artifact('flower_1', ['#ffffff']),
          artifact('flower_1', ['#ffffff', '#FFD700']),
          artifact('flower_1', ['#DB7093', '#FFD700']),
        ]
      },
      autumn: {
        color: '#b0b964',
        artifactColor: '#c6d087',
        artifacts: [
          // artifact('dot_b', ['#c6d087']),
          artifact('grass_2', ['#c6d087']),
          artifact('grass_3', ['#c6d087']),
          artifact('grass_4', ['#c6d087']),
          artifact('grass_5', ['#c6d087']),
          artifact('grass_6', ['#c6d087']),
        ]
      },
      winter: {
        color: '#f0f8ff',
        artifactColor: '#bdecff',
        artifacts: [
          artifact('dot_b', ['#bdecff']),
          artifact('grass_2', ['#bdecff']),
          artifact('grass_3', ['#bdecff']),
          artifact('grass_4', ['#bdecff']),
          artifact('grass_5', ['#bdecff']),
          artifact('grass_6', ['#bdecff']),
        ]
      },
    },
    riverPath: ['straight', 'bend', 'lake'],
    bridge: 'bridge',
    path: {
      min_w: 2,
      max_w: 5,
      color: '#d1a263',
      stroke: '#edc487',
      boundary: {
        w: 6
      }
    },
    createTile: (realTileSize, season, direction, type) => {
      if (!season) {
        let seasons = Object.keys(tileDefinitions.forest.seasons);
        season = seasons[getRandomInt(seasons.length)];
      }
      if (!type) {
        type = tileDefinitions.river.riverPath[getRandomInt(tileDefinitions.river.riverPath.length)];
      }
      if (!direction) {
        direction = directions[getRandomInt(directions.length)];
      }
      let tileSize = (realTileSize / pixelSize);
      let pathMap = createPath(tileSize, tileDefinitions.river.path);
      let artifactMap = createArtifacts(tileSize, tileDefinitions.river.seasons[season].artifacts, 20, 10);
      let {
        riverMap: objectsMap
      } = createRiver(type, direction);
      let bridges = createBridges(tileSize, objectsMap[0].data.direction)
      return {
        type: 'river',
        riverType: type,
        season: season,
        color: tileDefinitions.forest.seasons[season].color,
        pathMap,
        objectsMap,
        artifactMap,
        bridges
      }
    }
  }
}

function randomTile(tileSize) {
  let tileTypes = Object.keys(tileDefinitions);
  let type = getRandomInt(tileTypes.length);
  // return tileDefinitions[tileTypes[type]].createTile(tileSize)
  return tileDefinitions['forest'].createTile(tileSize, currentSeason)
}

function riverStart(tileSize, direction) {
  return tileDefinitions['river'].createTile(tileSize, currentSeason, direction, ['bend', 'straight'][getRandomInt(2)])
}