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

    if (properties.dashLine && !Array.isArray(properties.dashLine)) {
      properties.dashLine = [20, 5]
    }

    if (isNew) this.ctx.beginPath()
    this.ctx.setLineDash(properties.dashLine || []);
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

  clear () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

export { MapCanvas }
