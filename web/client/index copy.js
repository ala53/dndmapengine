const TouchPointRenderer = require("../../client/Renderers/TouchPointRenderer");
const TouchTracker = require("../../client/TouchTracker");
const Constants = require("../../constants");

var uiElement;
var tt = new TouchTracker();
/**
 * @type {CanvasRenderingContext2D}
 */
var ctx;
var canvas;
var lastFrame = Date.now();
var oneInchWide = 1;
var oneInchHigh = 1;
var tr = new TouchPointRenderer();

function renderLoop() {
    var delta = Date.now() - lastFrame;
    lastFrame = Date.now();
    requestAnimationFrame(renderLoop);
    ctx.clearRect(0, 0, 99999, 99999);

    tt.renderLoop();
    tr.renderLoop(delta);
}
//dont init until window is fully loaded
window.onload = () => {
    uiElement = document.getElementById("UI");
    //Set up the canvas
    canvas = document.getElementById("renderArea");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;

    //TESTING
    tt.register(canvas);
    ctx = canvas.getContext("2d");
    tr.canvas = canvas;
    tr.ctx = ctx;
    tr.touchTracker = tt;
    //Start the render loop
    requestAnimationFrame(renderLoop);
}

window.onresize = () => {
    var canvas = document.getElementById("renderArea");
    canvas.width = document.body.clientWidth; //document.width is obsolete
    canvas.height = document.body.clientHeight;
    //TESTING
    oneInchWide = canvas.width / Constants.screenWidthIn;
    oneInchHigh = canvas.height / Constants.screenHeightIn;
}

