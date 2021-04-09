const MapInfo = require("../../../MapInfo");
const SpriteSheetImageEffectRenderer = require("./SpriteSheetImageEffectRenderer");

module.exports = 
class FireEffectRenderer extends SpriteSheetImageEffectRenderer {
    drawTile(tile, x, y, width, height) {
        //Specific to fire rendering* make the image taller
        y -= height * 0.3;
        height += height * 0.3;
        //If the left neighbor is fire, draw over it
        if (tile.x > 0 && this._worldRenderer.tileGrid.getTile(tile.x - 1, tile.y).getEffect("fire")) {
            if (!tile.__FIREOVERDRAW) {
                tile.__FIREOVERDRAW = Math.random()*0.2 + 1;
            }
            var diff =width * 0.5 * tile.__FIREOVERDRAW;
            x -= diff;
            width += diff;
        }

        //if the right neighbor is also fire: 
        if (tile.x < MapInfo.width - 1 && this._worldRenderer.tileGrid.getTile(tile.x + 1, tile.y).getEffect("fire")) {
            if (!tile.__FIREOVERDRAW) {
                tile.__FIREOVERDRAW = Math.random()*0.2 + 1;
            }
            var diff =width * 0.5 * tile.__FIREOVERDRAW;
            width += diff;
        }
        super.drawTile(tile, x, y, width, height);
    }
}