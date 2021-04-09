var Constants = require("../Constants");

// An object in the fog of war grid. State = is hidden, 
//state 1 is previously uncovered, state 2 is currently uncovered
class TileObject {
    _x = 0;
    _y = 0;
    _occupier = null;
    _image = null;
    _state = 0;
    _tileGrid;
    _effects = {
        //on fire?
        fire: false,
        //underwater?
        underwater: false,
        //difficult terrain?
        difficult: false,
        //Can this tile be traversed
        traversible: true,
        //does this act as a wall to fog of war?
        //preventing tracing through it
        wall: false,
        //rubble present?
        rubble: false,
        //player occupied specifically?
        playerOccupied: false,
        //Occupied at all?
        occupied: false,
        //dark tile?
        dark: false,
        //dim light?
        dim: false,
        //Stairs headed upward?
        stairsUp: false,
        //Stairs headed downward?
        stairsDown: false
    };
    /**
     * 
     * @param {Number} pos_x 
     * @param {Number} pos_y 
     * @param {Number | String} fowState 
     * @param {TileGrid} tileGrid 
     */
    constructor(pos_x, pos_y, fowState, tileGrid) {
        this._x = pos_x;
        this._y = pos_y;
        this._tileGrid = tileGrid;

        this.fowState = fowState;
    }
    get x() { return this._x; }
    get y() { return this._y; }

    get fowState() { return this._state; }
    set fowState(state) {
        if (state === "visible")
            state = 2;
        if (state === "uncovered")
            state = 1;
        if (state === "hidden")
            state = 0;
        if (typeof (state) !== "number" | state < 0 | state > 2)
            throw ("invalid state value, can be 0, 1, 2, or visible, hidden, uncovered")
        this._state = state;
        this._tileGrid._stateChangeHandler(this);
    }

    getEffect(effect) {
        return (this._effects[effect] == true);
    }
    /**
     * 
     * @param {String} effect 
     * @param {boolean} state 
     */
    setEffect(effect, state) {
        if (state === true || state === false) {
            var oldState = this._effects[effect];
            this._effects[effect] = state;
            //Fire only if changed
            if (oldState !== state)
                this._tileGrid._effectChangeHandler(this, effect, state);
        }
        else throw "Invalid effect state " + state;
    }

    get image() { return this._image; }
    /**
     * @param {String} image
     */
    set image(image) {
        var oldImage = this._image;
        this._image = image;
        if (oldImage != image)
            this._tileGrid._imageChangeHandler(this);
    }
    get occupier() { return this._occupier; }
    set occupier(occupier) {
        if (occupier == null) {
            var oldOccupier = this._occupier;
            this._occupier = null;
            this.setEffect("occupied", false);
            this.setEffect("playerOccupied", false);
            //Fire only if changed
            if (oldOccupier !== null)
                this._tileGrid._occupierChangeHandler(this);
            return;
        }

        if (occupier.isPlayer) {
            this.setEffect("playerOccupied", true);
        }
        else this.setEffect("playerOccupied", false);

        this.setEffect("occupied", true);
    }
}

class TileGrid {
    _backingGrid = [];
    _stateChangeHandler = function (tile) { };
    _effectChangeHandler = function (tile, effect, state) { };
    _occupierChangeHandler = function (tile) { };
    _imageChangeHandler = function (tile) { };
    /**
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    constructor(width, height) {

        for (var x = 0; x < width; x++) {
            this._backingGrid[x] = Array(height);
            for (var y = 0; y < height; y++) {
                this._backingGrid[x][y] = new TileObject(x, y, 0, this);
            }
        }
    }

    //Calls a callback whenever a property on a tile is changed
    registerChangeHandlers(state, effect, occupier, image) {
        this._stateChangeHandler = state;
        this._effectChangeHandler = effect;
        this._occupierChangeHandler = occupier;
        this._imageChangeHandler = image;
    }

    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     * @returns {TileObject}
     */
    getTile(x,y) {
        return this._backingGrid[x][y];
    }

    get width() { return this._backingGrid.length; }
    get height() { return this._backingGrid[0].length; }

}

module.exports = { TileGrid: TileGrid, TileObject: TileObject };