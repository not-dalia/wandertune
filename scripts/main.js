let selectedNodes = [];
let elementMap = [];
let loadedImages = {}

function getAvailableScreenSpace() {
	return {
		x: document.documentElement.clientWidth,
		y: document.documentElement.clientHeight
	}
}

function calculateAvailableTiles(availableSpace) {
	let xTiles = Math.floor((availableSpace.x - pathWidth) / (tileSize + pathWidth)) || 1;
	let yTiles = Math.floor((availableSpace.y - pathWidth) / (tileSize + pathWidth)) || 1;
	return {
		x: xTiles,
		y: yTiles
	}
}

function generateTileMap(availableTileCounts) {
	let elementMap = [];
	for (let ty = 0; ty < availableTileCounts.y + 1; ty++) {
		for (let tx = 0; tx < availableTileCounts.x + 1; tx++) {
			if (tx == availableTileCounts.x || ty == availableTileCounts.y) continue;
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

function disableNodes() {
	console.log('disabling nodes');
	let nodes = document.querySelectorAll('.node');
	if (selectedNodes.length == 0) {
		nodes.forEach(node => {
			node.classList.remove('last');
			node.classList.remove('disabled');
		})
	} else {
		let lastNode = selectedNodes[selectedNodes.length - 1];
		let [lnx, lny] = lastNode.substring(1).split('_');
		lnx = parseInt(lnx);
		lny = parseInt(lny);
		nodes.forEach(node => {
			let [nx, ny] = node.id.substring(1).split('_');
			nx = parseInt(nx);
			ny = parseInt(ny);
			if (nx <= lnx + 2 && nx >= lnx - 2 && ny <= lny + 2 && ny >= lny - 2 && Math.abs(lnx - nx) != Math.abs(lny - ny)) {
				node.classList.remove('disabled');
			} else {
				node.classList.add('disabled');
			}
			node.classList.remove('last');
		})
		let lastNodeElement = document.querySelector(`#${selectedNodes[selectedNodes.length - 1]}`);
		if (lastNodeElement) lastNodeElement.classList.add('last');
	}
}

function renderPaths() {
	let paths = document.querySelectorAll('.path.selected');
	paths.forEach(path => {
		path.classList.remove('selected');
	})
	selectedNodes.forEach((node, i) => {
		if (i == 0) return;
		let prevNode = selectedNodes[i - 1];
		let [nx, ny] = node.substring(1).split('_');
		let [pnx, pny] = prevNode.substring(1).split('_');
		nx = parseInt(nx);
		ny = parseInt(ny);
		pnx = parseInt(pnx);
		pny = parseInt(pny);
		let px = (nx == pnx) ? nx : (nx - pnx) / 2 + pnx;
		let py = (ny == pny) ? ny : (ny - pny) / 2 + pny;
		let path = document.querySelector(`#n${px}_${py}`);
		if (path) path.classList.add('selected');
	})
}

function createMapElement(item, i) {
	if (item.type == 'tile') return;
	let element = document.createElement('div');
	element.id = `n${item.x}_${item.y}`;
	element.style.top = `${item.locY}px`;
	element.style.left = `${item.locX}px`;
	element.style.width = `${item.w}px`;
	element.style.height = `${item.h}px`;
	element.setAttribute('data-type', item.type)
	element.setAttribute('data-element-index', i)
	element.setAttribute('data-orientation', item.orientation)
	element.classList.add(item.type)
	if (item.transparent) element.classList.add('transparent')
	if (item.orientation) element.classList.add(item.type + '_' + item.orientation)
	if (item.type == 'node') {
		element.onclick = function (event) {
			let clickedItem = event.target;
			console.log(clickedItem)
			let lastNode = selectedNodes.length && selectedNodes[selectedNodes.length - 1];
			if (clickedItem.id == lastNode) {
				selectedNodes.splice(selectedNodes.length - 1, 1);
				if (selectedNodes.indexOf(clickedItem.id) < 0) clickedItem.classList.remove('selected');
				disableNodes();
			} else if (clickedItem.classList.contains('disabled')) return;
			else {
				clickedItem.classList.add('selected');
				selectedNodes.push(clickedItem.id);
				disableNodes();
			}
			renderPaths();
		}
	}

	return element;
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

async function drawTiles(objectsMap, shadowMap, artifactMap, busyAreas) {
	let backgroundSet = false;
	let canvas = document.querySelector(`#town-canvas`);
	let ctx = canvas.getContext('2d');
	let season = new Season(currentSeason)
	ctx.fillStyle = season.color;
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	for (let i = 0; i < elementMap.length; i++) {
		let item = elementMap[i];
		if (item.tileData) {
			ctx.resetTransform();
			ctx.translate(item.locX, item.locY)
			if (!backgroundSet && item.tileData.color) {
				backgroundSet = true;
				let season = new Season(currentSeason)
				document.querySelector('.town').style.background = season.color
			}
			let id = `n${item.x}_${item.y}`;
			if (!canvas) {
				console.warn('failed to find canvas ' + id);
				return
			}

			if (item.tileData.streets) {
				ctx.fillStyle = '#546e7a';
				ctx.fillRect(0, 0, tileSize + 2 * pathWidth, tileSize + 2 * pathWidth);
				Object.keys(item.tileData.streets).forEach(k => {
					let p = item.tileData.streets[k];
					ctx.fillStyle = p.data.color;
					ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
				})
			}
		}
	}

	
	for (let i = 0; i < elementMap.length; i++) {
		let item = elementMap[i];
		if (item.tileData) {
			ctx.resetTransform();
			ctx.translate(item.locX, item.locY)

			ctx.fillStyle = item.tileData.color;
			ctx.fillRect(pathWidth, pathWidth, tileSize, tileSize);
			// if (item.tileData.type == 'buildings') {
			// 	ctx.clearRect(pathWidth, pathWidth, tileSize, tileSize);
			// }
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

			console.log('here')
			/* item.tileData.artifactMap && Object.keys(item.tileData.artifactMap).forEach(k => {
				let p = item.tileData.artifactMap[k];
				ctx.fillStyle = p.data.color;
				ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
			}) */

			/* ctx.globalAlpha = 0.3
			item.tileData.shadowMap && Object.keys(item.tileData.shadowMap).forEach(k => {
				let p = item.tileData.shadowMap[k];
				ctx.fillStyle = 'black';
				ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
			}) */

		/* 	ctx.globalAlpha = 1
			if (item.tileData.objectsMap) {
				let objectKeys = Object.keys(item.tileData.objectsMap).sort((a, b) => {
					return item.tileData.objectsMap[a].y - item.tileData.objectsMap[b].y
				})
				let objectsMap = {
					...item.tileData.objectsMap
				};
				if (item.tileData.bridges) {
					item.tileData.bridges.forEach((b, i) => {
						objectsMap[`b_${i}`] = b
						objectKeys.push(`b_${i}`)
					})
				}
				drawObjectInOrder(objectKeys, objectsMap, ctx);
			} */

		}
	}
	ctx.resetTransform()

	artifactMap && Object.keys(artifactMap).forEach(k => {
		let p = artifactMap[k];
		ctx.fillStyle = p.data.color;
		ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
	})

	ctx.globalAlpha = 0.3
	shadowMap && Object.keys(shadowMap).forEach(k => {
		let p = shadowMap[k];
		ctx.fillStyle = 'black';
		ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
	})

	ctx.globalAlpha = 1
	if (objectsMap) {
		let objectKeys = Object.keys(objectsMap).sort((a, b) => {
			return objectsMap[a].y - objectsMap[b].y
		})
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
	/* 
	ctx.resetTransform()
	ctx.globalAlpha = 0.3
	if (busyAreas) {
		busyAreas.all().forEach(k => {
			ctx.fillStyle = 'red';
			ctx.fillRect(k.minX * pixelSize, k.minY * pixelSize, (k.maxX - k.minX) * pixelSize, (k.maxY - k.minY) *pixelSize);
		})
	} */
}

function parseIndexToCoords(index) {
	let [x, y] = index.split('_');
	x = parseInt(x);
	y = parseInt(y);
	return {
		x,
		y
	};
}

function createRiverPath(elementMap, availableTileCounts) {
	let riverCount = 1
	let side = ['x', 'y'][randomInt(2)]
	let coordinates = {
		x: side == 'x' ? randomInt(availableTileCounts.x - 1) : [0, (availableTileCounts.x - 1)][randomInt(2)],
		y: side == 'y' ? randomInt(availableTileCounts.y - 1) : [0, (availableTileCounts.y - 1)][randomInt(2)],
	}
	let edgePoint = {
		x: coordinates.x * 4 + 1,
		y: coordinates.y * 4 + 1,
	}
	let element = document.querySelector(`#n${edgePoint.x}_${edgePoint.y}`)
	let elementIndex = element.dataset.elementIndex;
	let elementData = elementMap[elementIndex]
	let direction;
	if (edgePoint.x == 1) direction = 'l'
	else if (edgePoint.x == (availableTileCounts.x - 1) * 4 + 1) direction = 'r'
	else if (edgePoint.y == 1) direction = 'u'
	else direction = 'd'
	if (elementData.tileData) {
		return
	}
	elementData.tileData = riverStart(direction).data
	let canGenerateNextTile = true;
	while (canGenerateNextTile) {
		riverCount++
		let riverData = elementMap[elementIndex].tileData.objectsMap[0].data
		let direction = directions[(directions.indexOf(riverData.direction.exit) + 2) % 4]
		if (!riverData.direction.exit) break;
		if (riverData.direction.exit == 'u') {
			coordinates.y = coordinates.y - 1;
			if (coordinates.y < 0) break;
		} else if (riverData.direction.exit == 'd') {
			coordinates.y = coordinates.y + 1;
			if (coordinates.y > availableTileCounts.y - 1) break;
		} else if (riverData.direction.exit == 'l') {
			coordinates.x = coordinates.x - 1;
			if (coordinates.x < 0) break;
		} else {
			coordinates.x = coordinates.x + 1;
			if (coordinates.x > availableTileCounts.x - 1) break;
		}
		let newPoint = {
			x: coordinates.x * 4 + 1,
			y: coordinates.y * 4 + 1,
		}
		element = document.querySelector(`#n${newPoint.x}_${newPoint.y}`)
		if (elementMap[element.dataset.elementIndex].tileData) {
			elementMap[elementIndex].tileData = riverLake(riverData.direction.enter, 'lake').data
		} else {
			elementIndex = element.dataset.elementIndex;
			elementMap[elementIndex].tileData = riverStart(direction).data
		}
	}
	return riverCount
}


function createTrainStationTile(elementMap, availableTileCounts) {
	let c = 12;

	do {
		c--;

		let side = ['x', 'y'][randomInt(2)]
		let coordinates = {
			x: side == 'x' ? randomInt(availableTileCounts.x - 1) : [0, (availableTileCounts.x - 1)][randomInt(2)],
			y: side == 'y' ? randomInt(availableTileCounts.y - 1) : [0, (availableTileCounts.y - 1)][randomInt(2)],
		}
		let edgePoint = {
			x: coordinates.x * 4 + 1,
			y: coordinates.y * 4 + 1,
		}

		let element = document.querySelector(`#n${edgePoint.x}_${edgePoint.y}`)
		let elementIndex = element.dataset.elementIndex;
		let elementData = elementMap[elementIndex]
		if (elementData.tileData) continue;
		let direction;
		if (edgePoint.x == 1) direction = 'l'
		else if (edgePoint.x == (availableTileCounts.x - 1) * 4 + 1) direction = 'r'
		else if (edgePoint.y == 1) direction = 'u'
		else direction = 'd'

		elementData.tileData = trainStart(tileSize, direction).data
		break;
	} while (c >= 0)
}

function getElementIndexByTilePoint(point) {
	let element = document.querySelector(`#n${point.x * 4 + 1}_${point.y * 4 + 1}`)
	let elementIndex = element.dataset.elementIndex;
	return elementIndex
}


function start() {
	tileFactory.init(currentSeason, tileSize, pathWidth, pixelSize);

	const town = document.querySelector('.town');
	let availableSpace = getAvailableScreenSpace();
	let availableTileCounts = calculateAvailableTiles(availableSpace);
	console.log(availableSpace);
	console.log(availableTileCounts);
	elementMap = generateTileMap(availableTileCounts);
	town.innerHTML = ''
	town.style.width = `${availableTileCounts.x * tileSize + availableTileCounts.x * pathWidth + pathWidth}px`
	town.style.height = `${availableTileCounts.y * tileSize + availableTileCounts.y * pathWidth + pathWidth}px`
	let canvas = document.createElement('canvas');
	canvas.id = `town-canvas`;
	canvas.style.top = 0;
	canvas.style.left = 0;
	canvas.style.width = `${town.style.width}px`;
	canvas.style.height = `${town.style.height}px`;
	canvas.setAttribute('width', town.style.width)
	canvas.setAttribute('height', town.style.height)
	town.append(canvas);

	const townBuilder = new TownBuilder(tileSize, pathWidth, pixelSize, availableTileCounts);
	townBuilder.registerElementsFromMap(elementMap);
	let riverLength = townBuilder.createRiverPath();
	if (riverLength < (availableTileCounts.x * availableTileCounts.y) * 0.2) townBuilder.createRiverPath();

	townBuilder.createTrainStationTile();
	townBuilder.createTownCentre();
	townBuilder.generateStreets();
	townBuilder.generateAllTilesData(elementMap);

	drawTiles(townBuilder.objectsMap, townBuilder.shadowMap, townBuilder.artifactMap, townBuilder.busyAreas);
	console.log(townBuilder.busyAreas.all())
}

start()