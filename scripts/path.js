class PathBuilder {
  constructor(tileSize, pathWidth, tileColor, pathColor = 'rgba(0,0,0,0.1)') {
    this.tileSize = tileSize;
    this.pathWidth = pathWidth;
    this.minW = 2;
    this.maxW = 5;
    // this.color = 'rgba(0,0,0,0.1)';
    this.color = '#546e7a';
    //edc487
    this.stroke = pathColor;
    this.tileColor = tileColor;
    this.boundary = {
      w: 6
    }
  }

  makePathEdge = (rowWidth, tileSize) => {
    tileSize = tileSize ?? this.tileSize
    let lastPathValue = 0;
    let pathRowArr = new Array(tileSize).fill({}).map((_, i) => {
      if (i == 0) {
      } else if (i >= tileSize - 4) {
        lastPathValue = Math.max(0, Math.min(lastPathValue - 1, 3))
      } else {
        let newPathChance = randomInt(100);
        if (newPathChance < 10) {
          lastPathValue = Math.max(1, Math.min(lastPathValue + [1, -1][randomInt(2)], 3))
        }
      }
      return this.getPathRow(lastPathValue, rowWidth);
    })
    return pathRowArr;
  }

  makeFrame = (rowWidth) => {
    let pointsMap = {};
  
    let bottomEdgePath = this.makePathEdge(rowWidth = 4, this.tileSize + 2 * this.pathWidth)
    bottomEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          x: (this.tileSize - 1 - ex),
          y: this.tileSize + this.pathWidth * 2 + (rowWidth - i) - rowWidth - 3,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let topEdgePath = this.makePathEdge(rowWidth, this.tileSize + 2 * this.pathWidth)
    topEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          x: (this.tileSize - 1 - ex),
          y: i ,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let leftEdgePath = this.makePathEdge(rowWidth, this.tileSize + 2 * this.pathWidth)
    leftEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          y: ex,
          x: i ,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let rightEdgePath = this.makePathEdge(rowWidth, this.tileSize + 2 * this.pathWidth)
    rightEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          y: ex,
          x: this.tileSize + this.pathWidth * 2 + (rowWidth - i) - rowWidth,
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

  makePath = (withFrame, rowWidth = 3) => {
    let pointsMap = {};
  
    let bottomEdgePath = this.makePathEdge(rowWidth)
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

    let topEdgePath = this.makePathEdge(rowWidth)
    topEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          x: (this.tileSize - 1 - ex) + this.pathWidth,
          y: (3-i) - 1 + this.pathWidth ,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })

    let leftEdgePath = this.makePathEdge(rowWidth)
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

    let rightEdgePath = this.makePathEdge(rowWidth)
    rightEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          y: (this.tileSize - 1 - ex) + this.pathWidth,
          x: this.tileSize - Math.round(pathRow.length / 2) + i + this.pathWidth ,
          data: {
            ...p
          }
        }
        if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
        pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
      })
    })
    // if (withFrame) pointsMap = {...pointsMap, ...this.makeFrame(rowWidth)}
    return pointsMap;
  }

  getPathRow = (position, rowWidth) => {
    let rowPoints = new Array(rowWidth).fill({ }).map((_, i) => {
      if (i == position) {
        return {
          type: 'stroke',
          color: this.stroke
          // color: 'pink'
        }
      } else if (i == position - 1) {
        return {
          type: 'fill',
          color: this.tileColor
          // color: 'rgba(0,0,0,0.0.05)'
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