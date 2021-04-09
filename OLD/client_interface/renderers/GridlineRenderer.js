var LayerRenderer = require("./LayerRenderer");

module.exports = class GridlineRenderer extends LayerRenderer {
    renderLoop(deltaTime) {
        
    }

    drawTile(tile, x, y, width, height) {
        //Draw a rectangular 1px border
        this._canvasContext.fillStyle = null;
        this._canvasContext.strokeStyle = "rgba(0.5,0.5,0.5,0.2)";
        this._canvasContext.strokeRect(x,y, width, height);
        this._canvasContext.strokeStyle = null;
    }
}
