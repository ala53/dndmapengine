const {TileGrid, TileObject} = require("../../shared/TileGrid");
//const WorldRenderer = require("../WorldRenderer");
module.exports = class LayerRenderer {
    _worldRenderer;
    _tileGrid;
    /**
     * @type CanvasRenderingContext2D
     */
    _canvasContext;
    /**
     * 
     * @param {TileGrid} tileGrid 
     * @param {WorldRenderer} worldRenderer 
     */
    constructor(tileGrid, worldRenderer, canvasContext) {
        this._tileGrid = tileGrid;
        this._worldRenderer = worldRenderer;
        this._canvasContext = canvasContext;
    }
    /**
     * 
     * @param {function():number} timeDelta Time since last frame in MS
     */
    renderLoop(timeDelta) {}
    /**
     * Allows for deferred work to be executed on the main thread, in a piecemeal fashion
     * @param {Number} timeBudget Milliseconds left for deferred work
     */
    deferredWork(timeBudget) {}
    drawTile(tile, x, y, width, height) { }
    /**
     * Returns true if the this layer will render completely
     * opaque over the lower layers. This allows for optimized
     * rendering by avoiding unnecessary overdraw. If there is
     * any possibility it will not be opaque, then return false
     * @param {TileObject} tile 
     */
    isOpaque(tile) {
        return false;
    }

    redrawEveryFrame(tile) {
        return false;
    }
}
