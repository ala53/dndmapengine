const WorldManager = require("../../client/WorldManager");

var uiElement;
var canvasElement;
var worldManager;

function renderLoop() {
    requestAnimationFrame(renderLoop);
    worldManager.renderLoop();
}
//dont init until window is fully loaded
window.onload = () => {
    uiElement = document.getElementById("UI");
    //Set up the canvas
    canvasElement = document.getElementById("renderArea");
    canvasElement.width = document.body.clientWidth;
    canvasElement.height = document.body.clientHeight;
    canvasElement.style.position = "fixed";
    canvasElement.style.top = 0;
    canvasElement.style.left = 0;

    //Initialize the renderer
    worldManager = new WorldManager(canvasElement, uiElement);
    //Start the render loop
    requestAnimationFrame(renderLoop);
}

//Resize the canvas on window resize
window.onresize = () => {
    var canvas = document.getElementById("renderArea");
    canvas.width = document.body.clientWidth; //document.width is obsolete
    canvas.height = document.body.clientHeight;

    //Scale the ui div
    
}

