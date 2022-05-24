const tileSize = 200;
const pathWidth = 20;
let selectedNodes = [];
let elementMap = [];

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

function generateTileQuarter(nodeX, nodeY, transparent = []) {
	let quarterMap = [];
	quarterMap.push({
		x: nodeX, y: nodeY,
		locX: nodeX * (tileSize  + pathWidth) / 4, locY: nodeY * (tileSize + pathWidth) / 4,
		type: 'node',
		w: pathWidth, h: pathWidth,
	})
	quarterMap.push({
		x: nodeX + 1, y: nodeY,
		locX: nodeX * (tileSize + pathWidth) / 4 + pathWidth, locY: nodeY * (tileSize + pathWidth) / 4,
		type: 'path',
		orientation: 'h',
		w: (tileSize - pathWidth) / 2, h: pathWidth,
	})
	quarterMap.push({
		x: nodeX, y: nodeY + 1,
		locX: nodeX * (tileSize + pathWidth) / 4, locY: nodeY * (tileSize + pathWidth) / 4 + pathWidth,
		type: 'path',
		orientation: 'v',
		w: pathWidth, h: (tileSize - pathWidth) / 2,
	})
	transparent.forEach(n => {
		quarterMap[n].transparent = true;
	})
	return quarterMap
}

function generateTileMap(availableTileCounts) {
	let elementMap = [];
	for (let ty = 0; ty < availableTileCounts.y + 1; ty++) {
		for (let tx = 0; tx < availableTileCounts.x + 1; tx++) {
			if (tx == availableTileCounts.x) {
				elementMap.push({
					x: tx * 4, y: ty * 4,
					locX: tx * (tileSize + pathWidth), locY: ty * (tileSize + pathWidth),
					type: 'node',
					w: pathWidth, h: pathWidth,
				})
				if (ty != availableTileCounts.y) {
					elementMap.push({
						x: tx * 4, y: ty * 4 + 1,
						locX: tx * (tileSize + pathWidth), locY: ty * (tileSize + pathWidth) + pathWidth,
						type: 'path',
						orientation: 'v',
						w: pathWidth, h: (tileSize - pathWidth)/2,
					})
					
					elementMap.push({
						x: tx * 4, y: ty * 4 + 2,
						locX: tx * (tileSize + pathWidth), locY: ty * (tileSize + pathWidth) + pathWidth/2 + tileSize/2,
						type: 'node',
						w: pathWidth, h: pathWidth,
					})
					
					elementMap.push({
						x: tx * 4, y: ty * 4 + 3,
						locX: tx * (tileSize + pathWidth), locY: ty * (tileSize + pathWidth) + 1.5 * pathWidth + tileSize/2,
						type: 'path',
						orientation: 'v',
						w: pathWidth, h: (tileSize - pathWidth)/2,
					})
				}
			}
			if (ty == availableTileCounts.y) {
				elementMap.push({
					x: tx * 4, y: ty * 4,
					locX: tx * (tileSize + pathWidth), locY: ty * (tileSize + pathWidth),
					type: 'node',
					w: pathWidth, h: pathWidth,
				})
				if (tx != availableTileCounts.x) {
					elementMap.push({
						x: tx * 4 + 1, y: ty * 4,
						locX: tx * (tileSize + pathWidth) + pathWidth, locY: ty * (tileSize + pathWidth),
						type: 'path',
						orientation: 'h',
						w: (tileSize - pathWidth) / 2, h: pathWidth,
					})
					elementMap.push({
						x: tx * 4 + 2, y: ty * 4,
						locX: tx * (tileSize + pathWidth) + pathWidth/2 + tileSize/2, locY: ty * (tileSize + pathWidth),
						type: 'node',
						w: pathWidth, h: pathWidth,
					})
					elementMap.push({
						x: tx * 4 + 3, y: ty * 4,
						locX: tx * (tileSize + pathWidth) + 1.5* pathWidth + tileSize/2, locY: ty * (tileSize + pathWidth),
						type: 'path',
						orientation: 'h',
						w: (tileSize - pathWidth) / 2, h: pathWidth,
					})
				}
				
			}
			if (tx == availableTileCounts.x || ty == availableTileCounts.y) continue;
			elementMap.push({
				x: tx * 4 + 1, y: ty * 4 + 1,
				locX: tx * (tileSize + pathWidth) + pathWidth, locY: ty * (tileSize + pathWidth) + pathWidth,
				type: 'tile',
				orientation: 'v',
				w: tileSize, h: tileSize,
        tileData: randomTile(tileSize)
			})
			
			elementMap = elementMap.concat(generateTileQuarter(tx * 4, ty * 4))
			elementMap = elementMap.concat(generateTileQuarter(tx * 4 + 2, ty * 4, [2]))
			elementMap = elementMap.concat(generateTileQuarter(tx * 4, ty * 4 + 2, [1]))
			elementMap = elementMap.concat(generateTileQuarter(tx * 4 + 2, ty * 4 + 2, [1, 2]))
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

function drawTile(canvas) {
  if (!canvas.getContext) return;
  var ctx = canvas.getContext('2d');
}

function createMapElement(item) {
	let element = item.type == 'tile' ? document.createElement('canvas') : document.createElement('div');
	element.id = `n${item.x}_${item.y}`;
	element.style.top = `${item.locY}px`;
	element.style.left = `${item.locX}px`;
	element.style.width = `${item.w}px`;
	element.style.height = `${item.h}px`;
  if (item.type == 'tile') {
    element.setAttribute('width', tileSize)
    element.setAttribute('height', tileSize)  
  }
	element.setAttribute('data-type', item.type)
	element.setAttribute('data-orientation', item.orientation)
	element.classList.add(item.type)
	if (item.transparent) element.classList.add('transparent')
	if (item.orientation) element.classList.add(item.type + '_' + item.orientation)
	if (item.type == 'node') {
		element.onclick = function(event) {
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

function drawObjectInOrder(objectKeys, objectList, ctx) {
	if (objectKeys.length <= 0) return;
	let o = objectList[objectKeys[0]];
	if (!o.data.src) {
		let newKeys = [...objectKeys]
		newKeys.splice(0, 1)
		drawObjectInOrder(newKeys, objectList, ctx)
	}
	let img = new Image();
	img.onload = function() {
		ctx.drawImage(img, o.x * pixelSize, o.y * pixelSize);
		let newKeys = [...objectKeys]
		newKeys.splice(0, 1)
		drawObjectInOrder(newKeys, objectList, ctx)
	};
	img.src = o.data.src;
}

function drawTiles() {
  elementMap.forEach(item => {
    if (item.type == 'tile') {
	    let id = `n${item.x}_${item.y}`;
      let canvas = document.querySelector(`#${id}`);
      if (!canvas) {
        console.warn('failed to find canvas ' + id);
        return
      }
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = item.tileData.color;
      ctx.fillRect(0, 0, tileSize, tileSize);
      Object.keys(item.tileData.pathMap).forEach(k => {
        let p = item.tileData.pathMap[k];
        ctx.fillStyle = p.data.color;
        ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
      })

			let objectKeys = Object.keys(item.tileData.objectsMap).sort((a, b) => { return item.tileData.objectsMap[a].y - item.tileData.objectsMap[b].y })
			drawObjectInOrder(objectKeys, item.tileData.objectsMap, ctx);
    }
  })
}

function start() {
	const town = document.querySelector('.town');
	let availableSpace = getAvailableScreenSpace();
	let availableTileCounts = calculateAvailableTiles(availableSpace);
	console.log(availableSpace);
	console.log(availableTileCounts);
	elementMap = generateTileMap(availableTileCounts);
	town.innerHTML = ''
	elementMap.forEach(e => {
		town.append(createMapElement(e));
	})

  drawTiles();
}

start()