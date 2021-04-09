const constants = require("../constants");
var tile_tracker = require("./TileGrid");
//An occupier object. In other words, either a physical object that is 
//sitting on the touch screen and being tracked or a virtual occupier
//in the game world.
function occupier(id, isPlayer, isPhysical, x, y) {
    this.id = id;
    this.isPlayer = isPlayer;
    this.isPhysical = isPhysical;
    this.x = x;
    this.y = y;
    //A few DnD specific properties
    this.darkVision = 0;
    this.dimVision = 0;
    this.vision = 0;
    this.movement = 0;
    this.image = constants.defaultOccupierImage;
    this.tile = null;

    this.move = function(x,y) {
        if (x < 0 | x > constants.mapSizeBlocks | y < 0 | y >= constants.mapSizeBlocks) {
            throw "Object ID " + this.id + " attempted to move out of the world to x=" + x + ",y=" + y;
        }
        tile_tracker.getTile(this.x, this.y).setOccupier(null);
        tile_tracker.getTile(x, y).setOccupier(this);
        this.x = x;
        this.y = y;
    }
}

var world_occupiers = [];
