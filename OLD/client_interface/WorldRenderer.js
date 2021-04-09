const Constants = require("../Constants");
const MapInfo = require("../MapInfo");
const { TileGrid, TileObject } = require("../shared/TileGrid");
const ImageCache = require("./ImageCache");
const FogOfWarRenderer = require("./renderers/FogOfWarRenderer");
const LayerRenderer = require("./renderers/LayerRenderer");
const TileRenderer = require("./renderers/TileRenderer");
const MapBaseRenderer = require("./renderers/MapBaseRenderer");
const GridlineRenderer = require("./renderers/GridlineRenderer");
const EffectRenderer = require("./renderers/EffectRenderer");

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
    _x = 0;
    _y = 0;
    _width = 0;
    _height = 0;
    //Zoom level
    _zoom = 1;
    _world;

    constructor(world) {
        this._world = world;
        this._width = Constants.screenWidthIn / this._zoom;
        this._height = Constants.screenHeightIn / this._zoom;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get width() { return this._width; }
    get height() { return this._height; }
    get zoom() { return this._zoom; }

    set x(value) { if (value < 0) value = 0; this._x = value; this._world.redrawAll(); }
    set y(value) {  if (value < 0) value = 0; this._y = value; this._world.redrawAll(); }
    set zoom(value) { 
        if (value < 0.1) value = 0.1;  if (value > 10) value = 10; 
        this._zoom = value; 
        this._width = Constants.screenWidthIn / this._zoom;
        this._height = Constants.screenHeightIn / this._zoom;
        this._world.redrawAll(); }

    get left() { return this.x; }
    get right() { return this.x + this.width; };
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
}

module.exports =
    class WorldRenderer {
        //The tile-space viewport of the game
        viewport;
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
        _tileGrid = new TileGrid(MapInfo.width, MapInfo.height);
        _lastFrame = 0;
        _imageCache;
        _imageCacheInitialized = false;
        _shuffledTileGrid = [];

        constructor() {
            //Register the tile change handler
            this._changedTiles = new Set();
            this.viewport = new Viewport(this);
            var changeList = this._changedTiles;
            this._context = this._canvas.getContext("2d");
            var handler= (tile) => this.handleTilePropertyChange(tile);
            this._tileGrid.registerChangeHandlers(handler, handler, handler, handler);

            this._imageCache = new ImageCache();
            this._imageCache.initialize(() => this._imageCacheInitialized = true);
            //Set up renderers
            this._layers = [
                new MapBaseRenderer(this._tileGrid, this, this._context),
                new TileRenderer(this._tileGrid, this, this._context),
                new EffectRenderer(this._tileGrid, this, this._context),
                new FogOfWarRenderer(this._tileGrid, this, this._context),
                new GridlineRenderer(this._tileGrid, this, this._context),
            ];

            //Generate a shuffled tile grid
            this._shuffledTileGrid = [...this._tileGrid._backingGrid];
            //Shuffle internals
            for (var i in this.__shuffledTileGrid) {
                this._shuffledTileGrid[i] = [...this._shuffledTileGrid];
                this._shuffleArray(this._shuffledTileGrid[i]);
            }

            this._shuffleArray(this._shuffledTileGrid);
        }

        get imageCache() { return this._imageCache; }

        handleTilePropertyChange(tile) {
            //Redraw the tile
            this._changedTiles.add(tile);
            //Update the redraw every frame tag
            var updateEveryFrame = false;
            for (var i in this._layers) {
                var layer = this._layers[i];
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
            var viewport_width_px = this._canvas.width;
            var viewport_height_px = this._canvas.height;

            this.tileWidthPx = Math.floor(viewport_width_px / this.viewport.width);
            this.tileHeightPx = Math.floor(viewport_height_px / this.viewport.height);
            //Call the render loop on each layer
            this._layers.forEach((layer) => layer.renderLoop(this));
            //Scan through all visible tiles to determine if they need to
            //be redrawn (e.g. animations or updates)
            for (var x = Math.floor(this.viewport.left); x < this.viewport.right + 1 && x < MapInfo.width; x++) 
                for (var y = Math.floor(this.viewport.top); y < this.viewport.bottom + 1 && y < MapInfo.height; y++) {
                    var tile = this._tileGrid.getTile(x,y);
                    for (var i in this._layers) {
                        if (this._layers[i].redrawEveryFrame(tile)) {
                            this.markTileUpdated(tile);
                            break;
                        }
                    }
                }

                //And redraw
                for (var x = 0; x < this._shuffledTileGrid.length; x++) {
                    for (var y = 0; y < this._shuffledTileGrid[x].length; y++) {
                        var tile = this._shuffledTileGrid[x][y];
                        if (this._changedTiles.has(tile)) {
                            this.redrawTile(tile);
                        }
                    }
                }


            //And clear the redraw list
            this._changedTiles.clear();
            //Then, compute our remaining time budget (or a minimum of 5 ms if we are already over budget)
            var maxTimePerFrame = 1000 / Constants.framerate;
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
            //Clear the display
            this._context.clearRect(0,0,999999,999999);
            //And trigger the renderer
            this.renderLoop();
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
            if (tile.x < Math.floor(this.viewport.x) || tile.y < Math.floor(this.viewport.y) ||
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
                var x = Math.floor(tile.x * this.tileWidthPx) - Math.floor(this.viewport.x * this.tileWidthPx);
                var y = Math.floor(tile.y * this.tileHeightPx) - Math.floor(this.viewport.y * this.tileHeightPx);
                for (var i = minLayerToRender; i < this._layers.length; i++) {
                    this._layers[i].drawTile(tile, x, y, this.tileWidthPx, this.tileHeightPx);
                }
        }
        _shuffleArray(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
          
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
          
              // Pick a remaining element...
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex -= 1;
          
              // And swap it with the current element.
              temporaryValue = array[currentIndex];
              array[currentIndex] = array[randomIndex];
              array[randomIndex] = temporaryValue;
            }
          
            return array;
          }
          
    }