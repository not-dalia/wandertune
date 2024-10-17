import { MapBuilder } from "./audio-layer/map-builder.js";
import { MapCanvas } from "./audio-layer/map-canvas.js";

const infoMapBuilder = new MapBuilder();
let pathCanvas;
let pathColor = '#3f51b5';
let pannerContainer;

let stepSize = 4 / zoomFactor;
const desiredUpdateRate = 200
let updateRate = 200;
let distanceRadius = 20 * pixelsPerMeter;
let turningDuration = 6000;


let AudioContext;
let audioCtx;
let listener;
const posX = 0;
const posY = 0;

let isInfoLayerVisible = false;

const pannerModel = 'HRTF';
const distanceModel = 'exponential';

const refDistance = 80 / zoomFactor;
const maxDistance = 3;


const rollOff = 3 * (Math.max(1, zoomFactor / 4));

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

function assignPanners (indexes) {
  console.log(indexes)
  elementMap.forEach((e, i) => {
    if (!indexes.includes(i)) return
    if (e.tileData.type == 'forest') createElementPanner(e, 'audio/forest.ogg', i, refDistance)
    if (e.tileData.type == 'building') createElementPanner(e, 'audio/cafe.ogg', i, refDistance / 2)
    if (e.tileData.type == 'river') createElementPanner(e, 'audio/river6.wav', i, refDistance / 4)
  })
}

function createElementPanner (element, audio, index, refDist) {
  const panner = new PannerNode(audioCtx, {
    panningModel: pannerModel,
    distanceModel: distanceModel,
    positionX: (element.locX + pathWidth + tileSize/2) / zoomFactor,
    positionY: (element.locY + pathWidth + tileSize/2) / zoomFactor,
    positionZ: 0,
    // orientationX: orientationX,
    // orientationY: orientationY,
    // orientationZ: orientationZ,
    refDistance: refDist,
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
  audioElement.loop = true;
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
  let lp = document.querySelector('.location-pointer');
  if (!lp) return;
  lp.style.top = `${listener.positionY.value}px`
  lp.style.left = `${listener.positionX.value}px`
}

let playIndex = 0;
let playDirection = 1;
function moveListenerOnPath () {
  if (!audioPlaying) return;
  if (playIndex < 0 || playIndex >= sampledPoints.length) {
    playDirection = playDirection * -1;
    playIndex += playDirection
    // clearInterval(listenerTimer)
    return
  }
  let point = sampledPoints[playIndex]
  playIndex += playDirection;
  listener.positionX.value = point.point[0]
  listener.positionY.value = point.point[1]
  let pointDirection = (point.direction || point.selfDirection)
  if (pointDirection) {
    listener.forwardX.value = playDirection * pointDirection[0]
    listener.forwardY.value = playDirection * pointDirection[1]
  }
  updatePannerPositions()
  animationFrame = requestAnimationFrame(animateCircle);
  infoMapBuilder.drawLine([point.point, [-playDirection * pointDirection[0] + point.point[0], -playDirection * pointDirection[1] + point.point[1]]], { lineWidth: 1, strokeColor: 'black'}, {})
  infoMapBuilder.drawPoint([-playDirection * pointDirection[0] + point.point[0], -playDirection * pointDirection[1] + point.point[1]], { radius: 2, color: 'black'})
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
  let pannersToMove = infoMapBuilder.tree.search({
    minX: listener.positionX.value - distanceRadius / zoomFactor,
    maxX: listener.positionX.value + distanceRadius / zoomFactor,
    minY: listener.positionY.value - distanceRadius / zoomFactor,
    maxY: listener.positionY.value + distanceRadius / zoomFactor,
  })
  let indexes = pannersToMove.map((p) => p.index)
  let selectedPanners = document.querySelectorAll('.panner.moved') 
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
      if (isInfoLayerVisible) {
        pannersDict[p.index].pannerElement.style.left = `${listener.positionX.value}px`
        pannersDict[p.index].pannerElement.style.top = `${listener.positionY.value}px`
      }
      pannersDict[p.index].pannerElement.classList.add('moved')
    } else {
      let nearestPoint = nearestPointOnGeoLine(p.lineString, currentPoint)
      if (!pannersDict[p.index] || !pannersDict[p.index].panner) return;
      pannersDict[p.index].panner.positionX.value = nearestPoint.geometry.coordinates[0]
      pannersDict[p.index].panner.positionY.value = nearestPoint.geometry.coordinates[1]
      if (isInfoLayerVisible) {
        pannersDict[p.index].pannerElement.style.left = `${nearestPoint.geometry.coordinates[0]}px`
        pannersDict[p.index].pannerElement.style.top = `${nearestPoint.geometry.coordinates[1]}px`
      }
        pannersDict[p.index].pannerElement.classList.add('moved')
    }
  })
}

