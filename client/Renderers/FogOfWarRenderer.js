const { TileFogOfWarState } = require("../TileGrid");
const WorldManager = require("../WorldManager");

module.exports = class FogOfWarRenderer {
    static fogOfWarHiddenColor = "red";
    static fogOfWarUncoveredColor = "yellow";
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
        var tileGrid = this.worldManager.tileGrid;
        //Iterate through the grid
        for (var x = Math.floor(viewport.left); x < viewport.right; x++) {
        for (var y = Math.floor(viewport.top); y < viewport.bottom; y++) {
            var tile = tileGrid.getTile(x,y);
            if (x >= viewport.right) continue;
            if (y >= viewport.bottom) continue;
            var screenX = Math.max(0, x * viewport.tileWidthPx);
            var screenY = Math.max(0, y * viewport.tileHeightPx);
            var right = Math.min(screenX + viewport.tileWidthPx, viewport.rightPx);
            var bottom = Math.min(screenY + viewport.tileHeightPx, viewport.bottomPx);
            var width = right - screenX;
            var height = bottom - screenY;

            if (tile.fogOfWarState == TileFogOfWarState.hidden) {
                ctx.fillStyle = FogOfWarRenderer.fogOfWarHiddenColor;
                ctx.fillRect(screenX, screenY, width, height);
            }
            else if (tile.fogOfWarState == TileFogOfWarState.uncovered) {
                ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;
                ctx.fillRect(screenX, screenY, width, height);
            }
        }
        }

        ctx.fill();
    }

}
