const EffectTypeRenderer = require("./EffectTypeRenderer");


module.exports = 
//Renders a sprite sheet as an animation
class SpriteSheetImageEffectRenderer extends EffectTypeRenderer {
    _spriteFile;
    _rows;
    _columns;
    _currentIndex = 0;
    _fps = 0;
    _msPerFrame = 0;
    _totalFrames = 0;
    /**
     * 
     * @param {Number} timeDelta 
     */
    renderLoop(timeDelta) {

    }
    drawTile(tile, x, y, width, height) {
        //Set compositing mode
        //this._canvasContext.globalCompositeOperation = "lighten";

        var timeLoopStart = tile.__timeStartedLoop;
        if (!tile.__timeStartedLoop) {
            timeLoopStart = Date.now() - (Math.random() * this._totalFrames * this._msPerFrame);;
            tile.__timeStartedLoop = timeLoopStart;
        }

        //Compute current frame number
        var frameNumber = Math.floor(Date.now() - timeLoopStart) / this._msPerFrame;
        //loop
        if (frameNumber >= this._totalFrames) {
            tile.__timeStartedLoop = Date.now();
            frameNumber = 0;
        }

        var r = Math.floor(frameNumber / this._rows);
        var c = Math.floor(frameNumber % this._rows);

        var img = this._worldRenderer.imageCache.find(this._spriteFile);
        var pxPerFrameW = img.width / this._rows;
        var pxPerFrameH = img.height / this._columns;

        this._canvasContext.drawImage(img, 
            pxPerFrameW * r, pxPerFrameH * c, pxPerFrameW, pxPerFrameW, 
            x, y, width, height);
    }

    constructor(tileGrid, worldRenderer, context, spriteFile, rows, columns, fps = 4) {
        super(tileGrid, worldRenderer, context);
        this._rows = rows;
        this._columns = columns;
        this._spriteFile = spriteFile;
        this._fps = fps;
        this._msPerFrame = 1000 / fps;
        this._totalFrames = this._rows*this._columns;
    }

    isRenderedEveryFrame(tile, state) {
        return state;
    }
}