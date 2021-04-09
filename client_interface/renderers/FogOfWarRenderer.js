//This module handles fog of war
//It has two functions: renderLoop(), which triggers whenever 
//a frame is rendered, and updateFogOfWar(), which triggers
//whenever fog of war needs to be changed

var LayerRenderer = require("./LayerRenderer");
const {TileGrid} = require("../../shared/TileGrid");

module.exports = class FogOfWarRenderer extends LayerRenderer {
    _isUpdating = false;
    _currentX = 0;
    _currentY = 0;
    renderLoop(deltaTime) {
    }

    drawTile(tile, x, y, width, height) {
    
    }

    deferredWork(timeBudget) {
        if (!this._isUpdating) return;
        for (this._currentX; this._currentX < this._tileGrid.width; this._currentX++) {
            for (this._currentY; this._currentY < this._tileGrid.height; this._currentY++) {

            }
            //If we are out of time, continue tracing later
            if (timeBudget() < 0) return;
        }

        this.copyTempFogOfWarTags();
        this._isUpdating = false;
    }

    updateFogOfWar() {
        this._isUpdating = true;
        this._currentX = 0;
        this._currentY = 0;
        //Reset internal tags
        this.resetFogOfWarTags();
        //And defer to do a bit of work each frame
    }

    resetFogOfWarTags() {
        var backingGrid = this._tileGrid._backingGrid;
        for (var x = 0; x < backingGrid.length; x++) {
            for (var y = 0; y < backingGrid.height; y++) {
                //Set a temporary class value to mark it as hidden
                //We don't update visible FoW until the end
                backingGrid[x][y].__FOWACTIVESTATE = 0;
            }
        }
    }

    copyTempFogOfWarTags() {
        var backingGrid = this._tileGrid._backingGrid;
        for (var x = 0; x < backingGrid.length; x++) {
            for (var y = 0; y < backingGrid.height; y++) {
                //Set a temporary class value to mark it as hidden
                //We don't update visible FoW until the end
                var tile = backingGrid[x][y]
                tile.fowState = tile.__FOWACTIVESTATE;
                //keep another hidden variable to mark if the tile was ever uncovered
                if (tile.fowState > 0)
                tile.__FOWHASBEENUNCOVERED = true;
            }
        }
    }

    tracePlayerFogOfWar() {

    }
}
