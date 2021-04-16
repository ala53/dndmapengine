const Constants = require("../Constants");
const MapInfo = require("../map/MapInfo");
const GridlineRenderer = require("./Renderers/GridlineRenderer");
const ImageCache = require("./ImageCache");
const MapRenderer = require("./Renderers/MapRenderer");
const TouchPointRenderer = require("./Renderers/TouchPointRenderer");
const TouchTracker = require("./TouchTracker");
const UIRenderer = require("./UIRenderer");
const { TileGrid, Tile, WorldObject, TileFogOfWarState } = require("./TileGrid");
const FogOfWarRenderer = require("./Renderers/FogOfWarRenderer");
const WorldObjectHandler = require("./WorldObjectHandler");

class WorldViewport {
    tileWidthPx = 1;
    tileHeightPx = 1;
    _left = 0;
    _top = 0;
    width = 1;
    height = 1;
    _zoom = 1;


    get zoom() { return this._zoom; }
    set zoom(value) { if (value < 0.10) value = 0.10; if (value > 10) value = 10; this._zoom = value; }

    get left() { return this._left; }
    set left(value) { if (value < 0) value = 0; this._left = value; }

    get right() { return this.left + this.width; }
    set right(value) { this.left = value - this.width; }

    get top() { return this._top; }
    set top(value) { if (value < 0) value = 0; this._top = value; }

    get bottom() { return this.top + this.height; }
    set bottom(value) { this.top = value - this.height; }

    get leftPx() { return this.left * this.tileWidthPx; }
    get rightPx() { return this.right * this.tileWidthPx; }
    get topPx() { return this.bottom * this.tileHeightPx; }
    get bottomPx() { return this.bottom * this.tileHeightPx; }

    get widthPx() { return this.width * this.tileWidthPx; }
    get heightPx() { return this.height * this.tileHeightPx; }
}

module.exports = class WorldManager {
    touchTracker;
    /**
     * @type {HTMLCanvasElement}
     */
    canvas;
    /**
     * @type {CanvasRenderingContext2D}
     */
    context;


    /**
     * @type {HTMLDivElement}
     */
    uiElement;
    uiRenderer;

    tileGrid;
    map = MapInfo.maps[2];
    worldObjectHandler;

    imageCache;
    viewport = new WorldViewport();
    renderers = [];
    fogOfWarRenderer;
    /**
     * 
     * @param {HTMLCanvasElement} canvasElement 
     */
    constructor(canvasElement, uiElement) {
        this.touchTracker = new TouchTracker();
        this.imageCache = new ImageCache();
        this.canvas = canvasElement;
        this.context = canvasElement.getContext("2d");
        this.uiElement = uiElement;
        this.uiRenderer = new UIRenderer(uiElement);
        this.tileGrid = new TileGrid(this.map.width, this.map.height);
        this.worldObjectHandler = new WorldObjectHandler(this);
        //Initialize
        this.touchTracker.register(canvasElement);
        this.imageCache.initialize();
        this.worldObjectHandler.register();
        //Set up renderers, ordered

        this.renderers.push(new MapRenderer(this));
        this.fogOfWarRenderer = new FogOfWarRenderer(this);
        this.renderers.push(this.fogOfWarRenderer);
        this.renderers.push(new GridlineRenderer(this));
        this.renderers.push(new TouchPointRenderer(this));

        //Appropriately size the viewport
        this._recomputeViewport();
        //Center the viewport to the map target area
        this.viewport.left = this.map.start.x - (this.viewport.width / 2);
        this.viewport.top = this.map.start.y - (this.viewport.height / 2);
        //Clamp
        this.viewport.left = Math.max(0, this.viewport.left);
        this.viewport.top = Math.max(0, this.viewport.top);
        if (this.viewport.right > this.map.width)
            this.viewport.right = this.map.width;
        if (this.viewport.bottom > this.map.height)
            this.viewport.bottom = this.map.height;

        //Uncover the fog of war on the starting tile
        this.fogOfWarRenderer.traceTileFogOfWarFromPoint(this.map.start.x, this.map.start.y, 5.3, TileFogOfWarState.uncovered);
    }

    _lastRenderTime = 0;
    renderLoop() {
        //Compute delta time
        if (this._lastRenderTime == 0)
            this._lastRenderTime = Date.now() - 30; //30 ms ago

        var deltaTime = Date.now() - this._lastRenderTime;
        this._recomputeViewport();

        //Don't render until the image cache is loaded
        if (!this.imageCache.loadingComplete)
            return;

        //Call frame loops
        this.touchTracker.renderLoop(deltaTime);
        this.uiRenderer.renderLoop(deltaTime);
        //Clear the screen
        this.context.clearRect(0, 0, 9999, 9999);
        //Run each renderer
        for (var i = 0; i < this.renderers.length; i++) {
            this.context.save(); //Save canvas context state
            if (this.renderers[i].renderLoop)
                this.renderers[i].renderLoop(deltaTime);
            this.context.restore(); // And pop the default state
        }
    }

    //Called to handle window resizes
    handleResize(width, height) {

    }

    _recomputeViewport() {
        var canvasWidth = this.canvas.width;
        var screenWidthForCanvas = Constants.screenWidthIn;
        if (this.uiRenderer.uiTabOpen) {
            canvasWidth *= (1 - UIRenderer.uiWidthPercent);
            screenWidthForCanvas *= (1 - UIRenderer.uiWidthPercent);
        }
        //Recompute the viewport
        //At default zoom, equal to 1 inch width
        this.viewport.tileWidthPx = (canvasWidth / screenWidthForCanvas) * this.viewport.zoom;
        this.viewport.tileHeightPx = (this.canvas.height / Constants.screenHeightIn) * this.viewport.zoom;
        this.viewport.width = canvasWidth / this.viewport.tileWidthPx;
        this.viewport.height = this.canvas.height / this.viewport.tileHeightPx;
    }
}