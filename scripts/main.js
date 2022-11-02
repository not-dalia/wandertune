import { TileFactory, TownBuilder, Season } from "./town-generator/index.js";
import { BuildingsTile, ForestTile, RiverTile, StationTile } from "./town-generator/tiles/index.js"
import { initMap } from "./mapLayer.js";

const tileFactory = new TileFactory();

let elementMap = [];
let loadedImages = {}

const TownUtils = {
	getAvailableScreenSpace() {
		return {
			x: document.documentElement.clientWidth * zoomFactor,
			y: document.documentElement.clientHeight * zoomFactor
		}
	},
	calculateAvailableTiles(availableSpace, pathWidth, tileSize) {
		let xTiles = Math.floor((availableSpace.x - pathWidth) / (tileSize + pathWidth)) || 1;
		let yTiles = Math.floor((availableSpace.y - pathWidth) / (tileSize + pathWidth)) || 1;
		return {
			x: xTiles,
			y: yTiles
		}
	},
	getElementIndexByTilePoint(point) {
		let element = document.querySelector(`#n${point.x * 4 + 1}_${point.y * 4 + 1}`)
		let elementIndex = element.dataset.elementIndex;
		return elementIndex
	}
}  

function generateTileMap(availableTileCounts) {
	let elementMap = [];
	for (let ty = 0; ty < availableTileCounts.y; ty++) {
		for (let tx = 0; tx < availableTileCounts.x; tx++) {
			elementMap.push({
				x: tx * 4 + 1,
				y: ty * 4 + 1,
				locX: tx * (tileSize + pathWidth),
				locY: ty * (tileSize + pathWidth),
				type: 'tile',
				orientation: 'v',
				w: tileSize + 2 * pathWidth,
				h: tileSize + 2 * pathWidth,
			})
		}
	}
	return elementMap
}

function drawImageFromSrc(ctx, img, o) {
	if (o.data.rotation) {
		let translateDistanceX = o.data.width * pixelSize / 2
		let translateDistanceY = o.data.height * pixelSize / 2
		let rotationAngle = o.data.rotation * Math.PI / 2
		ctx.translate(translateDistanceX + o.x * pixelSize, translateDistanceY + o.y * pixelSize);
		ctx.rotate(rotationAngle);
		ctx.drawImage(img, -translateDistanceX, -translateDistanceY);
		ctx.resetTransform()
	} else {
		ctx.drawImage(img, o.x * pixelSize, o.y * pixelSize);
	}
}

async function drawObjectInOrder(objectKeys, objectList, ctx) {
	if (objectKeys.length <= 0) return;
	ctx.resetTransform();
	objectKeys.forEach(k => {
		let o = objectList[k];
		if (!o.data.src) return;
		if (!loadedImages[o.data.src]) {
			console.log(`image not loaded: ${o.data.src}`)
			return
		}
		drawImageFromSrc(ctx, loadedImages[o.data.src], o)
	}) 
}

function loadImageAsync(url) {
	return new Promise((resolve, reject) => {
		try {
			let img = new Image();
			img.onload = function () {
				resolve(img)
			};
			img.src = url;
		} catch (err) {
			reject(err)
		}
	})
}

function drawStreets (ctx) {
	for (let i = 0; i < elementMap.length; i++) {
		let item = elementMap[i];
		ctx.fillStyle = streetColor;
		if (item.tileData && item.tileData.streets) {
			// reset last transform (translate)
			ctx.resetTransform();

			// translate canvas to tile location so we can draw tile on [0, 0]
			ctx.translate(item.locX, item.locY)
			ctx.fillRect(0, 0, tileSize + 2 * pathWidth, tileSize + 2 * pathWidth);
			Object.keys(item.tileData.streets).forEach(k => {
				let p = item.tileData.streets[k];
				ctx.fillStyle = p.data.color;
				ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
			})
		}
	}
}

function drawTileColors (ctx, objectsMap) {
	for (let i = 0; i < elementMap.length; i++) {
		let item = elementMap[i];
		if (item.tileData) {
			ctx.resetTransform();
			ctx.translate(item.locX, item.locY)

			ctx.fillStyle = item.tileData.color;
			ctx.fillRect(pathWidth, pathWidth, tileSize, tileSize);

			item.tileData.pathMap && Object.keys(item.tileData.pathMap).forEach(k => {
				let p = item.tileData.pathMap[k];
				ctx.fillStyle = p.data.color;
				ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
			})

			if (item.tileData.bridges) {
				item.tileData.bridges.forEach((b, i) => {
					let bridge = {
						...b,
						x: b.x + item.locX / pixelSize,
						y: b.y + item.locY / pixelSize
					}
					objectsMap[`b_${bridge.x}_${bridge.y}`] = bridge
				})
			}
		}
	}
	ctx.resetTransform()
}

