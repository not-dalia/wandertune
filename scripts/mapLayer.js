const pixelsPerMeter = 30;
let pannerContainer;

class MapBuilder {
  constructor () {
    this.map = {
      "type": "FeatureCollection",
      "features": []
    }
    this.tree = new rbush();
    this.built = false;
  }

  addFeatureToMap (geometry, properties) {
    this.map.features.push({
      type: 'Feature',
      geometry,
      properties
    })
  }

  addTileToMap (coordinates, tileType, index) {
    let geometry = {
      type: 'Polygon',
      coordinates: [
        [
          coordinates
        ]
      ]
    }
    let properties = {
      tileType,
      index
    }
    this.addFeatureToMap(geometry, properties)
  }

  buildMap (mapData) {
    if (this.built) return this.map;
    this.mapCanvas = new MapCanvas('.panner-container');
    // pannerContainer = document.querySelector('.panner-container');
    mapData.forEach((e, i) => {
      if (e.type != 'tile') return
      const x1 = e.locX + pathWidth;
      const x2 = e.locX + e.w - pathWidth;
      const y1 = e.locY + pathWidth;
      const y2 = e.locY + e.h - pathWidth;
      const coordinates = [
        [x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]
      ];
      this.addTileToMap(coordinates, e.tileData.type, i);

      if (e.tileData.boundary) {
        let resultPoly;
        e.tileData.boundary.forEach(b => {
          let {minX, minY, maxX, maxY} = b
          minX = Math.max(minX * pixelSize, e.locX + pathWidth/2)
          maxX = Math.min(maxX * pixelSize, e.locX + e.w - pathWidth/2)
          minY = Math.max(minY * pixelSize, e.locY + pathWidth/2)
          maxY = Math.min(maxY * pixelSize, e.locY + e.h - pathWidth/2)
          let poly = turf.polygon([[[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]]])
          if (!resultPoly) resultPoly = poly
          else resultPoly = turf.union(resultPoly, poly)
          /* let border = document.createElement('div')
          border.classList.add('tile-borders')
          border.style.top = `${item.minY}px`
          border.style.left = `${item.minX}px`
          border.style.width = `${item.maxX - item.minX}px`
          border.style.height = `${item.maxY - item.minY}px`
          pannerContainer.append(border) */
        })
        const item = {
          minX: Number.MAX_VALUE,
          minY: Number.MAX_VALUE,
          maxX: Number.MIN_VALUE,
          maxY: Number.MIN_VALUE,
        }

        resultPoly.geometry.coordinates[0].forEach(p => {
          if (p[0] < item.minX) item.minX = p[0]
          if (p[0] > item.maxX) item.maxX = p[0]
          if (p[1] < item.minY) item.minY = p[1]
          if (p[1] > item.maxY) item.maxY = p[1]
        })

        item.lineString = turf.lineString(resultPoly.geometry.coordinates[0])
        item.index = i
        this.tree.insert(item);
        this.mapCanvas.drawPolygon(resultPoly)
      } else {
        const item = {
          minX: e.locX + pathWidth,
          minY: e.locY + pathWidth,
          maxX: e.locX + e.w - pathWidth,
          maxY: e.locY + e.h - pathWidth,
          index: i,
          lineString: turf.lineString(coordinates)
        };
        this.tree.insert(item);
        this.mapCanvas.drawPolygon([[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]])
        /* let border = document.createElement('div')
        border.classList.add('tile-borders')
        border.style.top = `${item.minY}px`
        border.style.left = `${item.minX}px`
        border.style.width = `${item.maxX - item.minX}px`
        border.style.height = `${item.maxY - item.minY}px`
        pannerContainer.append(border) */
      }
    });
    this.built = true;
    return this.map
  }
}

/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/

