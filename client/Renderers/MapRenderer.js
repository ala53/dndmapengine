const MapInfo = require("../../map/MapInfo");
const WorldManager = require("../WorldManager");

module.exports = 
//Renders the background image for the map
class MapRenderer {
    /**
     * @type {WorldManager}
     */
    worldManager;
    constructor(manager) {
        this.worldManager = manager;
    }

    renderLoop(deltaTime) {
        var image = this.worldManager.imageCache.find(this.worldManager.map.backgroundImage);
        var imgWidth = image.width;
        var imgHeight = image.height;
        var pxPerBlockWidth = imgWidth / this.worldManager.map.width;
        var pxPerBlockHeight = imgHeight / this.worldManager.map.height;

        var left = Math.floor(pxPerBlockWidth * this.worldManager.viewport.left);
        var top = Math.floor(pxPerBlockHeight * this.worldManager.viewport.top);
        //console.log("X");
        //Really simple: just render the global map image for this tile
        this.worldManager.context.drawImage(image, 
            //Clip location
            left, top, Math.floor(pxPerBlockWidth * this.worldManager.viewport.width), Math.floor(pxPerBlockHeight * this.worldManager.viewport.height),
            //On screen location
            0,0, this.worldManager.viewport.widthPx, this.worldManager.viewport.heightPx);
    }
}