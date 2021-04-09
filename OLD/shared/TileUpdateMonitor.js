
const { TileGrid, TileObject } = require("./TileGrid");

class TileUpdateDefinition {
    //Short names for compact representation in JSON
    t;
    x;
    y;
    a;
    b;
    constructor(type, x, y, varA, varB) {
        //Types of updates: 0 = state, 1 = effect, 2 = occupier, 3 = image
        this.t = type;
        this.x = x;
        this.y = y;
        //the key in the key value pair
        this.a = varA;
        //the value
        this.b = varB;
    }
}

module.exports = class TileUpdateMonitor {
    //The list of pending updates for the client side
    //since th elast poll
    clientPendingList = [];
    //The list of pending updates for the admin panel
    //since the last poll
    adminPendingList = [];

    /**
     * @type TileGrid
     */
    _grid;
    /**
     * 
     * @param {TileGrid} grid 
     */
    constructor(grid, registerChangeHandlers = true) {
        _grid = grid;
        //register hooks so we can log changes
        if (registerChangeHandlers)
            grid.registerChangeHandlers(
                //state change    
                function (tile) {
                    var tU = new TileUpdateDefinition(0, tile.x, tile.y, tile.state);
                    this.clientPendingList.push(tU);
                    this.adminPendingList.push(tU);
                },

                //effect change
                function (tile, effect, state) {
                    var tU = new TileUpdateDefinition(1, tile.x, tile.y, effect, state);
                    this.clientPendingList.push(tU);
                    this.adminPendingList.push(tU);
                },
                //occupier change
                function (tile) {
                    occId = -1;
                    if (tile.occupier !== null)
                        occId = tile.occupier.id;
                    var tU = new TileUpdateDefinition(2, tile.x, tile.y, occId);
                    this.clientPendingList.push(tU);
                    this.adminPendingList.push(tU);

                },
                //image change
                function (tile) {
                    var tU = new TileUpdateDefinition(3, tile.x, tile.y, tile.image);
                    this.clientPendingList.push(tU);
                    this.adminPendingList.push(tU);
                });
    }

    clearAdminPendingList() { this.adminPendingList.length = 0; }
    clearClientPendingList() { this.clientPendingList.length = 0; }

    /**
     * 
     * @param {TileGrid} grid 
     * @param {[TileUpdateDefinition]} updateArray 
     */
    static applyUpdates(grid, updateArray) {
        updateArray.forEach((update) => {
            switch (update.t) {
                case 0:
                    //state
                    grid.getTile(update.x, update.y).state = update.a;
                    break;
                case 1:
                    //effect
                    grid.getTile(update.x, update.y).effects[update.a] = update.b;
                    break;
                case 2:
                    //occupier
                    grid.getTile(update.x, update.y).occupier = update.a;
                    break;
                case 3:
                    //image
                    grid.getTile(update.x, update.y).image = update.a;
                    break;
            }
        });

    }
}