function setStepSizeFromPace (pace) {
  updateRate = desiredUpdateRate
  let paceInMeterPerSecond = pace * 1000 / (60 * 60)
  let paceInPixelPerMillisecond = paceInMeterPerSecond * pixelsPerMeter / (zoomFactor * 1000)
  stepSize = Math.max(1, Math.round(paceInPixelPerMillisecond * updateRate))
  console.log('pace: ' + pace)
  console.log('pixelsPerMeter: ' + pixelsPerMeter)
  console.log('paceInMeterPerSecond: ' + paceInMeterPerSecond)
  console.log('paceInPixelPerMillisecond: ' + paceInPixelPerMillisecond)
  console.log('stepSize: ' + stepSize)
  let correctStepSize = (pace * 1000 * pixelsPerMeter) / (60 * 60 / (updateRate / 1000)) / zoomFactor;
  console.log('correctStepSize: ' + correctStepSize)


  updateRate = stepSize / paceInPixelPerMillisecond
  console.log('updateRate: ' + updateRate)
}

let canDrawPath = false;
let elementMap;
function initMap(currentElementMap, townWidth, townHeight, walkingPace = 4) {
  elementMap = currentElementMap

  pannerContainer = document.querySelector('.panner-container');
  pannerContainer.style.width = `${townWidth / zoomFactor}px`
  pannerContainer.style.height = `${townHeight / zoomFactor}px`
  pannerContainer.innerHTML = '';

  let pathContainer = document.querySelector('.path-container');
  pathContainer.style.width = `${townWidth / zoomFactor}px`
  pathContainer.style.height = `${townHeight / zoomFactor}px`
  pathContainer.innerHTML = '';
  pannersDict = {};
  audioArr = [];

  let l = document.querySelector('.listener') || document.createElement('div');
  l.classList.add('listener')
  l.style.outlineOffset = `${distanceRadius / zoomFactor}px`
  pannerContainer.append(l);

  let lp = document.querySelector('.location-pointer') || document.createElement('div');
  lp.classList.add('location-pointer')
  pathContainer.append(lp);

  window.cancelAnimationFrame(animationFrame);
  clearInterval(listenerTimer);
  setStepSizeFromPace(walkingPace)
  infoMapBuilder.setMapData(elementMap)
  infoMapBuilder.buildMap()
  pathCanvas = new MapCanvas('.path-container')
  canDrawPath = true
}

let audioPlaying = false;
function playAudio () {
  audioPlaying = true;
  canDrawPath = false
  audioArr.forEach(a => a.play())
  playIndex = 0;
  playDirection = 1;
  clearInterval(listenerTimer)

  listenerTimer = setInterval(moveListenerOnPath, updateRate)
  animateCircle()
  updatePannerPositions()
}

function toggleAudio() {
  if (audioPlaying) {
    audioArr.forEach(a => a.play())
  } else {
    audioArr.forEach(a => a.pause())
  }
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
  pathCanvas.drawPoint([e.clientX, e.clientY], {color: pathColor, radius: 15 })
  if (mousePathArr.length > 1) {
    pathCanvas.drawLine([mousePathArr[mousePathArr.length - 2], mousePathArr[mousePathArr.length - 1]], {strokeColor: pathColor, lineWidth: 6, dashLine: true}, {})
  }
})


