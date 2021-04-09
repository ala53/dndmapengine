const EffectTypeRenderer = require("./EffectTypeRenderer");

module.exports = class ColorEffectRenderer extends EffectTypeRenderer {
    //the color to render
    _color = "transparent";
    _r =0; _g = 0; _b = 0; _a = 0;
    get color() {
        return {r: this._r, g: this._g, b: this._b, a: this._a};

    }

    constructor(color, tileGrid, worldRenderer, context) {
        this.color = color;
        super(tileGrid, worldRenderer, context);
    }

    set color(color) {
        this._r = color.r;
        this._g = color.g;
        this._b = color.b;
        this._a = color.a;
        this._color = `rgba(${this._r},${this._g},${this._b},${this._a})`;
    }

    renderLoop(timeDelta) {

    }
    drawTile(tile, x, y, width, height) {
        this._canvasContext.globalAlpha = _a;
        this._canvasContext.fillStyle = _color;
        this._canvasContext.fillRect(x, y, width, height);
        this._canvasContext.fillStyle = null;
        this._canvasContext.globalAlpha = 1;
    }

    isOpaque(tile) {
        return this._a == 1;
    }
}