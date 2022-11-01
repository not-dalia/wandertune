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
        lastPathValue = Math.min(0, Math.min(lastPathValue - 1, 3))
      } else {
        let newPathChance = randomInt(100);
        if (newPathChance < 30) {
          lastPathValue = Math.max(1, Math.min(lastPathValue + [1, -1][randomInt(2)], 3))
        }
      }
      return this.getPathRow(lastPathValue, rowWidth);
    })
    return pathRowArr;
  }

  makePathFrame = (directions, areaSize) => {
    let rowWidth = 2;
    let pointsMap = {};

    if (directions.u) {
      let topEdgePath = this.makePathEdge(rowWidth, areaSize.w + 2)
      topEdgePath.forEach((pathRow, ex) => {
        pathRow.forEach((p, i) => {
          if (!p) return;
          let pathPoint = {
            type: 'path',
            x: areaSize.x + ex + 1,
            y: (i) + areaSize.y - 2 * rowWidth,
            data: {
              ...p
            }
          }
          if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
          pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
        })
      })
    }

    if (directions.d) {
      let bottomEdgePath = this.makePathEdge(rowWidth, areaSize.w + 2)
      bottomEdgePath.forEach((pathRow, ex) => {
        pathRow.forEach((p, i) => {
          if (!p) return;
          let pathPoint = {
            type: 'path',
            x: areaSize.x + ex + 1,
            y: (rowWidth - i) + areaSize.h + areaSize.y + rowWidth - 1,
            data: {
              ...p
            }
          }
          if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
          pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
        })
      })
    }

    if (directions.r) {
      let rightEdgePath = this.makePathEdge(rowWidth, areaSize.h + 2)
      rightEdgePath.forEach((pathRow, ex) => {
        pathRow.forEach((p, i) => {
          if (!p) return;
          let pathPoint = {
            type: 'path',
            x: (rowWidth - i) + areaSize.w + areaSize.x + rowWidth - 1,
            y: areaSize.y + ex + 1,
            data: {
              ...p
            }
          }
          if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
          pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
        })
      })
    }

    if (directions.l) {
      let leftEdgePath = this.makePathEdge(rowWidth, areaSize.h + 2)
      leftEdgePath.forEach((pathRow, ex) => {
        pathRow.forEach((p, i) => {
          if (!p) return;
          let pathPoint = {
            type: 'path',
            x: (i) + areaSize.x - 2 * rowWidth,
            y: areaSize.y + ex + 1,
            data: {
              ...p
            }
          }
          if (pointsMap[`${pathPoint.x}_${pathPoint.y}`] && pointsMap[`${pathPoint.x}_${pathPoint.y}`].data.type == 'fill') return
          pointsMap[`${pathPoint.x}_${pathPoint.y}`] = pathPoint
        })
      })
    }
    

    return pointsMap;
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

  makePath = (withFrame, rowWidth = 2) => {
    let pointsMap = {};
  
    let bottomEdgePath = this.makePathEdge(rowWidth)
    bottomEdgePath.forEach((pathRow, ex) => {
      pathRow.forEach((p, i) => {
        if (!p) return;
        let pathPoint = {
          type: 'path',
          x: ex + this.pathWidth,
          y: this.tileSize - Math.round(pathRow.length / 2) + (rowWidth - i) - rowWidth + this.pathWidth,
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
          y: (i) - 2 + this.pathWidth ,
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
          y: ex - 1 + this.pathWidth,
          x: (i) - 2 + this.pathWidth ,
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
          y: (this.tileSize - ex) + this.pathWidth,
          x: this.tileSize - Math.round(pathRow.length / 2) + (rowWidth - i) + this.pathWidth ,
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
          // color: 'pink'
          // color: this.tileColor
          color: 'rgba(0,0,0,0.1)'
        }
      } else if (i > position) {
        return {
          type: 'fill',
          // color: this.color
          color: this.tileColor
          // color: 'red'
          
        }
      }
      return {
        type: 'fill',
        color: this.color
        // color: this.tileColor
      }
    });
    return rowPoints;
  }
}

export { PathBuilder }