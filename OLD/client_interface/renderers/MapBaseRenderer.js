const MapInfo = require("../../MapInfo");
const LayerRenderer = require("./LayerRenderer");

module.exports = class MapBaseRenderer extends LayerRenderer {
    renderLoop(deltaTime) {
        
    }

    drawTile(tile, x, y, width, height) {
        var image = this._worldRenderer.imageCache.find(MapInfo.backgroundImage);
        var imgWidth = image.width;
        var imgHeight = image.height;
        var pxPerBlockWidth = imgWidth / MapInfo.width;
        var pxPerBlockHeight = imgHeight / MapInfo.height;

        var topOfTile = Math.floor(pxPerBlockWidth * tile.x);
        var leftOfTile = Math.floor(pxPerBlockHeight * tile.y);
        //console.log("X");
        //Really simple: just render the global map image for this tile
        this._canvasContext.drawImage(image, 
            //Clip location
            topOfTile, leftOfTile, Math.floor(pxPerBlockWidth), Math.floor(pxPerBlockHeight),
            //On screen location
            x, y, width, height);
    }

    //Bottom layer, always opaque
    isOpaque(tile) { return true; }
}