function drawArtifacts (ctx, artifactMap) {
	let prevColor;
	artifactMap && Object.keys(artifactMap).forEach(k => {
		let p = artifactMap[k];
		if (prevColor != p.data.color) {
			ctx.fillStyle = p.data.color;
			prevColor = p.data.color
		}
		ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
	})
}

function drawShadows (ctx, shadowMap) {
	let availableSpace = TownUtils.getAvailableScreenSpace();
	let availableTileCounts = TownUtils.calculateAvailableTiles(availableSpace, pathWidth, tileSize);
	let maxY = availableTileCounts.y * tileSize + availableTileCounts.y * pathWidth + pathWidth
	let maxX = availableTileCounts.x * tileSize + availableTileCounts.x * pathWidth + pathWidth
	ctx.globalAlpha = 0.3
	ctx.fillStyle = 'black';
	for (let y = 0; y <= maxY; y++) {
		let shadowMapY = shadowMap[y]
		if (!shadowMapY) continue
		for (let x = 0; x <= maxX; x++) {
			if (!shadowMapY[x]) continue
			ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
		}
	}
}

async function drawTileObjects (ctx, objectsMap) {
	ctx.globalAlpha = 1
	if (objectsMap) {

		// sort objects vertically so when we place the images they overlap correctly
		// as in images to the bottom are closer to the viewer than images on the top
		let objectKeys = Object.keys(objectsMap).sort((a, b) => {
			return objectsMap[a].y - objectsMap[b].y
		})

		// load all images ahead of time
		for (let k = 0; k < objectKeys.length; k++) {
			let o = objectsMap[objectKeys[k]];
			if (!o.data.src) continue
			if (loadedImages[o.data.src]) continue
			let img = await loadImageAsync(o.data.src)
			loadedImages[o.data.src] = img
		}
		let tempObjectsMap = {
			...objectsMap
		};

		drawObjectInOrder(objectKeys, tempObjectsMap, ctx);
	}
}

async function drawTiles(seasonColor, objectsMap, shadowMap, artifactMap) {
	let canvas = document.querySelector(`#town-canvas`);
	if (!canvas) {
		console.warn('failed to find town canvas');
		return
	}
	let ctx = canvas.getContext('2d');
	ctx.fillStyle = seasonColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	drawStreets(ctx)
	drawTileColors(ctx, objectsMap)
	drawArtifacts(ctx, artifactMap)
	drawShadows(ctx, shadowMap)
	await drawTileObjects(ctx, objectsMap)
}

function createTownCanvas(id, width, height) {
	let canvas = document.createElement('canvas');
	canvas.id = id;
	canvas.style.top = 0;
	canvas.style.left = 0;
	canvas.style.width = `${width / zoomFactor}px`;
	canvas.style.height = `${height / zoomFactor}px`;
	canvas.setAttribute('width', width)
	canvas.setAttribute('height', height)
	return canvas
}


async function start() {
	// Init tileFactory and register available tile types
	tileFactory.init(currentSeason, tileSize, pathWidth, pixelSize);
	tileFactory.registerTileType('forest', ForestTile);
	tileFactory.registerTileType('river', RiverTile);
	tileFactory.registerTileType('station', StationTile);
	tileFactory.registerTileType('building', BuildingsTile);

	// calculate available space for tiles and canvas
	let availableSpace = TownUtils.getAvailableScreenSpace();
	let availableTileCounts = TownUtils.calculateAvailableTiles(availableSpace, pathWidth, tileSize);
	
	// create town canvas
	let season = new Season(currentSeason)
	const town = document.querySelector('.town');
	town.innerHTML = ''
	let townWidth = availableTileCounts.x * tileSize + availableTileCounts.x * pathWidth + pathWidth
	let townHeight = availableTileCounts.y * tileSize + availableTileCounts.y * pathWidth + pathWidth
	town.style.width = `${townWidth / zoomFactor}px`
	town.style.height = `${townHeight / zoomFactor}px`
	town.style.background = season.color
	const townCanvas = createTownCanvas(`town-canvas`, townWidth, townHeight)
	town.append(townCanvas);

	// generate tile map and build the town structure
	elementMap = generateTileMap(availableTileCounts);
	const townBuilder = new TownBuilder(tileFactory, tileSize, pathWidth, pixelSize, availableTileCounts);
	townBuilder.registerElementsFromMap(elementMap);
	townBuilder.buildTown()

	// draw tiles to canvas
	await drawTiles(season.color, townBuilder.objectsMap, townBuilder.shadowMap, townBuilder.artifactMap);
	initMap(elementMap, townWidth, townHeight)
}

start()