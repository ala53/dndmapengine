class TouchPoint {
    x = 0;
    y = 0;
    id = -1;
    startTime = 0;
    lastMoveTime = 0;
    activelyTracked = true;
    /**
     * @type {TrackedTouchObject}
     */
    _touchObjectTracked = null;

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.startTime = Date.now();
        this.lastMoveTime = Date.now();
    }
}

class TrackedTouchObject {
    id = 0;
    x = 0;
    y = 0;
    speculativeX = 0;
    speculativeY = 0;
    speculative = false;
    lastSpeculativeMoveTime = 0;
    /**
     * @type {TouchPoint}
     */
    touchPoint;

    constructor() { console.log("new"); }

    get missing() { return this.touchPoint == false; }
}

module.exports = class TouchTracker {
    //How many ms to wait before deleting a single missing object and returning to normal mode
    //when only one is lifted
    static msToWaitBeforeDeletingMissingObject = 30000;
    //How many ms to wait before deleting objects and returning to normal mode
    //when multiple objects are lifted
    static msToWaitBeforeResettingTrackingLoss = 60000;
    //How many ms to wait before tracking a new object placed on the board
    static msToWaitBeforeStartTracking = 3000;
    //How many milliseconds to wait when an object is set back on the board before 
    //updating its position officially 
    static msToWaitOnObjectMovedOrReplaced = 1000;

    static maxPxDifferenceBetweenSpeculativeAndFinal = 50;

    //The next id to assign to a tracked object
    _nextId = 0;
    _element;
    /**
     * @type {[TouchPoint]}
     */
    _activeTouches = [];
    //The internal state of the touch tracker
    //normal: all actively tracked pieces are currently tracking on the screen.
    //lifted: a single object is lifted off of the screen at this time, awaiting replacement
    //trackLoss: multiple objects have lost tracking, waiting for all objects to return before
    //matching 
    _state = "normal"; //normal, lifted, trackLoss
    //The timing of the last touch event
    _lastTouchEvent = Date.now();

    /**
     * @type {[TrackedTouchObject]}
     */
    _activeTrackingList = [];
    /**
     * @type {[TrackedTouchObject]}
     */
    _currentLiftedObjects = [];

    //Events
    //Called when a new object starts being tracked
    onObjectCreated = function (trackedObj) { }
    //Called when an object moves
    onObjectMove = function (trackedObj) { }
    //Called when an object moves, but the move has not been sitting long enough to be resolved fully
    onObjectSpeculativeMove = function (trackedObj, speculativeX, speculativeY) { }
    //Called when a tracked object is deleted for being missing from the screen for too long
    onObjectDeleted = function (trackedObj) { }
    //Called when a tracked object is lifted off of the screen. If it remains missing for too long,
    //an onObjectDeleted call will be issued next. If it is replaced, an onObjectMove will be called
    //instead.
    onObjectLifted = function (trackedObj) { }
    //Called when the touch screen loses tracking on multiple objects at once
    onTrackingLoss = function (missingObjArray) { }
    //Called when the touch screen regains tracking on all missing objects
    onTrackingResumed = function () { }
    /**
     * 
     * @param {HTMLElement} element 
     */
    register(element) {
        this._element = element;
        element.addEventListener('touchstart', (e) => this._onTouchStart(e));
        element.addEventListener('touchmove', (e) => this._onTouchMove(e));
        element.addEventListener('touchend', (e) => this._onTouchEnd(e));
        //for testing
        element.addEventListener('mousedown', (e) => this._onTouchStart(e));
        element.addEventListener('mousemove', (e) => this._onTouchMove(e));
        element.addEventListener('mouseup', (e) => this._onTouchEnd(e));
        //element.addEventListener('touchcancel', (e) => this._onTouchCancel(e));
    }

    renderLoop(deltaTime) {


        if (this._state == "normal") {
            //Go through each touch point in order
            for (const point of this._activeTouches) {
                if (!point.activelyTracked) continue; //Discard non tracked touches, as they are explicitly marked as ignore
                if (point._touchObjectTracked) {
                    var trackedObj = point._touchObjectTracked;
                    //It's connected to a tracked object
                    //Check if there's a speculative move that we can complete
                    if (trackedObj.speculative) {
                        if (Date.now() - point.lastMoveTime > TouchTracker.msToWaitOnObjectMovedOrReplaced) {
                            trackedObj.speculative = false;
                            trackedObj.lastSpeculativeMoveTime = Date.now();
                            trackedObj.x = point.x;
                            trackedObj.y = point.y;
                            //And issue an event
                            this.onObjectMove(trackedObj);
                        }
                    }
                }
                else {
                    //It's not connected, determine if we should create a tracked object
                    if (Date.now() - point.startTime > TouchTracker.msToWaitBeforeStartTracking) {
                        //Create a new object in the tracking list
                        var trackObj = new TrackedTouchObject();
                        trackObj.x = point.x;
                        trackObj.y = point.y;
                        trackObj.touchPoint = point;
                        trackObj.id = this._nextId++;
                        point._touchObjectTracked = trackObj;
                        this._activeTrackingList.push(trackObj);
                        this.onObjectCreated(trackObj);
                    }
                }
            }
        }
        else if (this._state == "lifted") {
            //First, determine if enough time has passed to execute the speculative move
            var trackedObj = this._currentLiftedObjects[0];
            var timePassed = Date.now() - trackedObj.lastSpeculativeMoveTime;
            //Find the closest point
            var closestUnlinked = this._findClosestUnlinkedTouch(trackedObj.speculativeX, trackedObj.speculativeY);
            if (closestUnlinked) {
                //Link the speculative move regardless
                trackedObj.speculativeX = closestUnlinked.x;
                trackedObj.speculativeY = closestUnlinked.y;
                trackedObj.speculative = true;
                //There is an appropriate point to move toward, update the point if enough time passed
                if (timePassed > TouchTracker.msToWaitOnObjectMovedOrReplaced) {
                    //We are ok time wise to execute
                    trackedObj.speculative = false;
                    trackedObj.lastSpeculativeMoveTime = Date.now();
                    trackedObj.x = closestUnlinked.x;
                    trackedObj.y = closestUnlinked.y;
                    trackedObj.touchPoint = closestUnlinked;
                    closestUnlinked._touchObjectTracked = trackedObj;
                    //Clean up lifted list
                    this._currentLiftedObjects.length = 0;
                    //And issue an event
                    this.onObjectMove(trackedObj);
                    //And leave track loss mode
                    this._state = "normal";
                }
            }
            else {
                //Mark it as not speculative, since there is no valid touch point to display
                trackedObj.speculative = false;
                //Remove if it has been missing for long enough
                if (timePassed > TouchTracker.msToWaitBeforeDeletingMissingObject) {
                    //We haven't seen a move in too long, remove the object
                    this._removeTrackedObj(trackedObj);
                    //Reset to normal state
                    this._state = "normal";
                }
            }
        }

        else if (this._state == "trackLoss") {
            //We are missing multiple objects.
            //First, determine if enough untracked points are available
            var unassignedPoints = [];
            for (const point of this._activeTouches) {
                if (!point._touchObjectTracked && point.activelyTracked)
                    unassignedPoints.push(point);
            }

            //If there's not enough points to reconstruct, dont even try
            if (this._currentLiftedObjects.length > unassignedPoints.length)
                return;

            //Try to match each lifted object with a point
            var removalList = [];
            //Keep track of which points were alreadyh assigned
            var usedPoints = [];
            var missingTouches = false;
            for (const trackedObj of this._currentLiftedObjects) {
                trackedObj.speculative = false;
                var point = this._findClosestUnlinkedTouchNotAlreadyUsed(trackedObj.x, trackedObj.y, usedPoints);
                if (point) {
                    usedPoints.push(point);
                    //Mark it as speculative, as we have a probably candidate
                    trackedObj.speculative = true;
                    trackedObj.speculativeX = point.x;
                    trackedObj.speculativeY = point.y;
                }
                else 
                {
                    //Note that we do not have enough touches available
                    missingTouches = true;
                    //Determine if it's been long enough that we should remove this object
                    if (Date.now() - trackedObj.lastSpeculativeMoveTime > TouchTracker.msToWaitBeforeResettingTrackingLoss) {
                        removalList.push(trackedObj);
                    }
                }
            }

            if (removalList.length > 0)
                removalList.forEach((a)=>this._removeTrackedObj(a));

            //Don't link touches unless enough are available
            if (missingTouches) return;

            //Link the touches and exit trackLoss mode
            for (const trackedObj of this._currentLiftedObjects) {
                var point = this._findClosestUnlinkedTouch(trackedObj.x, trackedObj.y);
                trackedObj.speculative = false;
                trackedObj.lastSpeculativeMoveTime = Date.now();
                trackedObj.x = point.x;
                trackedObj.y = point.y;
                trackedObj.touchPoint = point;
                point._touchObjectTracked = trackedObj;
            }

            //Clean up lifted list
            this._currentLiftedObjects.length = 0;
            //Call event
            this._state = "normal";
            this.onTrackingResumed();
        }
    }

    //Called when a tracked object is lifted from the screen
    _handleObjectLifted(touchPoint, trackedObj) {
        //Count liftoff as a move
        trackedObj.lastSpeculativeMoveTime = Date.now();
        //Keep track of it
        this._currentLiftedObjects.push(trackedObj);
        //Update the tracker state
        if (this._state == "normal") {
            this._state = "lifted";
        }
        else if (this._state == "lifted") {
            //First, we need to determine if we're in lifted state with a pending speculative
            //move (i.e. someone replaced the object but moved another before the speculation timer
            //ran out)
            //Scan through the touch list to see if there is a touch not yet linked to an object
            // AND within 50px of the last known speculation site
            var liftedObj = this._currentLiftedObjects[0];

            var closestUnlinked = this._findClosestUnlinkedTouch(liftedObj.speculativeX, liftedObj.speculativeY);
            if (closestUnlinked) {
                //It's a match, let's link the touch, drop the lifted object from the lifted array, and resume lifted mode
                //with the new object that was just picked up
                point._touchObjectTracked = liftedObj;
                liftedObj.x = point.x;
                liftedObj.y = point.y;
                liftedObj.touchPoint = point;
                liftedObj.speculative = false;
                //Remove the lifted object from the array
                this._currentLiftedObjects.splice(0, 1);
                //Call the event handler
                this.onObjectMove(liftedObj);
            }

            if (!closestUnlinked) {
                //We weren't able to link back the touch point, go into tracking loss mode
                this._state == "trackLoss";
                this.onTrackingLoss(this._currentLiftedObjects);
            }
        }
        //Fire the callback
        this.onObjectLifted(trackedObj);
    }
    _findClosestUnlinkedTouch(x, y) {
        var foundPoint;
        var dMin = Number.POSITIVE_INFINITY;
        for (const point of this._activeTouches) {
            if (point._touchObjectTracked || !point.activelyTracked)
                continue; //Actively tracking another object or not allowed to track
            //Diagonal distance
            var dist = Math.sqrt(Math.abs(x - point.x) + Math.abs(y - point.y));
            //Make sure it's less than max value and less than the closest we have found so far
            if (dist < TouchTracker.maxPxDifferenceBetweenSpeculativeAndFinal && dist < dMin) {
                foundPoint = point;
                dMin = dist;
            }
        }

        return foundPoint;
    }
    _findClosestUnlinkedTouchNotAlreadyUsed(x, y, usedArray) {
        var foundPoint;
        var dMin = Number.POSITIVE_INFINITY;
        var availArray = this._activeTouches.filter(
            (t) => { return !t._touchObjectTracked && t.activelyTracked && ! usedArray.includes(t); })
        for (const point of availArray) {
            if (point._touchObjectTracked || !point.activelyTracked)
                continue; //Actively tracking another object or not allowed to track
            //Diagonal distance
            var dist = Math.sqrt(Math.abs(x - point.x) + Math.abs(y - point.y));
            //Make sure it's less than max value and less than the closest we have found so far
            if (dist < TouchTracker.maxPxDifferenceBetweenSpeculativeAndFinal && dist < dMin) {
                foundPoint = point;
                dMin = dist;
            }
        }

        return foundPoint;
    }

    //Removes a tracked object from thte tracking list
    _removeTrackedObj(trackedObj) {
        console.log("remove)");
        //find index 
        var index = this._findTrackedObj(trackedObj.id);
        if (index == -1) return; //Not tracked
        //Loop through the list of lifted objects
        var liftedIndex = -1;
        for (var i = 0; i < this._currentLiftedObjects.length; i++) {
            if (this._currentLiftedObjects[i].id == trackedObj.id) {
                liftedIndex = i;
                break;
            }
        }
        if (liftedIndex != -1)
            this._currentLiftedObjects.splice(liftedIndex, 1);
        //Remove
        this._activeTrackingList.splice(index, 1);
        //Update metadata
        if (trackedObj.touchPoint) {
            trackedObj.touchPoint.lastMoveTime = Date.now(); //to avoid linking to anything else
            trackedObj.touchPoint.activelyTracked = false;
            trackedObj.touchPoint._touchObjectTracked = null;
            trackedObj.touchPoint = null;
        }
        this.onObjectDeleted(trackedObj);
    }

    /**
     * 
     * @param {TouchEvent} event 
     */
    _onTouchStart(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        this._lastTouchEvent = Date.now();
        //Testing only - simulate mouse moves as a single touch event
        if (!touches) {
            touches = [{ identifier: 0, pageX: event.pageX, pageY: event.pageY }];
        }

        for (var i = 0; i < touches.length; i++) {
            //Copy the touch point object and tag it as active
            var point = new TouchPoint(touches[i].identifier, touches[i].pageX, touches[i].pageY);
            this._activeTouches.push(point);
            //First, see if we're in a lifted state
            if (this._state == "lifted") {
                //Ok, this is the object that was lifted, so throw out a speculative move
                var linkedObj = this._currentLiftedObjects[0];
                linkedObj.speculativeX = point.x;
                linkedObj.speculativeY = point.y;
                linkedObj.speculative = true;
                linkedObj.lastSpeculativeMoveTime = Date.now();
                this.onObjectSpeculativeMove(linkedObj, point.x, point.y);
            }
        }
    }

    /**
     * 
     * @param {MouseEvent} event 
     */
    _onTouchMove(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        this._lastTouchEvent = Date.now();
        //Testing only - simulate mouse moves as a single touch event
        if (!touches) {
            touches = [{ identifier: 0, pageX: event.pageX, pageY: event.pageY }];
        }

        for (var i = 0; i < touches.length; i++) {
            var touchIndex = this._findTouch(touches[i].identifier);

            if (touchIndex >= 0) {
                var touchObj = this._activeTouches[touchIndex];
                var trackedObj = touchObj._touchObjectTracked;
                //Update the touch point's x and y values
                touchObj.x = touches[i].pageX;
                touchObj.y = touches[i].pageY;
                touchObj.lastMoveTime = Date.now();
                //Determine if we are currently tracking
                if (trackedObj) {
                    trackedObj.speculativeX = touchObj.x;
                    trackedObj.speculativeY = touchObj.y;
                    trackedObj.speculative = true;
                    trackedObj.lastSpeculativeMoveTime = Date.now();
                    //Call the speculative move handler
                    this.onObjectSpeculativeMove(touchObj._touchObjectTracked, touchObj.x, touchObj.y);
                }
            } else {
                //Testing only - discard move events if no touch object created
                //throw "Move event for untracked touch, ID: " + touches[i].identifier;
            }
        }
    }

    /**
     * 
     * @param {TouchEvent} event 
     */
    _onTouchEnd(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        this._lastTouchEvent = Date.now();
        //Testing only - simulate mouse moves as a single touch event
        if (!touches) {
            touches = [{ identifier: 0, pageX: event.pageX, pageY: event.pageY }];
        }

        for (var i = 0; i < touches.length; i++) {
            var touchIndex = this._findTouch(touches[i].identifier);

            if (touchIndex >= 0) {
                var touchObj = this._activeTouches[touchIndex];
                this._activeTouches.splice(touchIndex, 1); //Remove the touch object
                //Check if it is attached to a tracked object and actively monitored
                if (touchObj.activelyTracked && touchObj._touchObjectTracked) {
                    touchObj._touchObjectTracked.touchPoint = null;
                    this._handleObjectLifted(touchObj, touchObj._touchObjectTracked);
                }
                //Testing only
                console.log("Tracked touch: {id =" + touchObj.id + ", time = " + (Date.now() - touchObj.startTime) + "ms }");
            } else {
                throw "End event for untracked touch, ID: " + touches[i].identifier;
            }
        }

    }

    //Instructs the touch tracker to stop watching the specified object, even if it's on the screen as a touch point
    stopTracking(trackedObj) {
        trackedObj.touchPoint = false;
        trackedObj.touchPoint._touchObjectTracked = null;
        _removeTrackedObj(trackedObj);
    }

    _findTouch(idToFind) {
        for (var i = 0; i < this._activeTouches.length; i++) {
            var id = this._activeTouches[i].id;

            if (id == idToFind) {
                return i;
            }
        }
        return -1;    // not found
    }

    _findTrackedObj(idToFind) {
        for (var i = 0; i < this._activeTrackingList.length; i++) {
            var id = this._activeTrackingList[i].id;

            if (id == idToFind) {
                return i;
            }
        }
        return -1;    // not found
    }
}