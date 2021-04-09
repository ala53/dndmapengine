const constants = require("../Constants");
const { TileGrid, TileObject } = require("../shared/TileGrid");
const ImageCache = require("./ImageCache");
const FogOfWarRenderer = require("./renderers/FogOfWarRenderer");
const LayerRenderer = require("./renderers/LayerRenderer");
const TileRenderer = require("./renderers/TileRenderer");

//This renders the map on the client side
//It works in layers
//Layer 0: map tiles
//Layer 1: effects
//Layer 2: fog of war
//Layer 3: pathfinding dots for character movement
//Layer 4: grid lines for the 5x5 grid

//We never clear the canvas, only render over old parts when
//a change has occurred or when drawing new pathfinding dots

//Pathfinding dots are kept track of on the tiles they occur
//under the "pathfinding" effect

//So we register handlers for tile changes and use those to keep
//track of what tiles to re-render

class Viewport {
    //x, y, width, and height in tile coordinates
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    //Zoom level
    zoom = 1;

    get left() { return this.x; }
    get right() { return this.x + this.width; };
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
}

module.exports =
    class WorldRenderer {
        //The tile-space viewport of the game
        viewport = new Viewport();
        //The size of a tile in pixels
        //There's separate variables for width and height
        //in the event pixels are not square (e.g. weird resolutions)
        //so that the image is still square in the real world.
        _tileWidthPx = 0;
        _tileHeightPx = 0;
        //The canvas we render to
        /**
         * @type HTMLCanvasElement
         */
        _canvas = document.getElementById("renderArea");
        _context;
        /**
         * @type Set<TileObject>
         */
        _changedTiles = new Set();
        //The layers we render
        /**
         * @type [LayerRenderer]
         */
        _layers;
        _tileGrid = new TileGrid(constants.mapSizeBlocks, constants.mapSizeBlocks);
        _lastFrame = 0;
        _imageCache;
        _imageCacheInitialized = false;

        constructor() {
            //Register the tile change handler
            this._changedTiles = new Set();
            var changeList = this._changedTiles;
            this._context = this._canvas.getContext("2d");
            this._tileGrid.registerChangeHandlers(this.handleTilePropertyChange, this.handleTilePropertyChange, 
                this.handleTilePropertyChange, this.handleTilePropertyChange);

            this._imageCache = new ImageCache();
            this._imageCache.initialize(() => this._imageCacheInitialized = true);
            //Set up renderers
            this._layers = [
                new TileRenderer(this._tileGrid, this, this._context),
                new FogOfWarRenderer(this._tileGrid, this, this._context),
            ];
        }

        get imageCache() { return this._imageCache; }

        handleTilePropertyChange(tile) {
            //Redraw the tile
            changeList.add(tile);
            //Update the redraw every frame tag
            var updateEveryFrame = false;
            for (var layer in this._layers) {
                if (layer.redrawEveryFrame(tile)) {
                    updateEveryFrame = true;
                    break;
                }
            }
            tile.redrawEveryFrame = updateEveryFrame;
        }

        get tileGrid() { return this._tileGrid; }

        renderLoop() {
            //Don't render if the cache isn't loaded yet
            if (!this._imageCacheInitialized) return;
            //Compute time delta
            if (this._lastFrame == 0) {
                this._lastFrame = performance.now() - 30; //Set last frame to 30ms ago
                this.redrawAll();
            }
            var nowTime = performance.now();
            var deltaMs = nowTime - this._lastFrame;
            this._lastFrame = nowTime;
            //Recompute viewport
            this.viewport.width = constants.screenWidthIn * this.viewport.zoom;
            this.viewport.height = constants.screenHeightIn * this.viewport.zoom;
            var viewport_width_px = this._canvas.width;
            var viewport_height_px = this._canvas.height;

            this.tileWidthPx = viewport_width_px / this.viewport.width;
            this.tileHeightPx = viewport_height_px / this.viewport.height;
            //Call the render loop on each layer
            this._layers.forEach((layer) => layer.renderLoop(this));
            //Scan through all visible tiles to determine if they need to
            //be redrawn each frame (e.g. animations)
            for (var x = this.viewport.left; x < this.viewport.right + 1; x++)
                for (var y = this.viewport.top; y < this.viewport.bottom + 1; y++) {
                    var tile = this._tileGrid.getTile(x,y);
                    if (tile.renderEveryFrame)
                        this.markTileUpdated(tile);
                }
            //And redraw all tiles which have changed
            this._changedTiles.forEach((a) => this.redrawTile(a));
            this._changedTiles.clear();

            //Then, compute our remaining time budget (or a minimum of 5 ms if we are already over budget)
            var maxTimePerFrame = 1000 / constants.framerate;
            var deferredStartTime = performance.now();
            var currentTimeSpent = deferredStartTime - nowTime;
            var remainingMs = Math.max(maxTimePerFrame - currentTimeSpent, 5);
            //And call deferred functions, giving each one half a slice of the remaining time
            this._layers.forEach((layer) => {
                //Give it a time slice
                layer.deferredWork(remainingMs / 2);
                //And decrement remaining time
                remainingMs -= performance.now() - deferredStartTime;
            });
        }

        redrawAll() {
            //Add all tiles to the dirty list
            this._tileGrid._backingGrid.forEach((array) => {array.forEach((tile) => this._changedTiles.add(tile) )});
            //this._changedTiles.add(tile);
        }

        //Marks a tile as being updated to trigger a redraw
        markTileUpdated(tile) {
            this._changedTiles.add(tile);
        }
        /**
         * 
         * @param {TileObject} tile 
         * @returns 
         */
        redrawTile(tile) {
            //console.log(tile);
            //Determine if any part of the tile is within the viewport
            if (tile.x < this.viewport.x || tile.y < this.viewport.y ||
                tile.x > this.viewport.right + 1 ||
                tile.y > this.viewport.bottom + 1)
                return;

                //First, walk backwards through layers
                //to determine whether one layer is opaque
                var minLayerToRender = this._layers.length - 1;
                for (var i = this._layers.length - 1; i >= 0; i--) {
                    minLayerToRender = i;
                    if (this._layers[i].isOpaque(tile)) {
                        break;
                    }
                }
                //console.log(`Rendered ${tile.x}, ${tile.y}`)
                //Then render from that layer up
                for (var i = minLayerToRender; i < this._layers.length; i++) {
                    this._layers[i].drawTile(tile, tile.x * this.tileWidthPx, tile.y*this.tileHeightPx, this.tileWidthPx, this.tileHeightPx);
                }
        }
    }