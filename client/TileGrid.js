var TileFogOfWarState = { hidden: 0, uncovered: 1, visible: 2 }

class Tile {
    //Hidden = 0, uncovered = 1, visible = 2
    fogOfWarState = TileFogOfWarState.hidden;
    x = 0;
    y = 0;
    //The world object occupying this space
    occupier;
    get occupied() { return this.occupier && this.occupier.active; }
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

    /**
     * @type {Tile[][]}
     */
    grid;

    constructor(width, height) {
        this.width = width;
        this.height = height; 

        //Generate the grid
        this.grid = new Array(width);
        for (var x = 0; x < this.grid.length; x++)
        {
            this.grid[x] = new Array(height);
            for (var y = 0; y < this.grid[x].length; y++) {
              var tile = new Tile();
              tile.x = x;
              tile.y = y;
              this.grid[x][y] = tile;
            }
        }
    }

    getTile(x,y) {
        return this.grid[x][y];
    }
}
module.exports = { TileGrid, Tile, WorldObject, TileFogOfWarState }