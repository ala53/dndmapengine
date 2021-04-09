const LayerRenderer = require("./LayerRenderer");

module.exports = class TileRenderer extends LayerRenderer {
    renderLoop(deltaTime) {
        
    }

    drawTile(tile, x, y, width, height) {
        //Really simple: just render the tile's 
        //image
        this._canvasContext.drawImage(this._worldRenderer.imageCache.find(tile.image), x, y, width, height);
        //this._canvasContext.fillStyle = "green";
        //this._canvasContext.fillRect(x,y,width, height);
    }

    //Bottom layer, always opaque
    isOpaque(tile) { return true; }
}