class MapCanvas {
  constructor (parentElementSelector, width, height) {
    this.parentElement = document.querySelector(parentElementSelector)
    if (!this.parentElement) throw new Error(`Could not find ${parentElementSelector}`)
    if (!width) width = this.parentElement.clientWidth
    if (!height) height = this.parentElement.clientHeight
    this.canvas = this._createCanvas(width, height)
	  this.parentElement.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _createCanvas (width, height) {
    let canvas = document.createElement("canvas")
	  canvas.id = `wt-map-canvas`
	  canvas.style.top = 0;
	  canvas.style.left = 0;
	  canvas.style.width = `${width}px`
	  canvas.style.height = `${height}px`
	  canvas.setAttribute('width', width)
	  canvas.setAttribute('height', height)

    return canvas
  }

  drawPoint(point, inputProperties = {}) {
    let coordinates;
    let properties = {
      color: 'black',
      radius: 4,
      fill: true,
      strokeColor: 'black',
      stroke: false,
      lineWidth: 10,
      ...inputProperties
    }
    if (typeof point !== 'object') throw new Error('Wrong point format')
    if (Array.isArray(point)) {
      coordinates = point
    } else {
      coordinates = point.geometry.coordinates
      properties = { ...properties, ...point.geometry.properties }
    }
    if (coordinates.length < 2 || coordinates.some(c => (typeof c !== 'number'))) throw new Error('Wrong point format')

    this.ctx.beginPath()
    this.ctx.moveTo(coordinates[0], coordinates[1])
    this.ctx.arc(coordinates[0], coordinates[1], properties.radius, 0, 2 * Math.PI)
    if (properties.fill) {
      this.ctx.fillStyle = properties.color
      this.ctx.fill()
    }
    if (properties.stroke || !properties.fill) {
      this.ctx.strokeStyle = properties.strokeColor || properties.color
      this.ctx.lineWidth = properties.lineWidth
      this.ctx.stroke()
    }
    
  }

  drawLine (line, inputProperties = {}, {isNew = true, isToBeContinued = false, isClosed = false}) {
    let coordinates;
    let properties = {
      color: 'black',
      fill: false,
      strokeColor: 'black',
      stroke: true,
      lineWidth: 10,
      ...inputProperties
    }
    if (typeof line !== 'object') throw new Error('Wrong line format')
    if (Array.isArray(line)) {
      coordinates = line
    } else {
      coordinates = line.geometry.coordinates
      properties = { ...properties, ...line.geometry.properties }
    }
    
    if (isNew) this.ctx.beginPath()
    this.ctx.moveTo(coordinates[0][0], coordinates[0][1]);
    for (let i = 1; i < coordinates.length; i++) {
      this.ctx.lineTo(coordinates[i][0], coordinates[i][1]);
    }

    if (isClosed) this.ctx.closePath()
    if (!isToBeContinued) {
      if (properties.fill) {
        this.ctx.fillStyle = properties.color
        this.ctx.fill()
      }
      if (properties.stroke || !properties.fill) {
        this.ctx.strokeStyle = properties.strokeColor || properties.color
        this.ctx.lineWidth = properties.lineWidth
        this.ctx.stroke()
      }
    }
  }

  drawPolygon(polygon, inputProperties = {}) {
    let polygons;
    let properties = {
      color: 'black',
      fill: false,
      strokeColor: 'black',
      stroke: true,
      lineWidth: 4,
      ...inputProperties
    }
    if (typeof polygon !== 'object') throw new Error('Wrong polygon format')
    if (Array.isArray(polygon)) {
      polygons = polygon
    } else {
      polygons = polygon.geometry.coordinates
      properties = { ...properties, ...polygon.geometry.properties }
    }
    const hasInteriors = polygons.length > 1
    const exterior = polygons[0]
    if (!this._isClockwise(exterior)) exterior.reverse()
    this.drawLine(exterior, properties, {isNew: true, isToBeContinued: hasInteriors, isClosed: true})
    for (let i = 1; i < polygons.length; i++) {
      const interior = polygons[i]
      if (this._isClockwise(interior)) interior.reverse()
      this.drawLine(exterior, properties, {isNew: true, isToBeContinued: i < polygons.length - 1, isClosed: true})
    }
  }

  _isClockwise(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length
        area += points[i][0] * points[j][1];
        area -= points[j][0] * points[i][1];
    }
    return (area / 2) > 0;
  }

