const EffectTypeRenderer = require("./EffectTypeRenderer");


module.exports = 
//Renders a sprite sheet as an animation
class SpriteSheetImageEffectRenderer extends EffectTypeRenderer {
    _spriteFile;
    _rows;
    _columns;
    _currentIndex = 0;
    _fps = 0;
    /**
     * 
     * @param {Number} timeDelta 
     */
    renderLoop(timeDelta) {

    }
    drawTile(tile, x, y, width, height) {

    }

    constructor(tileGrid, worldRenderer, context, spriteFile, rows, columns, fps = 4) {
        super(tileGrid, worldRenderer, context);

    }

    isRenderedEveryFrame(tile) {
        return true;
    }
}