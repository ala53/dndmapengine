const { WorldObject } = require("./TileGrid");
const WorldManager = require("./WorldManager");

module.exports = class WorldObjectHandler {
    /**
     * @type {WorldManager}
     */
    worldManager;

    worldObjects = [];
    worldObjectsKeyed = {};
    constructor(manager) {
        this.worldManager = manager;
    }

    //Register callbacks to allow the object handler to create objects in the tile space
    register() {
        var manager = this.worldManager;
        var worldObjects = this.worldObjects;
        var worldObjectsKeyed = this.worldObjectsKeyed;
        this.worldManager.touchTracker.onObjectCreated = function(obj) {
            var object = new WorldObject();
            //Compute in grid space
            object.x = Math.floor(obj.x / manager.viewport.tileWidthPx);
            object.y = Math.floor(obj.y / manager.viewport.tileHeightPx);
            //Link back to the tracked object
            object.linkedObject = obj;
            object.active = true;
            object.affectsFogOfWar = true;

            worldObjects.push(object);
            worldObjectsKeyed[obj.id] = object;
        }

        this.worldManager.touchTracker.onObjectDeleted = function(obj) {
            var object = worldObjectsKeyed[obj.id];
            if (!object) return; //No linked object
            //Destroy it
            object.linkedObject = null;
            //Just to be safe
            object.active = false;
            object.affectsFogOfWar = false;
            //Delete from container
            worldObjects.splice(worldObjects.indexOf(object), 1);
            worldObjectsKeyed[obj.id]= undefined;
        }

        this.worldManager.touchTracker.onObjectMove = function(obj) {
            var object = worldObjectsKeyed[obj.id];
            if (!object) return; //No linked object
            //Compute position in grid space
            object.x = Math.floor(obj.x / manager.viewport.tileWidthPx);
            object.y = Math.floor(obj.y / manager.viewport.tileHeightPx);
        }
    }

}