  _sortPoints(inputPoints, order='clockwise') {
    const points = [...inputPoints]
    const center = [];

    //sort horizontally then minmax to find centerX, sort vertically then minmax to find centerY
    points.sort((a, b) => (a[0] - b[0]))
    center[0] = (points[0][0] + points[points.length - 1][0]) / 2
    
    points.sort((a, b) => (a[1] - b[1]))
    center[1] = (points[0][1] + points[points.length - 1][1]) / 2

    let startingAngle;
    let pointAngles = {}
    points.forEach((p, i) => {
      let angle = this.getLineAngle(p, center)
      if (!startingAngle) {
        startAngle = angle
      } else if (angle < startingAngle) {
        angle += Math.PI * 2
      }
      pointAngles[p.join(',')] = angle
    })

    points.sort((a, b) => (pointAngles[a.join(',')] - pointAngles[b.join(',')]))

    if (order === 'counterclockwise') points = points.reverse()

    points.unshift(points.pop())
    return points
  }

  getLineAngle (end, start = [0, 0], unit = 'radians') {
    let angle = Math.atan2(end[1] - start[1], end[0] - start[0])   //radians
    
    if (unit === 'degrees' || unit === 'degree') {
      angle = 180 * angle / Math.PI
    }
    // return (360+Math.round(degrees))%360; //round number, avoid decimal fragments
    return angle
  }
}



/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
const mapBuilder = new MapBuilder();

let stepSize = 4;
let updateRate = 200;
let distanceRadius = 20 * pixelsPerMeter;


let AudioContext;
let audioCtx;
let listener;
const posX = 0;
const posY = 0;

const pannerModel = 'HRTF';
const distanceModel = 'exponential';

const refDistance = 80;
const maxDistance = 3;


const rollOff = 3;

const orientationX = 0.0;
const orientationY = 0.0;
const orientationZ = -1.0;

let pannersDict = {};
let audioArr = [];
let listenerTimer;
let animationFrame;
let dynamicCompressor;
let sampledPoints = []

function initAudioContext() {
  AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  listener = audioCtx.listener;
  listener.upX.value = 0;
  listener.upY.value = 0;
  listener.upZ.value = 1;
  // dynamicCompressor = audioCtx.createDynamicsCompressor()
  // dynamicCompressor.connect(audioCtx.destination)
}

function setListenerPosition (posX, posY) {
  listener.positionX.value = posX;
	listener.positionY.value = posY;
}
function setListenerForward (forwardX, forwardY) {
  listener.forwardX.value = forwardX;
	listener.forwardY.value = forwardY;
}

function assignPanners () {
  elementMap.forEach((e, i) => {
    if (e.tileData.type == 'forest') createElementPanner(e, 'audio/forest.ogg', i)
    if (e.tileData.type == 'buildings') createElementPanner(e, 'audio/cafe.ogg', i)
    if (e.tileData.type == 'river') createElementPanner(e, 'audio/river2.ogg', i)
  })
}

function createElementPanner (element, audio, index) {
  const panner = new PannerNode(audioCtx, {
    panningModel: pannerModel,
    distanceModel: distanceModel,
    positionX: element.locX + pathWidth + tileSize/2,
    positionY: element.locY + pathWidth + tileSize/2,
    positionZ: 0,
    // orientationX: orientationX,
    // orientationY: orientationY,
    // orientationZ: orientationZ,
    refDistance: refDistance,
    // maxDistance: maxDistance,
    rolloffFactor: rollOff,
  })

  let pannerElement = document.createElement('div');
  pannerElement.classList.add('panner');
  pannerElement.id = `panner-${index}`;
  pannerElement.setAttribute('data-panner', Object.keys(pannersDict).length + 1);
  pannerElement.setAttribute('data-index', index);
  pannerElement.style.top = `${panner.positionY.value}px`;
  pannerElement.style.left = `${panner.positionX.value}px`;
  pannerContainer.append(pannerElement);

  const audioElement = new Audio(audio);
  const track = audioCtx.createMediaElementSource(audioElement);
  // track.connect(panner).connect(dynamicCompressor)
  audioElement.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
  }, false)
  pannersDict[index] = {track, panner, pannerElement}

  audioArr.push(audioElement)
}

