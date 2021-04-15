const { TileFogOfWarState } = require("../TileGrid");
const WorldManager = require("../WorldManager");

module.exports = class FogOfWarRenderer {
    static fogOfWarHiddenColor = "rgba(0,0,0,0.85)";
    static fogOfWarUncoveredColor = "rgba(0.5,0.5,0.5,0.5)";
    /**
     * 
     * @type {WorldManager}
     */
    worldManager;
    constructor(manager) {
        this.worldManager = manager;
    }

    renderLoop(deltaTime) {
        this.deferredLoop();
        var ctx = this.worldManager.context;
        var viewport = this.worldManager.viewport;
        var tileGrid = this.worldManager.tileGrid;
        //Iterate through the grid
        for (var x = Math.floor(viewport.left); x < viewport.right; x++) {
        for (var y = Math.floor(viewport.top); y < viewport.bottom; y++) {
            var tile = tileGrid.getTile(x,y);

            if (x >= viewport.right) continue;
            if (y >= viewport.bottom) continue;
            var left = Math.floor(Math.max(0, x * viewport.tileWidthPx));
            var top = Math.floor(Math.max(0, y * viewport.tileHeightPx));
            var right = Math.ceil(Math.min(left + viewport.tileWidthPx, viewport.rightPx));
            var bottom = Math.ceil(Math.min(top + viewport.tileHeightPx, viewport.bottomPx));
            var width = right - left;
            var height = bottom - top;

            //Choose an appropriate color
            if (tile.fogOfWarState == TileFogOfWarState.hidden) {
                ctx.fillStyle = FogOfWarRenderer.fogOfWarHiddenColor;
                ctx.fillRect(left, top, width, height);
            }
            else if (tile.fogOfWarState == TileFogOfWarState.uncovered) {
                ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;
                ctx.fillRect(left, top, width, height);
            }

            if (tile.fogOfWarState == TileFogOfWarState.visible) {
                this._assignTileFowNeighborState(tileGrid, tile, x, y);

                if (tile._x == 1) {
                    ctx.beginPath();
                    ctx.moveTo(left, bottom);
                    ctx.lineTo(left, top);
                    ctx.lineTo(right, top);
                    ctx.closePath();
                    ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;
                    ctx.fill();
                }
                if (tile._x == 2) {
                    ctx.beginPath();
                    ctx.moveTo(left, bottom);
                    ctx.lineTo(left, top);
                    ctx.lineTo(right, bottom);
                    ctx.closePath();
                    ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;
                    ctx.fill();
                }
                if (tile._x == 3) {
                    ctx.beginPath();
                    ctx.moveTo(right, bottom);
                    ctx.lineTo(right, top);
                    ctx.lineTo(left, top);
                    ctx.closePath();
                    ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;
                    ctx.fill();
                }
                if (tile._x == 4) {
                    ctx.beginPath();
                    ctx.moveTo(right, bottom);
                    ctx.lineTo(right, top);
                    ctx.lineTo(left, bottom);
                    ctx.closePath();
                    ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;
                    ctx.fill();
                }
            }
        }
        }
    }

    deferredLoop(msAvailable) {
        //Mark tiles as either uncovered
        var grid = this.worldManager.tileGrid;
        var worldObjects = this.worldManager.worldObjectHandler.worldObjects;
        //First reset active states
        for (var x = 0; x < grid.width; x++)
        for (var y = 0; y < grid.height; y++){
            var tile = grid.getTile(x,y);
            if (tile.fogOfWarState == TileFogOfWarState.visible)
                tile.fogOfWarState = TileFogOfWarState.hidden;
        }
        //Then highlight appropriately
        for (var x = 0; x < grid.width; x++)
        for (var y = 0; y < grid.height; y++){
            var tile = grid.getTile(x,y);
            for (var o of worldObjects) {
                if (!o.active) continue;
                //Compute distance
                var dist = Math.sqrt((o.x - tile.x) ** 2 + (o.y - tile.y) ** 2);
                if (dist < 6)
                    tile.fogOfWarState = TileFogOfWarState.visible;
            }
        }
        
    }

    _assignTileFowNeighborState(grid, tile, x, y) {
        //Each tile has 8 neighbors
        var nw, n, ne, w, e, sw, s, se;
        //Get the backing array for faster lookups
        var backing = grid.grid;
        //get the neighbors
        nw = backing[x - 1]?.[y - 1];
        n = backing[x]?.[y - 1];
        ne = backing[x + 1]?.[y - 1];
        w = backing[x - 1]?.[y];
        e = backing[x + 1]?.[y];
        sw = backing[x - 1]?.[y + 1];
        s = backing[x]?.[y + 1];
        se = backing[x + 1]?.[y + 1];

        tile._x = 0;
        var state = tile.fogOfWarState;

        if (nw?.fogOfWarState < state &&
            n?.fogOfWarState < state &&
            w?.fogOfWarState < state &&
            s?.fogOfWarState >= state &&
            e?.fogOfWarState >= state &&
            se?.fogOfWarState >= state)
            tile._x = 1; //Paint diagonally covering top left

        if (sw?.fogOfWarState < state &&
            s?.fogOfWarState < state &&
            w?.fogOfWarState < state &&
            n?.fogOfWarState >= state &&
            e?.fogOfWarState >= state &&
            ne?.fogOfWarState >= state)
            tile._x = 2; //Paint diagonally covering bottom left

        if (ne?.fogOfWarState < state &&
            n?.fogOfWarState < state &&
            e?.fogOfWarState < state &&
            s?.fogOfWarState >= state &&
            w?.fogOfWarState >= state &&
            sw?.fogOfWarState >= state)
            tile._x = 3; //Paint diagonally covering top right

        if (se?.fogOfWarState < state &&
            s?.fogOfWarState < state &&
            e?.fogOfWarState < state &&
            n?.fogOfWarState >= state &&
            w?.fogOfWarState >= state &&
            nw?.fogOfWarState >= state)
            tile._x = 4; //Paint diagonally covering bottom right
    }
    

}
