function randomTile(probabilityCutoff) {
  let probability = randomInt(100)
  if (probability > probabilityCutoff)
    return tileFactory.make('buildings');
  else 
    return tileFactory.make('forest');
}

function riverStart(direction) {
  let type = ['bend', 'straight'][randomInt(2)];
  return tileFactory.make('river', direction, type);
}

function riverLake(direction) {
  return tileFactory.make('river', direction, 'lake');
}

function trainStart(tileSize, direction) {
  return tileFactory.make('station', direction);
}

function registerArtifacts() {
  ArtifactDefinitions.registerArtifact('zigzag_1', [new ArtifactPoint(0, 0), new ArtifactPoint(1, 1), new ArtifactPoint(2, 0), new ArtifactPoint(3, 1)]);
  ArtifactDefinitions.registerArtifact('dot_b', [new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, 0), new ArtifactPoint(1, 1)]);
  ArtifactDefinitions.registerArtifact('dot_s', [new ArtifactPoint(0, 0)]);
  ArtifactDefinitions.registerArtifact('flower_1', [new ArtifactPoint(1, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, 1, 1), new ArtifactPoint(2, 1), new ArtifactPoint(1, 2)], ['#a3c89b', '#d9682f']);
  ArtifactDefinitions.registerArtifact('leaf_1', [new ArtifactPoint(-1, 0), new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(1, -1)]);
  ArtifactDefinitions.registerArtifact('grass_1', [new ArtifactPoint(0, 2), new ArtifactPoint(2, 2), new ArtifactPoint(2, 1), new ArtifactPoint(2, 0), new ArtifactPoint(4, 2), new ArtifactPoint(4, 1)]);
  ArtifactDefinitions.registerArtifact('grass_2', [new ArtifactPoint(0, 1), new ArtifactPoint(1, 2), new ArtifactPoint(2, 0), new ArtifactPoint(2, 1), new ArtifactPoint(2, 2), new ArtifactPoint(3, 2), new ArtifactPoint(4, 1)]);
  ArtifactDefinitions.registerArtifact('grass_3', [new ArtifactPoint(0, 2), new ArtifactPoint(1, 0), new ArtifactPoint(2, 1), new ArtifactPoint(2, 2)]);
  ArtifactDefinitions.registerArtifact('grass_4', [new ArtifactPoint(0, 0), new ArtifactPoint(0, 1), new ArtifactPoint(0, 2), new ArtifactPoint(2, 2), new ArtifactPoint(2, 1)]);
  ArtifactDefinitions.registerArtifact('grass_5', [new ArtifactPoint(0, 0), new ArtifactPoint(1, 1), new ArtifactPoint(1, 2), new ArtifactPoint(3, 0), new ArtifactPoint(3, 1), new ArtifactPoint(3, 2), new ArtifactPoint(4, 2), new ArtifactPoint(5, 1)]);
}

function registerTiles() {
  tileFactory.registerTileType('forest', ForestTile);
  tileFactory.registerTileType('river', RiverTile);
  tileFactory.registerTileType('station', StationTile);
  tileFactory.registerTileType('buildings', BuildingsTile);
}

const ArtifactDefinitions = new ArtifactDefinitionsRegistry();
registerArtifacts();

const tileFactory = new TileFactory();
registerTiles();
