const fs = require("fs");
const path = require("path");
const Constants = require("../Constants");

class LoadedImage {
    element;
    completedLoad = false;
    name;
    path;

    constructor(elem, name, path) {
        this.name = name;
        this.path = path;
        this.element = elem;
    }
}

module.exports = 
//Caches images for use in the rendering engine and allows for 
//by-name lookups
class ImageCache {
    _images = [];
    _imagesKeyed = {};
    constructor() {

    }
    initialize(loadedCallback) {
        //Query all files in the web_content/images folder and load them
        fs.readdir(Constants.imageBaseDir, (err, files) => {
            if (err) throw err;
            files.forEach(fPath => {
                fPath = path.resolve(path.join(Constants.imageBaseDir, fPath));
                //load the image
                // Create an image object. This is not attached to the DOM and is not part of the page.
                var image = new Image();
                var cached = new LoadedImage(image, path.basename(fPath), fPath);
                this._imagesKeyed[cached.name] = cached;
                this._images.push(cached);

                // When the image has loaded, draw it to the canvas
                image.onload = () => {
                    cached.completedLoad = true;
                    if (this._areAllLoaded()) {
                        loadedCallback();
                    }
                }
                image.onerror = () => {
                    throw "Failed to load image " + fPath;
                }
            
                // Now set the source of the image that we want to load
                image.src = fPath;
            });
        });
    }

    find(name) { return this._imagesKeyed[name].element; }

    _areAllLoaded() {
        for (var i in this._images) {
            if (!this._images[i].completedLoad) return false;
        }
        return true;
    }
}