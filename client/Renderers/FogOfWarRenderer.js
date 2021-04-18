const { TileFogOfWarState } = require("../TileGrid");
const WorldManager = require("../WorldManager");

module.exports = class FogOfWarRenderer {
    static fogOfWarHiddenColor = "rgba(0,0,0,0.95)";
    static fogOfWarUncoveredColor = "rgba(0.5,0.5,0.5,0.6)";
    /**
     * 
     * @type {WorldManager}
     */
    worldManager;
    constructor(manager) {
        this.worldManager = manager;

        //Check if the map is in daylight
        if (this.worldManager.map.daylight) {
            FogOfWarRenderer.fogOfWarHiddenColor = "rgba(0,0,0,0.15)";
            FogOfWarRenderer.fogOfWarUncoveredColor = "rgba(0.5,0.5,0.5.0.1)";
        }
    }

    renderLoop(deltaTime) {
        this.deferredLoop();
        var ctx = this.worldManager.context;
        var viewport = this.worldManager.viewport;
        var tileGrid = this.worldManager.tileGrid;
        //Iterate through the grid
        for (var x = Math.floor(viewport.left); x < viewport.right; x++) {
            if (x >= this.worldManager.map.width) break;

            for (var y = Math.floor(viewport.top); y < viewport.bottom; y++) {
                if (y >= this.worldManager.map.height) break;

                var tile = tileGrid.getTile(x, y);
                var vx = x - viewport.left;
                var vy = y - viewport.top;

                var left = Math.floor(Math.max(0, vx * viewport.tileWidthPx));
                var top = Math.floor(Math.max(0, vy * viewport.tileHeightPx));
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



                //Check if the tile is at least uncovered and bordering other tiles
                if (tile._neighborFowState > 0 && tile.fogOfWarState > 0) {
                    if (tile.fogOfWarState == TileFogOfWarState.uncovered)
                        ctx.fillStyle = FogOfWarRenderer.fogOfWarHiddenColor;
                    else
                        ctx.fillStyle = FogOfWarRenderer.fogOfWarUncoveredColor;

                    ctx.beginPath();
                    switch (tile._neighborFowState) {
                        case 1:
                            ctx.moveTo(left, bottom);
                            ctx.lineTo(left, top);
                            ctx.lineTo(right, top);
                            break;
                        case 2:
                            ctx.moveTo(left, bottom);
                            ctx.lineTo(left, top);
                            ctx.lineTo(right, bottom);
                            break;
                        case 3:
                            ctx.moveTo(right, bottom);
                            ctx.lineTo(right, top);
                            ctx.lineTo(left, top);
                            break;
                        case 4:
                            ctx.moveTo(right, bottom);
                            ctx.lineTo(right, top);
                            ctx.lineTo(left, bottom);
                            break;
                        default:
                            throw "Invalid fog of war neighbor state";
                    }
                    ctx.closePath();
                    ctx.fill();
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
            for (var y = 0; y < grid.height; y++) {
                var tile = grid.getTile(x, y);
                if (tile.fogOfWarState == TileFogOfWarState.visible)
                    tile.fogOfWarState = TileFogOfWarState.uncovered;
            }
        //Then highlight appropriately
        for (var x = 0; x < grid.width; x++)
            for (var y = 0; y < grid.height; y++) {
                var tile = grid.getTile(x, y);
                for (var o of worldObjects) {
                    if (!o.active || !o.affectsFogOfWar) continue;
                    //Compute distance
                    var dist = Math.sqrt((o.x - tile.x) ** 2 + (o.y - tile.y) ** 2);
                    if (dist - 1 < o.fogOfWarDistance)
                        tile.fogOfWarState = TileFogOfWarState.visible;
                }
            }

        //And compute neighbor states
        for (var x = 0; x < grid.width; x++)
            for (var y = 0; y < grid.height; y++) {
                var tile = grid.getTile(x, y);
                this._assignTileFowNeighborState(grid, tile, x, y);
            }

    }

    //Starting from point X, this sets all tiles within distance X to fogOfWarState {targetState}
    traceTileFogOfWarFromPoint(dx, dy, maxDist, targetState) {
        var grid = this.worldManager.tileGrid;
        for (var x = 0; x < grid.width; x++)
            for (var y = 0; y < grid.height; y++) {
                var tile = grid.getTile(x, y);
                //Compute distance
                var dist = Math.sqrt((dx - tile.x) ** 2 + (dy - tile.y) ** 2);
                if (dist - 1 < maxDist)
                    tile.fogOfWarState = targetState;
            }
    }

    //Given a tile, this looks at all neighboring tiles to determine
    //if this tile should be partially shaded
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

        tile._neighborFowState = 0;
        var state = tile.fogOfWarState;

        if (nw?.fogOfWarState < state &&
            n?.fogOfWarState < state &&
            w?.fogOfWarState < state &&
            s?.fogOfWarState >= state &&
            e?.fogOfWarState >= state &&
            se?.fogOfWarState >= state)
            tile._neighborFowState = 1; //Paint diagonally covering top left

        if (sw?.fogOfWarState < state &&
            s?.fogOfWarState < state &&
            w?.fogOfWarState < state &&
            n?.fogOfWarState >= state &&
            e?.fogOfWarState >= state &&
            ne?.fogOfWarState >= state)
            tile._neighborFowState = 2; //Paint diagonally covering bottom left

        if (ne?.fogOfWarState < state &&
            n?.fogOfWarState < state &&
            e?.fogOfWarState < state &&
            s?.fogOfWarState >= state &&
            w?.fogOfWarState >= state &&
            sw?.fogOfWarState >= state)
            tile._neighborFowState = 3; //Paint diagonally covering top right

        if (se?.fogOfWarState < state &&
            s?.fogOfWarState < state &&
            e?.fogOfWarState < state &&
            n?.fogOfWarState >= state &&
            w?.fogOfWarState >= state &&
            nw?.fogOfWarState >= state)
            tile._neighborFowState = 4; //Paint diagonally covering bottom right
    }

    //Determines if a point lies within a triangle of 3 dimensions
    _determineIfPointInTriangle(point, t1, t2, t3) {

    }

}
