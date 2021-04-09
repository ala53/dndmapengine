module.exports = class EffectTypeRenderer {
    /**
     * 
     */
    _worldRenderer;
    /**
     * @type {TileGrid}
     */
    _tileGrid;
    /**
     * @type CanvasRenderingContext2D
     */
    _canvasContext;
    constructor(tileGrid, worldRenderer, context) {
        this._worldRenderer = worldRenderer;
        this._tileGrid = tileGrid;
        this._canvasContext = context;
    }
    renderLoop(timeDelta) {

    }
    drawTile(tile, x, y, width, height) {

    }
    
    //Returns whether this effect is rendered when the effect
    //state is set to the specified boolean
    /**
     * 
     * @param {boolean} state 
     * @returns {boolean} Whether the effect is actively rendered at this time
     */
    isRendered(state, tile) { return state; }
    isOpaque(tile) { return false; }

    //Returns true if the effect needs to update every frame
    isRenderedEveryFrame(tile) { return false; }
}