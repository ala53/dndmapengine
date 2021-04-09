const WorldRenderer = require("../WorldRenderer");

var world;

var elem;
function renderLoop() {
    var n1 = Date.now();
    world.renderLoop();
    requestAnimationFrame(renderLoop);
    var n2 = Date.now();
    elem.innerText = "Time: " + (n2 - n1) + "ms";
}
//dont init until loaded
window.onload = () => {
    elem = document.getElementById("UI");
    //Set up the canvas
    var canvas = document.getElementById("renderArea");
    canvas.width = document.body.clientWidth; 
    canvas.height = document.body.clientHeight; 
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    //Init the renderer
    var w = new WorldRenderer();
    world = w;
    //And start the render loop
    requestAnimationFrame(renderLoop);
}

window.onresize = () => {
    var canvas = document.getElementById("renderArea");
    canvas.width = document.body.clientWidth; //document.width is obsolete
    canvas.height = document.body.clientHeight; 
    world.redrawAll();
}

