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
    pannerContainer = document.querySelector('.panner-container');
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
        e.tileData.boundary.forEach(b => {
          let {minX, minY, maxX, maxY} = b
          minX = Math.max(minX * pixelSize, e.locX + pathWidth/2)
          maxX = Math.min(maxX * pixelSize, e.locX + e.w - pathWidth/2)
          minY = Math.max(minY * pixelSize, e.locY + pathWidth/2)
          maxY = Math.min(maxY * pixelSize, e.locY + e.h - pathWidth/2)
          const item = {...b, minX, minY, maxX, maxY}
          item.lineString = turf.lineString([[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]])
          item.index = i
          this.tree.insert(item);
          console.log(item)
          let border = document.createElement('div')
          border.classList.add('tile-borders')
          border.style.top = `${item.minY}px`
          border.style.left = `${item.minX}px`
          border.style.width = `${item.maxX - item.minX}px`
          border.style.height = `${item.maxY - item.minY}px`
          pannerContainer.append(border)
        })
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
        let border = document.createElement('div')
        border.classList.add('tile-borders')
        border.style.top = `${item.minY}px`
        border.style.left = `${item.minX}px`
        border.style.width = `${item.maxX - item.minX}px`
        border.style.height = `${item.maxY - item.minY}px`
        pannerContainer.append(border)
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
const mapBuilder = new MapBuilder();

let stepSize = 4;
let updateRate = 100;
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
    if (e.type !== 'tile') return
    if (e.type == 'tile' && e.tileData.type == 'forest') createElementPanner(e, 'audio/forest.ogg', i)
    if (e.type == 'tile' && e.tileData.type == 'buildings') createElementPanner(e, 'audio/cafe.ogg', i)
    if (e.type == 'tile' && e.tileData.type == 'river') createElementPanner(e, 'audio/river2.ogg', i)
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
  selectedPanners.forEach(p => {
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
  let pannersToMove = mapBuilder.tree.search({
    minX: listener.positionX.value - distanceRadius,
    maxX: listener.positionX.value + distanceRadius,
    minY: listener.positionY.value - distanceRadius,
    maxY: listener.positionY.value + distanceRadius,
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

function playAudio (walkingPace = 4) {
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
  audioArr.forEach(a => a.play())

  listenerTimer = setInterval(moveCircle, updateRate)
  animateCircle()
  updatePannerPositions()
}

window.addEventListener('mouseup', (e) => {
  if (!listener) return;
  listener.positionX.value = e.clientX
  listener.positionY.value = e.clientY
  animateCircle()
  updatePannerPositions()
})


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