let prevX, prevY;
let keyPressed = null;

function animateCircle (timestamp) {
  let l = document.querySelector('.listener');
  if (!l) return;
  l.style.top = `${listener.positionY.value}px`
  l.style.left = `${listener.positionX.value}px`
}

function moveCircle () {
  if (!keyPressed) return;
  switch(keyPressed) {
    case "Down": // IE/Edge specific value
    case "ArrowDown":
      listener.positionY.value+=stepSize;
      listener.forwardX.value = 0;
      listener.forwardY.value = -1;
      break
    case "Up": // IE/Edge specific value
    case "ArrowUp":
      listener.positionY.value-=stepSize;
      listener.forwardX.value = 0;
      listener.forwardY.value = 1;
      break;
    case "Left": // IE/Edge specific value
    case "ArrowLeft":
      listener.positionX.value-=stepSize;
      listener.forwardY.value = 0;
      listener.forwardX.value = 1;
      break;
    case "Right": // IE/Edge specific value
    case "ArrowRight":
      listener.positionX.value+=stepSize;
      listener.forwardY.value = 0;
      listener.forwardX.value = -1;
      break;
    default:
      keyPressed = null;
      break;
  }
  updatePannerPositions()
  animationFrame = requestAnimationFrame(animateCircle);
}

let playIndex = 0;
let playDirection = 1;
function moveListenerOnPath () {
  if (playIndex < 0 || playIndex >= sampledPoints.length) {
    // playDirection = playDirection * -1;
    // playIndex += playDirection
    clearInterval(listenerTimer)
    return
  }
  let point = sampledPoints[playIndex]
  playIndex += playDirection;
  listener.positionX.value = point.point[0]
  listener.positionY.value = point.point[1]
  if (point.direction) {
    listener.forwardX.value = playDirection * point.direction[0]
    listener.forwardY.value = playDirection * point.direction[1]
  }
  updatePannerPositions()
  animationFrame = requestAnimationFrame(animateCircle);
  // mapBuilder.mapCanvas.ctx.clearRect(0, 0, mapBuilder.mapCanvas.canvas.clientWidth, mapBuilder.mapCanvas.canvas.clientHeight)
  // for (let i = 1; i < mousePathArr.length; i++) {
  //   mapBuilder.mapCanvas.drawLine([mousePathArr[i-1], mousePathArr[i]], {strokeColor: 'orange'}, {})
  // }
  mapBuilder.mapCanvas.drawLine([point.point, [-playDirection * point.direction[0] + point.point[0], -playDirection * point.direction[1] + point.point[1]]], { lineWidth: 2, strokeColor: 'black'}, {})
  mapBuilder.mapCanvas.drawPoint([-playDirection * point.direction[0] + point.point[0], -playDirection * point.direction[1] + point.point[1]], { radius: 5, color: 'black'})
}

function nearestPointOnGeoLine(geoLine, geoPoint) {
  let shortestDistance = Number.MAX_VALUE;
  let nearestPoint;
  if (geoLine.geometry.coordinates.length == 1) throw Error('not a line')
  for (let i = 1; i < geoLine.geometry.coordinates.length; i++) {
    let line = [geoLine.geometry.coordinates[i - 1], geoLine.geometry.coordinates[i]]
    let point = nearestPointOnLine(line, geoPoint.geometry.coordinates)
    let distance = pointDistance(geoPoint.geometry.coordinates, point)
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestPoint = point;
    }
  }
  return turf.point(nearestPoint, {distance: shortestDistance})
}

