const Constants = require("../../Constants");
const TouchTracker = require("../TouchTracker");
const WorldManager = require("../WorldManager");

module.exports =
    class TouchPointRenderer {

        /**
         * @type {WorldManager}
         */
        worldManager;

        static speculativeColor = "rgba(160, 160, 160, 0.7)";
        static touchPointColor = "rgba(0,120,0, 0.8)";
        static missingPointColor = "red";
        static ignoredPointColor = "rgba(100,100,100,0.2)";


        constructor(manager) {
            this.worldManager = manager;
        }

        /**
         * 
         * @param {Number} deltaTime 
         */

        renderLoop(deltaTime) {
            //We bypass the zoom calculation, as we do not render this in world space
            var oneInchWide = (this.worldManager.canvas.width / Constants.screenWidthIn);
            var touchTracker = this.worldManager.touchTracker;
            var ctx = this.worldManager.context;
            var lineWidth = oneInchWide / 10;
            //First, we render all touches that are 
            //still pending / have not been there long enough
            //to be linked to a tracked object
            if (touchTracker._state == "normal") {
                for (var untrackedTouch of touchTracker._activeTouches) {
                    var arcRadius = untrackedTouch.radiusLong * 1.5;
                    if (arcRadius < oneInchWide / 3) 
                        arcRadius = oneInchWide / 3;
                    //Make sure we're not tracking anything
                    if (!untrackedTouch._touchObjectTracked && !untrackedTouch.ignorePoint) {

                        ctx.beginPath();

                        var percentRealized = (Date.now() - untrackedTouch.startTime) / TouchTracker.msToWaitBeforeStartTracking;
                        ctx.strokeStyle = TouchPointRenderer.touchPointColor;
                        ctx.lineWidth = lineWidth;
                        ctx.arc(untrackedTouch.x, untrackedTouch.y, arcRadius, 0, 2 * Math.PI * percentRealized);
                        ctx.stroke();
                    }
                    else if (untrackedTouch.ignorePoint) {
                        //For explicitly untracked points that are on the touch screen, draw a light gray bubble
                        ctx.strokeStyle = TouchPointRenderer.ignoredPointColor;
                        ctx.beginPath();
                        ctx.arc(untrackedTouch.x, untrackedTouch.y, arcRadius / 2, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                }
            }

            //Then, we render all tracked objects
            for (var trackedObj of touchTracker._activeTrackingList) {
                var arcRadius = trackedObj.radiusLong * 1.5;
                if (arcRadius < oneInchWide / 3) 
                    arcRadius = oneInchWide / 3;

                //Draw the current position
                ctx.beginPath();

                if (trackedObj.touchPoint) {
                ctx.fillStyle = TouchPointRenderer.touchPointColor;
                }
                else { 
                    arcRadius = oneInchWide / 3; //We don't know the object size
                    ctx.fillStyle = TouchPointRenderer.missingPointColor;
                }

                ctx.arc(trackedObj.x, trackedObj.y, arcRadius, 0, 2 * Math.PI);
                ctx.fill();


                if (trackedObj.speculative) {

                    //Compute the speculative line angle, so we can draw our circle from the correct
                    //origin
                    var opp = (trackedObj.speculativeY - trackedObj.y);
                    var adj = (trackedObj.speculativeX - trackedObj.x);
                    var startAngle =
                        Math.atan(opp / adj);
                    if (adj >= 0) startAngle += Math.PI;

                    //Compute distance
                    var dist = Math.sqrt(opp**2 + adj **2);
                    //Skip rendering speculative if it's only a few pixels
                    //because it's most likely just jitter
                    if (dist < 10) continue; 

                    //Then compute how far short to draw the line, so it lines up with the edge of the arc
                    var shortX = 0;
                    var shortY = 0;
                    shortX = Math.cos(startAngle) * arcRadius;
                    shortY = Math.sin(startAngle) * arcRadius;
                    //Draw the speculative line
                    ctx.beginPath();
                    ctx.moveTo(trackedObj.x - shortX, trackedObj.y - shortY);
                    ctx.lineTo(trackedObj.speculativeX + shortX, trackedObj.speculativeY + shortY);
                    ctx.strokeStyle = TouchPointRenderer.speculativeColor;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                    //And draw the spinning fill in arc
                    var percentRealized = (Date.now() - trackedObj.lastSpeculativeMoveTime) / TouchTracker.msToWaitOnObjectMovedOrReplaced;
                    ctx.beginPath();
                    ctx.arc(trackedObj.speculativeX, trackedObj.speculativeY, arcRadius, startAngle, startAngle + Math.PI * 2 * percentRealized);
                    ctx.stroke();
                }
            }
        }
    }