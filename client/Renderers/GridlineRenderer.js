const WorldManager = require("../WorldManager");

module.exports = class GridlineRenderer {
    static gridlineColor = "rgba(0.5,0.5,0.5,0.5)";
    /**
     * 
     * @type {WorldManager}
     */
    worldManager;
    constructor(manager) {
        this.worldManager = manager;
    }

    renderLoop(deltaTime) {
        var ctx = this.worldManager.context;
        var viewport = this.worldManager.viewport;
        var startX = Math.floor(viewport.left) + 1; // Start one tile from the left
        var startY = Math.floor(viewport.top) + 1; // Start one tile from the top

        ctx.strokeStyle = GridlineRenderer.gridlineColor;
        ctx.beginPath();
        //Draw the vertical lines
        for (var x = startX; x < viewport.right; x++) {
            var xOffsetPx = (x - viewport.left) * viewport.tileWidthPx;
            ctx.moveTo(xOffsetPx, 0);
            ctx.lineTo(xOffsetPx, viewport.heightPx);
        }
        //Draw the horizontal lines
        for (var y = startY; y < viewport.bottom; y++) {
            var yOffsetPx = (y - viewport.top) * viewport.tileHeightPx;
            ctx.moveTo(0, yOffsetPx);
            ctx.lineTo(viewport.widthPx, yOffsetPx);
        }

        ctx.stroke();
    }

}