function nearestPointOnLine(line, point) {
  const linePoint1 = line[0]
  const linePoint2 = line[1]
  const lineVector = {
    x: linePoint2[0] - linePoint1[0],
    y: linePoint2[1] - linePoint1[1]
  };
  const k = ((point[0] - linePoint1[0]) * lineVector.x + (point[1] - linePoint1[1]) * lineVector.y) / (Math.pow(lineVector.x, 2) + Math.pow(lineVector.y, 2));
  return [
    minMax(linePoint1[0] + k * lineVector.x, linePoint1[0], linePoint2[0] ),
    minMax(linePoint1[1] + k * lineVector.y, linePoint1[1], linePoint2[1] ),
  ]
  
}

function minMax (number, limit1, limit2) {
  let min = Math.min(limit1, limit2)
  let max = Math.max(limit1, limit2)
  return Math.min(Math.max(number, min), max);
}

function pointDistance(point1, point2) {
  return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2))
}

function updatePannerPositions () {
  let selectedPanners = document.querySelectorAll('.panner.moved') 
  let pannersToMove = mapBuilder.tree.search({
    minX: listener.positionX.value - distanceRadius,
    maxX: listener.positionX.value + distanceRadius,
    minY: listener.positionY.value - distanceRadius,
    maxY: listener.positionY.value + distanceRadius,
  })
  let indexes = pannersToMove.map((p) => p.index)
  selectedPanners.forEach(p => {
    if (indexes.includes(p.dataset.index)) return;
    p.classList.remove('moved')
    let i = p.dataset.index
    let pannerObj = pannersDict[i]
    if (!pannerObj) return;
    if (pannerObj.connected) {
      try {
        pannerObj.track.disconnect(pannerObj.panner)
        pannerObj.track.disconnect(audioCtx.destination)
      } catch (e) {

      }
      pannerObj.connected = false;
    }
  })
  let currentPoint = turf.point([listener.positionX.value, listener.positionY.value])
  pannersToMove.forEach(p => {
    let pannerObj = pannersDict[p.index]
    if (!pannerObj) return;
    if (!pannerObj.connected) pannerObj.track.connect(pannerObj.panner).connect(audioCtx.destination)
    let isPointInTile = turf.booleanPointInPolygon(currentPoint, turf.polygon([p.lineString.geometry.coordinates]))
    if (isPointInTile) {
      if (!pannersDict[p.index] || !pannersDict[p.index].panner) return;
      pannersDict[p.index].panner.positionX.value = listener.positionX.value
      pannersDict[p.index].panner.positionY.value = listener.positionY.value
      pannersDict[p.index].pannerElement.style.left = `${listener.positionX.value}px`
      pannersDict[p.index].pannerElement.style.top = `${listener.positionY.value}px`
      pannersDict[p.index].pannerElement.classList.add('moved')
    } else {
      let nearestPoint = nearestPointOnGeoLine(p.lineString, currentPoint)
      if (!pannersDict[p.index] || !pannersDict[p.index].panner) return;
      pannersDict[p.index].panner.positionX.value = nearestPoint.geometry.coordinates[0]
      pannersDict[p.index].panner.positionY.value = nearestPoint.geometry.coordinates[1]
      pannersDict[p.index].pannerElement.style.left = `${nearestPoint.geometry.coordinates[0]}px`
      pannersDict[p.index].pannerElement.style.top = `${nearestPoint.geometry.coordinates[1]}px`
      pannersDict[p.index].pannerElement.classList.add('moved')
    }
  })
}

function setStepSizeFromPace (pace) {
  stepSize = Math.round((pace * 1000 * pixelsPerMeter) / (60 * 60 / (updateRate / 1000)));
}

let canDrawPath = false;

function initMap(walkingPace = 4) {
  pannerContainer = document.querySelector('.panner-container');
  pannerContainer.innerHTML = '';
  pannersDict = {};
  audioArr = [];
  let l = document.querySelector('.listener') || document.createElement('div');
  l.classList.add('listener')
  l.style.outlineOffset = `${distanceRadius}px`
  pannerContainer.append(l);
  window.cancelAnimationFrame(animationFrame);
  clearInterval(listenerTimer);
  initAudioContext()
  assignPanners()
  setStepSizeFromPace(walkingPace)
  mapBuilder.buildMap(elementMap)
  canDrawPath = true
}

