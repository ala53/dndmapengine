const LayerRenderer = require("./LayerRenderer");

module.exports = class TileRenderer extends LayerRenderer {
    renderLoop(deltaTime) {
        
    }

    drawTile(tile, x, y, width, height) {
        //Really simple: just render the tile's 
        //image
        if (typeof(tile.image) === "string")
            this._canvasContext.drawImage(this._worldRenderer.imageCache.find(tile.image), x, y, width, height);
    }

}
