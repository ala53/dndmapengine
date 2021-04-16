module.exports = class UIRenderer {
    //Whether the UI on the right of the screen is currently opened
    uiTabOpen = false;
    static uiWidthPercent = 0.2;

    _open = false;
    /**
     * @type {HTMLDivElement}
     */
    element;

    get open() {
        return this._open;
    }

    set open(value) {
        if (value == this._open) return;
        this._open = value;

        if (this.open) {
            
        }
    }

    constructor(element) {
        this._element = element;
    }

    renderLoop(deltaTime) {

    }
}