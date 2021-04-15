var TileFogOfWarState = { hidden: 0, uncovered: 1, visible: 2 }

class Tile {
    //Hidden = 0, uncovered = 1, visible = 2
    fogOfWarState = TileFogOfWarState.hidden;
    x = 0;
    y = 0;
}

class WorldObject {
    x;
    y;
    //The external linked object
    linkedObject;
    //Whether fog of war should be computed for this object
    affectsFogOfWar = false;
    //Whether this object should be actively considered as part of the world
    active = false;
}

class TileGrid {
    width = 0;
    height = 0;

    constructor(width, height) {
        this.width = width;
        this.height = height; 
    }

    getTile(x,y) {
        return new Tile();
    }
}
module.exports = { TileGrid, Tile, WorldObject, TileFogOfWarState }