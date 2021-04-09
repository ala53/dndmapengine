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
    //Milliseconds taken to fade an uncovered tile
    _timeToFadeUncovered = 20000;
    //Milliseconds for the first portion of the fade process
    _rapidFadeTime = 1000;
    renderLoop(deltaTime) {
    }

    drawTile(tile, x, y, width, height) {
        var color = null;
        if (tile.fowState == 0)
            color = "black";
        else if (tile.fowState == 1){
            var alpha = 0.6;
            if (tile.FOWLASTUNCOVERED > 0) {
                //compute when the tile was last uncovered and lerp the 
                //alpha between 0.3 and 0.8
                var diffMs = Date.now() - tile.FOWLASTUNCOVERED;
                //Rapidly fade the first third
                //60s to lerp
                var percentageLong = Math.min(Math.max(diffMs / this._timeToFadeUncovered, 0), 1);
                var percentageShort = Math.min(Math.max(diffMs / this._rapidFadeTime, 0), 1);
                alpha = this._lerp(0, 0.3, percentageShort) + (0.5 * percentageLong);
            }
            color = `rgba(0.5,0.5,0.5,${alpha})`;
        }
        else if (tile.fowState == 2) 
            return; //Uncovered, no fog of war
        
        this._canvasContext.fillStyle = color;
        this._canvasContext.fillRect(x,y,width, height);
        this._canvasContext.fillStyle = null;
    }
    
    _lerp(v0, v1, t) {
        return v0*(1-t)+v1*t
    }
    

    isOpaque(tile) {
        //if (tile.fowState == 0) return true;
        return false;
    }

    redrawEveryFrame(tile) {
        //For performance, bail early
        if (tile.fowState == 0 || tile.fowState == 2)
        return false;

        if (tile.FOWLASTUNCOVERED > 0) {
            //compute when the tile was last uncovered and lerp the 
            //alpha between 0.3 and 0.7
            var diffMs = Date.now() - tile.FOWLASTUNCOVERED;
            //60s to lerp
            var percentage = Math.min(Math.max(diffMs / this._timeToFadeUncovered, 0), 1);
            if (percentage >= 1) return false;
        }

        return true;

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