function samplePathLine() {
  playIndex = 0;
  let pannersOnPath = []

  let pathArr = [...mousePathArr]
  if (stepSize < 0 || pathArr.length == 0) return
  canDrawPath = false
  if (pathArr.length == 1) {
    return [pathArr[0]]
  }
  let isPathOver = false
  sampledPoints = [{ point: pathArr[0], direction: pathArr[1] ? [pathArr[1][0] - pathArr[0][0], pathArr[1][1] - pathArr[0][1]] : null}]
  pannersOnPath.push(...getPannersOnPath(sampledPoints[0]))

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
        pannersOnPath.push(...getPannersOnPath(line[1]))
        isPathOver = true
      }
      prevPoint = pathArr[lineIndex - 1]
    } else {
      let samplePoint = findPointOnLineByDistance(line, remainingDistance)
      sampledPoints.push({ point: samplePoint })
      remainingDistance = stepSize
      prevPoint = samplePoint
      pannersOnPath.push(...getPannersOnPath(samplePoint))
    }
  }
  let turningSamples = Math.round(turningDuration / updateRate);
  let halfSamples = Math.round(turningSamples / 2)
  // let turningSamples = 5;
  console.log('turningSamples: ' + turningSamples)
  sampledPoints.forEach((p, i) => {
  
    let lookingAtPoint = sampledPoints[Math.min(i + turningSamples, sampledPoints.length - 1)]
    let directionPointIndex = (i + halfSamples >= sampledPoints.length) ? i : i + halfSamples
    let directionPoint = sampledPoints[directionPointIndex]
    p.selfDirection = [p.point[0] - lookingAtPoint.point[0], p.point[1] - lookingAtPoint.point[1]]
    directionPoint.direction = [p.point[0] - lookingAtPoint.point[0], p.point[1] - lookingAtPoint.point[1]]
    // mapBuilder.drawPoint(p.point, {color: "blue", radius: 1})
  })

  initAudioContext()
  assignPanners(pannersOnPath)
}

function getPannersOnPath (point) {
  let pannersToMove = infoMapBuilder.tree.search({
    minX: point[0] - distanceRadius / zoomFactor,
    maxX: point[0] + distanceRadius / zoomFactor,
    minY: point[1] - distanceRadius / zoomFactor,
    maxY: point[1] + distanceRadius / zoomFactor,
  })
  let indexes = pannersToMove.map((p) => p.index)
  return indexes
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
  // if (!listener) return;
  switch(e.key) {
    case " ":
      if (canDrawPath) break;
      audioPlaying = !audioPlaying
      break;
    case "p":
      if (canDrawPath) break;
      audioPlaying = !audioPlaying
      toggleAudio()
      break;
    case "i":
      isInfoLayerVisible = !isInfoLayerVisible
      infoMapBuilder.setIsVisible(isInfoLayerVisible)
      console.log(isInfoLayerVisible ? "showing map" : "hiding map")
      break;
    case "ArrowLeft":
      if (canDrawPath) break;
      playIndex = Math.max(playIndex - stepSize * 10, 0)
      clearInterval(listenerTimer)
      listenerTimer = setInterval(moveListenerOnPath, updateRate)
      console.log(playIndex)
      break;
    case "ArrowRight":
      if (canDrawPath) break;
      playIndex = Math.min(playIndex + stepSize * 10, sampledPoints.length - 1)
      clearInterval(listenerTimer)
      listenerTimer = setInterval(moveListenerOnPath, updateRate)
      break;
    case "Enter":
      if (!canDrawPath || audioPlaying) break;
      samplePathLine()
      playAudio()
      break
    default:
      keyPressed = null;
      break;
  }
})

window.addEventListener('keyup', (e) => {
  // console.log(`key set to ${keyPressed}`)
  keyPressed = null;
})


// setTimeout( initMap, 2000 )

export { initMap, samplePathLine, playAudio }