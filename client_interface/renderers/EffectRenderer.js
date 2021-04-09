const FireEffect = require("./effects/FireEffect");
var LayerRenderer = require("./LayerRenderer");
const { TileGrid, TileObject } = require("../../shared/TileGrid");
const SpriteSheetImageEffectRenderer = require("./effects/SpriteSheetImageEffectRenderer");
const EffectTypeRenderer = require("./effects/EffectTypeRenderer");

class EffectType {
    /**
     * @type String
     */
    name;
    /**
     * @type EffectTypeRenderer 
     * */
    renderer;
    constructor(name, renderer) {
        this.name = name;
        this.renderer = renderer;
    }
}

module.exports = class EffectRenderer extends LayerRenderer {
    _effects = [];
    _effectsKeyed;

    constructor(tileGrid, worldRenderer, canvasContext) {
        super(tileGrid, worldRenderer, canvasContext);
        _effects = [
            new EffectType("fire", new SpriteSheetImageEffectRenderer(tileGrid, worldRenderer, canvasContext, "/images/effects/fire.png", 4, 4, 4)),
        ];
        //Build the keyed lookup table
        this._buildKeyTable();

    }

    renderLoop(deltaTime) {
        this._effects.forEach((e) => e.renderLoop(deltaTime));
    }

    drawTile(tile, x, y, width, height) {
        //Determine which layers to draw by walking backwards through the array
        //First, walk backwards through layers
        //to determine whether one layer is opaque
        var minLayerToRender = this._effects.length - 1;
        for (var i = this._effects.length - 1; i >= 0; i--) {
            minLayerToRender = i;
            var effect = this._effects[i];
            //Stop walking back if the effect is active and opaque
            if (effect.renderer.isRendered(tile.getEffect(effect.name), tile) && effect.renderer.isOpaque(tile)) {
                break;
            }
        }
        //Then render from that layer up
        for (var i = minLayerToRender; i < this._effects.length; i++) {
            var effect = this._effects[i];
            if (effect.renderer.isRendered(tile.getEffect(effect.name), tile))
                this._layers[i].drawTile(tile, x, y, width, height);
        }
    }


    registerEffect(effect, renderer) {
        this._effects.push(new EffectType(effect, renderer));
        this._buildKeyTable();
    }

    _buildKeyTable() {
        this._effectsKeyed = {};
        for (var i in this._effects) {
            var effect= this._effects[i];
            this._effectsKeyed[effect.name] = effect.renderer;
        }
    }

    /**
     * 
     * @param {TileObject} tile 
     */
    isOpaque(tile) {
        var opaque = false;
        for (var i in this._effects) {
            var effect= this._effects[i];
            if (!effect.isRendered(tile.getEffect(effect.name), tile))
                continue;
            if (effect.isOpaque(tile)) {
                opaque = true;
                break;
            }
        }

        return opaque;
    }
}
