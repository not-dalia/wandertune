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
          this.boundary = [{
            y: 29,
            x: 0,
            h: 23,
            w: 80,
          }]
        } else {
          this.rotation = randomInt(4, 'even')
          this.boundary = [{
            x: 29,
            y: 0,
            w: 23,
            h: 80,
          }]
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
        this.boundary = [{
          x: 28,
          y: (this.direction.exit == 'u' || this.direction.enter == 'u') ? 0 : 80 - 53,
          w: 25,
          h: 53,
        }, {
          x: (this.direction.exit == 'l' || this.direction.enter == 'l') ? 0 : 80 - 50,
          y: 28,
          w: 50,
          h: 25,
        }]
        break;
      case 'lake':
        // Lakes have no exits
        this.src = `tiles/river/river-${this.subtype}-${this.direction.enter}.png`
        this.direction.exit = null
        this.boundary = [{
          x: 0,
          y: 0,
          w: 80,
          h: 80,
        }]
        break;
    }
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
      trees: {
        summer: [new Tree('tree_2'), new Tree('tree_1'), new Tree('tree_3')],
        spring: [new Tree('tree_1'), new Tree('tree_1'), new Tree('tree_1'), new Tree('tree_4')],
        autumn: [new Tree('tree_6'), new Tree('tree_7'), new Tree('tree_8'), new Tree('tree_11')],
        winter: [new Tree('tree_tall_1'), new Tree('tree_tall_2'), new Tree('tree_tall_3')]
      },
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
    this.season.setTrees(seasonsData.trees[season]);
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.pixelSize = pixelSize;
    this.pathBuilder = new PathBuilder(tileSize, pathWidth, this.season.color)
    this.type = 'river';
    this.subtype = subtype;
    this.direction = direction;
    this.color = this.season.color;
    this.river = (new River(this.subtype, this.direction)).data
    this.treeBusyAreas = []

    const directions = ['u', 'r', 'd', 'l'];

    if (!this.subtype) {
      this.subtype = this._riverPaths[randomInt(this._riverPaths.length)];
    }
    if (!this.direction) {
      this.direction = directions[randomInt(directions.length)];
    }

    // this.createTile()
  }

  createTile = ({objectsMap={}, shadowMap={}, artifactMap={}, busyAreas={}, hasStreets={}}, areaSize, offset) => {
    this.busyAreas = busyAreas
    // this.pathMap = this.pathBuilder.makePath();
    this.createArtifacts(artifactMap, areaSize, offset, busyAreas, 20, 10);
    let riverPoint = this.createRiver(objectsMap, offset);
    this.bridges = this.createBridges(riverPoint.data.direction);
    this.pathMap = this.pathBuilder.makePathFrame(hasStreets, areaSize, offset);
    this.createTrees(objectsMap, areaSize, offset)
    this.extraData = {
      subtype: this.river.subtype,
      direction: this.river.direction,
      rotation: this.river.rotation
    }
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

  createBridges = (direction) => {
    let bridges = []
    let tileSize = this.tileSize;

    if (direction.enter == 'l' || direction.exit == 'l') {
      bridges.push({
        type: 'bridge',
        y: (tileSize - 10) / 2 + this.pathWidth/2 + 2.5,
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
        x: (tileSize - 10) / 2 + this.pathWidth/2 + 2.5,
        y: 0,
        data: {
          rotation: 0,
          src: `tiles/river/bridge_h.png`,
          height: 20,
          width: 8,
        }
      })
    }
    if (direction.enter == 'r' || direction.exit == 'r') {
      bridges.push({
        type: 'bridge',
        y: (tileSize - 10) / 2 + this.pathWidth/2 + 2.5,
        x: this.tileSize + this.pathWidth,
        data: {
          rotation: 0,
          src: `tiles/river/bridge.png`,
          width: 8,
          height: 20,
        }
      })
    }
    if (direction.enter == 'd' || direction.exit == 'd') {
      bridges.push({
        type: 'bridge',
        x: (tileSize - 10) / 2 + this.pathWidth/2 + 2.5,
        y: this.tileSize + this.pathWidth,
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

  createRiver = (objectsMap, offset) => {
    let riverData = this.river
    let riverPoint = {
      type: 'river',
      x: this.pathWidth + offset.x,
      y: this.pathWidth + offset.y,
      data: {
        ...riverData
      }
    }
    objectsMap[`${riverPoint.x}_${riverPoint.y}`] = riverPoint; 
    this.boundary = []
    this.river.boundary.forEach(b => {
      let riverBoundary = {
        minX: offset.x + b.x,
        minY: offset.y + b.y,
        maxX: offset.x + b.x + b.w,
        maxY: offset.y + b.y + b.h,
        type: 'river'
      }
      this.busyAreas.insert(riverBoundary)
      this.boundary.push(riverBoundary)
    })
    return riverPoint;
  }
}
