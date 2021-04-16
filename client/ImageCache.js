const fs = require("fs");
const path = require("path");
class LoadedImage {
    element;
    name;
    path;

    _isLoaded = false;
    _isInitialized = false;

    constructor(name, path) {
        this.name = name;
        this.path = path;
    }

    load() {
        if (this._isInitialized) return;
        this._isInitialized = true;
        // Create an image object. This is not attached to the DOM and is not part of the page.
        var image = new Image();
        var cached = this;
        // When the image has loaded, draw it to the canvas
        image.onload = () => {
            cached._isLoaded = true;
        }
        image.onerror = () => {
            throw "Failed to load image " + fPath;
        }
    
        // Now set the source of the image that we want to load
        image.src = cached.path;

        this.element = image;
    }

    get isLoaded() { return this._isLoaded; }
}

module.exports = 
//Caches images for use in the rendering engine and allows for 
//by-name lookups
class ImageCache {
    _images = [];
    _imagesKeyed = {};
    _initialized = false;
    constructor() {

    }
    initialize() {
        var dir = "./map/images";
        //Query all files in the web_content/images folder and load them
        fs.readdir(dir, (err, files) => {
            if (err) throw err;
            files.forEach(fPath => {
                fPath = path.resolve(path.join(dir, fPath));
                //Create the image cache object
                var cached = new LoadedImage(path.basename(fPath), fPath);
                this._imagesKeyed[cached.name] = cached;
                this._images.push(cached);

            });
            this._initialized = true;
        });
    }

    find(name) { return this._imagesKeyed[name]; }

    get initialized() {
        return this._initialized;
    }
}