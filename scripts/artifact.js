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
}
