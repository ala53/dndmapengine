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
            //Handle maps that are partial tiles wide
            var mapWidth = this.worldManager.map._actualWidth || this.worldManager.map.width;
            var mapHeight = this.worldManager.map._actualHeight || this.worldManager.map.height;

            var imageObj = this.worldManager.imageCache.find(this.worldManager.map.backgroundImage);

            //Check if the image is loaded
            if (!imageObj.isLoaded) {
                imageObj.load();
                return;
            }

            var image = imageObj.element;

            //Compute image dimensions in blocks
            var imgWidth = image.width;
            var imgHeight = image.height;
            var pxPerBlockWidth = imgWidth / mapWidth;
            var pxPerBlockHeight = imgHeight / mapHeight;

            //Compute the source rectangle in the image
            var left = Math.floor(pxPerBlockWidth * this.worldManager.viewport.left);
            var top = Math.floor(pxPerBlockHeight * this.worldManager.viewport.top);
            var srcWidth = 
                Math.min(this.worldManager.viewport.width, this.worldManager.map.width - this.worldManager.viewport.left);
            var srcHeight = 
                Math.min(this.worldManager.viewport.height, this.worldManager.map.height - this.worldManager.viewport.top);
            //Really simple: just render the global map image for this tile
            this.worldManager.context.drawImage(image,
                //Clip location
                left, top, Math.floor(srcWidth * pxPerBlockWidth), Math.floor(srcHeight * pxPerBlockHeight),
                //On screen location
                0, 0, Math.floor(srcWidth * this.worldManager.viewport.tileWidthPx), Math.floor(srcHeight * this.worldManager.viewport.tileHeightPx));
        }
    }