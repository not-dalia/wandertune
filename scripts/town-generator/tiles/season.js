import { ArtifactDefinitions } from '../artifact.js'

class Season {
  constructor(name) {
    this._colors = {
      summer: '#71c62b',
      spring: '#7fb76f',
      autumn: '#b0b964',
      winter: '#f0f8ff'
    }

    this._artifactColors = {
      summer: '#96e057',
      spring: '#a3c89b',
      autumn: '#c6d087',
      winter: '#bdecff'
    }

    this._name = name;
    this._color = this._colors[name];
    this._artifactColor = this._artifactColors[name];
    this.trees = [];
    this.artifacts = [];
    this.buildings = [];
  }

  setTrees(trees) {
    this.trees = [...trees];
  }

  setBuildings(buildings) {
    this.buildings = [...buildings];
  }

  setArtifacts(artifacts = []) {
    this.artifacts = []
    artifacts.forEach(a => {
      let [name, colors] = a;
      if (!colors) colors = [this._artifactColor]
      this.artifacts.push(ArtifactDefinitions.getArtifact(name, colors))
    })
  }

  get color() {
    return this._color
  }

  get name() {
    return this._name;
  }
}

export { Season }