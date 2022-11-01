class ArtifactPoint {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.color = color
  }

  get data() {
    return {
      x: this.x,
      y: this.y,
      color: this.color
    }
  }
}


class ArtifactDefinitionsRegistry {
  constructor() {
    if (ArtifactDefinitionsRegistry.exists) {
      return ArtifactDefinitionsRegistry.instance;
    }
    this._artifacts = {}
    ArtifactDefinitionsRegistry.instance = this;
    ArtifactDefinitionsRegistry.exists = true;
    return this;
  }

  registerArtifact = (name, points, colors = ['#a3c89b']) => {
    if (this._artifacts[name]) {
      throw new Error('Trying to register an existing artifact.');
    }
    this._artifacts[name] = {
      type: name,
      colors,
      points
    }
  }

  getArtifact(name, colors = []) {
    let artifact = {
      ...this._artifacts[name]
    }
    artifact.colors = [...this._artifacts[name].colors]
    colors.forEach((c, i) => {
      artifact.colors[i] = c
    })
    return artifact
  }

  registerArtifacts(artifacts) {
    artifacts.forEach(a => {
      this.registerArtifact(a.name, a.points, a.colors)
    })
  }
}

const ArtifactDefinitions = new ArtifactDefinitionsRegistry()
ArtifactDefinitions.registerArtifacts([
  {
    name: 'zigzag_1',
    points: [new ArtifactPoint(0, 0), new ArtifactPoint(1, 1), new ArtifactPoint(2, 0), new ArtifactPoint(3, 1)],
  },
  {
    name: 'dot_b', 
    points: [new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, 0), new ArtifactPoint(1, 1)]
  },
  {
    name: 'dot_s',
    points: [new ArtifactPoint(0, 0)]
  },
  {
    name: 'flower_1',
    points: [new ArtifactPoint(1, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, 1, 1), new ArtifactPoint(2, 1), new ArtifactPoint(1, 2)], 
    colors: ['#a3c89b', '#d9682f']
  },
  {
    name: 'leaf_1',
    points: [new ArtifactPoint(-1, 0), new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, -1)]
  },
  {
    name: 'grass_1',
    points: [new ArtifactPoint(0, 2), new ArtifactPoint(2, 2), new ArtifactPoint(2, 1), new ArtifactPoint(2, 0), new ArtifactPoint(4, 2), new ArtifactPoint(4, 1)]
  },
  {
    name: 'grass_2',
    points: [new ArtifactPoint(0, 1), new ArtifactPoint(1, 2), new ArtifactPoint(2, 0), new ArtifactPoint(2, 1), new ArtifactPoint(2, 2), new ArtifactPoint(3, 2), new ArtifactPoint(4, 1)]
  },
  {
    name: 'grass_3',
    points: [new ArtifactPoint(0, 2), new ArtifactPoint(1, 0), new ArtifactPoint(2, 1), new ArtifactPoint(2, 2)]
  },
  {
    name: 'grass_4',
    points: [new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(0, 2), new ArtifactPoint(2, 2), new ArtifactPoint(2, 1)]
  },
  {
    name: 'grass_5',
    points: [new ArtifactPoint(0, 0), new ArtifactPoint(1, 1), new ArtifactPoint(1, 2), new ArtifactPoint(3, 0), new ArtifactPoint(3, 1), new ArtifactPoint(3, 2), new ArtifactPoint(4, 2), new ArtifactPoint(5, 1)]
  },
  
  {
    name: 'brick',
    points: [[2, 0], [3, 0], [4, 0], [5, 0], [4, 1], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2]].map(p => new ArtifactPoint(p[0], p[1]))
  },
  {
    name: 'brick_2',
    points: [[1, 0], [5,0], [9,0], [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1], [7,1], [8,1],[9,1],[3,2],[7,2],[4,3],[5,3],[6,3],[7,3], [8,3]].map(p => new ArtifactPoint(p[0], p[1]))
  }
])
export { ArtifactDefinitions }
