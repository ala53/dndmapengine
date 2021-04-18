const WorldManager = require("../WorldManager");

module.exports = class GridlineRenderer {
    static gridlineColor = "rgba(255,255,255,0.3)";
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
        var widthPx = Math.min((this.worldManager.map.width - viewport.left) * viewport.tileWidthPx, viewport.widthPx);
        var heightPx = Math.min((this.worldManager.map.height - viewport.top) * viewport.tileHeightPx, viewport.heightPx);

        ctx.strokeStyle = GridlineRenderer.gridlineColor;
        ctx.fillStyle = null;
        ctx.globalCompositeOperation = "difference";
        //Draw the vertical lines
        for (var x = startX; x < Math.min(viewport.right, this.worldManager.map.width); x++) {
            //Every 5 lines make a bold one
            if (x % 5 == 0) ctx.lineWidth = 2;
            else ctx.lineWidth = 1;

            var xOffsetPx = (x - viewport.left) * viewport.tileWidthPx;
            ctx.beginPath();
            ctx.moveTo(xOffsetPx, 0);
            ctx.lineTo(xOffsetPx, heightPx);
            ctx.stroke();
        }
        //Draw the horizontal lines
        for (var y = startY; y < Math.min(viewport.bottom, this.worldManager.map.height); y++) {
            //Every 5 lines make a bold one
            if (y % 5 == 0) ctx.lineWidth = 2;
            else ctx.lineWidth = 1;

            var yOffsetPx = (y - viewport.top) * viewport.tileHeightPx;
            ctx.beginPath();
            ctx.moveTo(0, yOffsetPx);
            ctx.lineTo(widthPx, yOffsetPx);
            ctx.stroke();
        }
    }

}