function playAudio () {
  canDrawPath = false
  audioArr.forEach(a => a.play())
  playIndex = 0;
  playDirection = 1;
  clearInterval(listenerTimer)

  listenerTimer = setInterval(moveListenerOnPath, updateRate)
  animateCircle()
  updatePannerPositions()
}

let mousePathArr = []
window.addEventListener('mouseup', (e) => {
  /* if (!listener) return;
  listener.positionX.value = e.clientX
  listener.positionY.value = e.clientY
  animateCircle()
  updatePannerPositions() */
  if (!canDrawPath) return
  mousePathArr.push([e.clientX, e.clientY])
  mapBuilder.mapCanvas.drawPoint([e.clientX, e.clientY], {color: 'orange', radius: 5 })
  if (mousePathArr.length > 1) {
    mapBuilder.mapCanvas.drawLine([mousePathArr[mousePathArr.length - 2], mousePathArr[mousePathArr.length - 1]], {strokeColor: 'orange'}, {})
  }
})


function samplePathLine() {
  let pathArr = [...mousePathArr]
  if (stepSize < 0 || pathArr.length == 0) return
  canDrawPath = false
  if (pathArr.length == 1) {
    return [pathArr[0]]
  }
  let isPathOver = false
  sampledPoints = [{ point: pathArr[0], direction: pathArr[1] ? [pathArr[1][0] - pathArr[0][0], pathArr[1][1] - pathArr[0][1]] : null}]
  let lineIndex = 1;
  let prevPoint = pathArr[0];
  let remainingDistance = stepSize;
  // TODO: Fix sampledPoint when the distance to end of line is shorter than it needs to be
  while (!isPathOver) {
    let line = [prevPoint, pathArr[lineIndex]]
    // let direction = [line[0][0] - line[1][0], line[0][1] - line[1][1]]
    let distanceFromEnd = pointDistance(prevPoint, line[1])
    if (distanceFromEnd < stepSize && remainingDistance > distanceFromEnd) {
      // sampledPoints.push(samplePoint)
      remainingDistance = remainingDistance - distanceFromEnd
      lineIndex += 1
      if (lineIndex >= pathArr.length) {
        sampledPoints.push({ point: line[1] })
        isPathOver = true
      }
      prevPoint = pathArr[lineIndex - 1]
    } else {
      let samplePoint = findPointOnLineByDistance(line, remainingDistance)
      sampledPoints.push({ point: samplePoint })
      remainingDistance = stepSize
      prevPoint = samplePoint
    }
  }
  let turningDuration = 4000;
  let turningSamples = turningDuration / updateRate;
  sampledPoints.forEach((p, i) => {
    let lookingAtPoint = sampledPoints[Math.min(i + turningSamples, sampledPoints.length - 1)]
    p.direction = [p.point[0] - lookingAtPoint.point[0], p.point[1] - lookingAtPoint.point[1]]
    mapBuilder.mapCanvas.drawPoint(p.point, {color: "blue", radius: 2})
  })
}

function findPointOnLineByDistance([p1, p2], distance) {
  let dx = p2[0] - p1[0];
  let dy = p2[1] - p1[1];
  let coef = distance / pointDistance(p1, p2);

  let x = p1[0] + dx * coef;
  let y = p1[1] + dy *coef;
  return [x, y]
}


window.addEventListener('keydown', (e) => {
  if (!listener) return;
  switch(e.key) {
    case "Down": // IE/Edge specific value
    case "ArrowDown":
    case "Up": // IE/Edge specific value
    case "ArrowUp":
    case "Left": // IE/Edge specific value
    case "ArrowLeft":
    case "Right": // IE/Edge specific value
    case "ArrowRight":
      keyPressed = e.key;
      // console.log(`key set to ${keyPressed}`)
      break;
    default:
      keyPressed = null;
      break;
  }
})

window.addEventListener('keyup', (e) => {
  // console.log(`key set to ${keyPressed}`)
  keyPressed = null;
})