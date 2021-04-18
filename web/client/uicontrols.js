var _reloadTimeClicked = 0;
var _closeTimeClicked = 0;

function uiReloadBtnClickStart() {
    _reloadTimeClicked = Date.now();
}

function uiReloadBtnClickEnd() {
    if (Date.now() - _reloadTimeClicked > 1000)
        location.reload();
}
function uiCloseBtnClickStart() {
    _closeTimeClicked = Date.now();
}

function uiCloseBtnClickEnd() {
    if (Date.now() - _closeTimeClicked > 2000)
        window.close();
}

function uiZoomToFit() {
    var zoomX = this.worldManager.viewport.width / this.worldManager.map.width;
    var zoomY = this.worldManager.viewport.height / this.worldManager.map.height;
    this.worldManager.viewport.left = 0;
    this.worldManager.viewport.top = 0;
    this.worldManager.viewport.zoom = Math.min(zoomX, zoomY);
    //this.worldManager.fogOfWarRenderer.traceTileFogOfWarFromPoint(0,0, 5, 1);
}