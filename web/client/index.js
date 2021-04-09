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

function renderLoop() {
    var delta = Date.now() - lastFrame;
    lastFrame = Date.now();
    requestAnimationFrame(renderLoop);
    ctx.clearRect(0, 0, 99999, 99999);

    tt.renderLoop();

    if (tt._state == "normal")
        for (var obj of tt._activeTouches) {
            if (!obj._touchObjectTracked) {
                ctx.beginPath();

                var percent = (Date.now() - obj.startTime) / TouchTracker.msToWaitBeforeStartTracking;
                ctx.strokeStyle = "green";
                ctx.lineWidth = oneInchWide / 10;
                ctx.arc(obj.x, obj.y, oneInchWide / 2, 0, 2 * Math.PI * percent);
                ctx.stroke();
            }
        }

    for (var obj of tt._activeTrackingList) {
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.arc(obj.x, obj.y, oneInchWide / 2, 0, 2 * Math.PI);
        ctx.fill();


        if (obj.speculative) {

            //Compute the speculative line angle, so we can draw our circle from the correct
            //origin
            var opp = (obj.speculativeY - obj.y);
            var adj = (obj.speculativeX - obj.x);
            var startAngle =
                Math.atan(opp / adj);
            if (adj > 0) startAngle += Math.PI;

            //Then compute how far short to draw the line, so it lines up with the edge of the arc
            var shortX = 0;
            var shortY = 0;
            var hyp = oneInchWide / 2;
            shortX = Math.cos(startAngle) * hyp;
            shortY = Math.sin(startAngle) * hyp;

            ctx.beginPath();
            ctx.moveTo(obj.x - shortX, obj.y - shortY);
            ctx.lineTo(obj.speculativeX + shortX, obj.speculativeY + shortY);
            ctx.strokeStyle = "rgba(255,0,0,0.25)";
            ctx.lineWidth = oneInchWide / 10;
            ctx.stroke();
            var percent = (Date.now() - obj.lastSpeculativeMoveTime) / TouchTracker.msToWaitOnObjectMovedOrReplaced;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255,0,0,0.5)";
            ctx.arc(obj.speculativeX, obj.speculativeY, oneInchWide / 2, startAngle, startAngle + Math.PI * 2 * percent);
            ctx.stroke();
        }
    }
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
    oneInchWide = canvas.width / Constants.screenWidthIn;
    oneInchHigh = canvas.height / Constants.screenHeightIn;
    tt.register(canvas);
    ctx = canvas.getContext("2d");
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

