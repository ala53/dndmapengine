const TouchScreenFixup = require("./TouchScreenFixup");

class TouchPoint {
    x = 0;
    y = 0;
    //The long segment of the radius of the touch point
    radiusLong = 0;
    //The short segment of the radius of the touch point
    radiusShort = 0;
    //The angle to approximate the finger sized ellipse
    radiusAngle = 0;
    id = -1;
    startTime = 0;
    lastMoveTime = 0;
    ignorePoint = false;
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
    radiusLong = 0;
    radiusShort = 0;
    rotationAngle = 0;
    lastSpeculativeMoveTime = 0;
    /**
     * @type {TouchPoint}
     */
    touchPoint;

    get missing() { return this.touchPoint == false; }
}

module.exports = class TouchTracker {
    //How many ms to wait before deleting a single missing object and returning to normal mode
    //when only one is lifted
    static msToWaitBeforeDeletingMissingObject = 5000;
    //How many ms to wait before deleting objects and returning to normal mode
    //when multiple objects are lifted
    static msToWaitBeforeResettingTrackingLoss = 7500;
    //How many ms to wait before tracking a new object placed on the board
    static msToWaitBeforeStartTracking = 1500;
    //How many milliseconds to wait when an object is set back on the board before 
    //updating its position officially 
    static msToWaitOnObjectMovedOrReplaced = 750;

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
        //BUG WORKAROUND -- touch screen deletes unmoving contact points after
        //15 ish seconds
        var fixup = new TouchScreenFixup();
        var me = this;
        fixup.touchStart = (e) => me._onTouchStart(e);
        fixup.touchMove = (e) => me._onTouchMove(e);
        fixup.touchEnd = (e) => me._onTouchEnd(e);

        this._element = element;
        element.addEventListener('touchstart', (e) => fixup._onTouchStart(e));
        element.addEventListener('touchmove', (e) => fixup._onTouchMove(e));
        element.addEventListener('touchend', (e) => fixup._onTouchEnd(e));
        element.addEventListener('touchcancel', (e) => console.log("cancel"));
    }

    renderLoop(deltaTime) {
        if (this._state == "normal") {
            //Go through each touch point in order
            for (const point of this._activeTouches) {
                if (point.ignorePoint) continue; //Discard non tracked touches, as they are explicitly marked as ignore
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
                            trackedObj.radiusLong = point.radiusLong;
                            trackedObj.radiusShort = point.radiusShort;
                            trackedObj.rotationAngle = point.rotationAngle;
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
                        trackObj.radiusLong = point.radiusLong;
                        trackObj.radiusShort = point.radiusShort;
                        trackObj.rotationAngle = point.rotationAngle;
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
                trackedObj.radiusLong = closestUnlinked.radiusLong;
                trackedObj.radiusShort = closestUnlinked.radiusShort;
                trackedObj.rotationAngle = closestUnlinked.rotationAngle;
                trackedObj.speculative = true;
                //There is an appropriate point to move toward, update the point if enough time passed
                if (timePassed > TouchTracker.msToWaitOnObjectMovedOrReplaced) {
                    //We are ok time wise to execute
                    trackedObj.speculative = false;
                    trackedObj.lastSpeculativeMoveTime = Date.now();
                    trackedObj.x = closestUnlinked.x;
                    trackedObj.y = closestUnlinked.y;
                trackedObj.radiusLong = closestUnlinked.radiusLong;
                trackedObj.radiusShort = closestUnlinked.radiusShort;
                trackedObj.rotationAngle = closestUnlinked.rotationAngle;
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
                if (!point._touchObjectTracked && !point.ignorePoint)
                    unassignedPoints.push(point);
            }

            //Guard clause against inadvertently continuing to run the tracking
            //even when all touch points have been deleted for inactivity
            if (this._activeTrackingList.length == 0) {
                this._state = "normal";
                return;
            }

            //Try to match each lifted object with a point
            var removalList = [];
            //Keep track of which points were alreadyh assigned
            var usedPoints = [];
            var missingTouchList = [];
            var missingTouchCount = 0;
            //TODO: find a way of assigning each point to the optimal target
            // (e.g. to the closest target deterministically, as sometimes it will
            //  run in the wrong order, leading to three points within range, but still too far away)

            var hasAllTouchesTracked = this._matchMissingTouches(this._currentLiftedObjects, unassignedPoints);
            for (const trackedObj of this._currentLiftedObjects) {
                //Mark the object as not having a speculative target
                trackedObj.speculative = false;
                //Find a touch point within range
                //var point = this._findClosestUnlinkedTouchNotAlreadyUsed(trackedObj.x, trackedObj.y, usedPoints);
                var point = trackedObj.__FOUNDPOINT;
                //trackedObj.__FOUNDPOINT = point;
                //If there is a point, add it to the list of used ones
                if (point) {
                    usedPoints.push(point);
                }
                else {
                    //Note that we do not have enough touches available
                    missingTouchCount++;
                    missingTouchList.push(trackedObj);
                    //Determine if it's been long enough that we should remove this object
                    if (Date.now() - trackedObj.lastSpeculativeMoveTime > TouchTracker.msToWaitBeforeResettingTrackingLoss) {
                        removalList.push(trackedObj);
                    }
                }
            }
            //If an object has exceeded the time limit and we still can't link all the touches
            if (removalList.length > 0) {
                removalList.forEach((a) => this._removeTrackedObj(a));
                return;
            }

            //Then we update the speculation info
            //And determine if the time object has been there long enough
            var haveAllObjectsBeenInPlaceLongEnough = true;
            for (const trackedObj of this._currentLiftedObjects) {
                if (trackedObj.__FOUNDPOINT) {
                    trackedObj.speculative = true;
                    trackedObj.speculativeX = trackedObj.__FOUNDPOINT.x;
                    trackedObj.speculativeY = trackedObj.__FOUNDPOINT.y;
                    trackedObj.lastSpeculativeMoveTime = trackedObj.__FOUNDPOINT.lastMoveTime;
                    //Make sure the point has not moved in a long enough time
                    if (Date.now() - trackedObj.__FOUNDPOINT.lastMoveTime < TouchTracker.msToWaitOnObjectMovedOrReplaced)
                        haveAllObjectsBeenInPlaceLongEnough = false;
                }
                else haveAllObjectsBeenInPlaceLongEnough = false;

            }
            if (!hasAllTouchesTracked) return;
            if (!haveAllObjectsBeenInPlaceLongEnough) return;

            //Link the touches and exit trackLoss mode
            for (const trackedObj of this._currentLiftedObjects) {
                trackedObj.speculative = false;
                trackedObj.lastSpeculativeMoveTime = Date.now();
                trackedObj.x = trackedObj.__FOUNDPOINT.x;
                trackedObj.y = trackedObj.__FOUNDPOINT.y;
                trackedObj.touchPoint = trackedObj.__FOUNDPOINT;
                trackedObj.__FOUNDPOINT._touchObjectTracked = trackedObj;
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
        
        trackedObj.touchPoint = null;
        touchPoint._touchObjectTracked = null;
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
                //We deliberately skip the timeout because we assume another object was picked up and it's 
                //better to just link the touch at that point
                closestUnlinked._touchObjectTracked = liftedObj;
                liftedObj.x = closestUnlinked.x;
                liftedObj.y = closestUnlinked.y;
                liftedObj.radiusLong = closestUnlinked.radiusLong;
                liftedObj.radiusShort = closestUnlinked.radiusShort;
                liftedObj.rotationAngle = closestUnlinked.rotationAngle;
                liftedObj.touchPoint = point;
                liftedObj.speculative = false;
                //Remove the lifted object from the array
                this._currentLiftedObjects.splice(0, 1);
                //Call the event handler
                this.onObjectMove(liftedObj);
            }

            if (!closestUnlinked) {
                //We weren't able to link back the touch point, go into tracking loss mode
                this._state = "trackLoss";
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
            if (point._touchObjectTracked || point.ignorePoint)
                continue; //Actively tracking another object or not allowed to track
            //Diagonal distance
            var dist = Math.sqrt(Math.abs(x - point.x) ** 2 + Math.abs(y - point.y) ** 2);
            //Make sure it's less than max value and less than the closest we have found so far
            if (dist < TouchTracker.maxPxDifferenceBetweenSpeculativeAndFinal && dist < dMin) {
                foundPoint = point;
                dMin = dist;
            }
        }

        return foundPoint;
    }
    _findClosestUnlinkedTouchNotAlreadyUsed(x, y, usedArray, limitDistance = true) {
        var foundPoint;
        var dMin = Number.POSITIVE_INFINITY;
        var availArray = this._activeTouches.filter(
            (t) => { return !t._touchObjectTracked && !t.ignorePoint && !usedArray.includes(t); })
        for (const point of availArray) {
            if (point._touchObjectTracked || point.ignorePoint)
                continue; //Actively tracking another object or not allowed to track
            //Diagonal distance
            var dist = Math.sqrt(Math.abs(x - point.x) ** 2 + Math.abs(y - point.y) ** 2);
            //Make sure it's less than max value and less than the closest we have found so far
            if (dist < TouchTracker.maxPxDifferenceBetweenSpeculativeAndFinal || !limitDistance)
                if (dist < dMin) {
                    foundPoint = point;
                    dMin = dist;
                }
        }

        return foundPoint;
    }

    //Iterates through all lifted objects and all touch points, trying each combination to find the minimum
    //total distance moved, to find the nearest approximation to the accurate touch points
    _matchMissingTouches(liftedObjects, touchPoints) {
        //Matching is a bit complicated
        //We assume, if we cannot match all touches to a lifted object < max dist away
        // that the first lifted object must be the object that is further away
        // (but there can only be one further away object)

        //So, phase 0 is to match objects such that the minimum total distance is moved
        //If there is no way to have all objects < max distance away, then we assume
        //liftedObjects[0] (and only this one) is further away and try to redo the match
        //If the match is still unsuccessful, we leave the speculative setup that has the min
        //total travel distance

        touchPoints = [...touchPoints]; //Copy array
        //Make sure the touch point array is at least as long as the lifted object array
        var lengthIncrement = touchPoints.length;
        while (touchPoints.length < liftedObjects.length) {
            touchPoints[lengthIncrement++] = null; //Buffer it if the array is too short
        }

        //Get the possible index sets
        var indexCombos = this._matchMissingTouchesGetPossibleIndexCombos(touchPoints, liftedObjects.length);

        var minDist = Number.POSITIVE_INFINITY;
        var indices = new Array(liftedObjects.length);
        var ctOverMax = 99999999;

        for (var i = 0; i < liftedObjects.length; i++ ) 
        liftedObjects[i].__FOUNDPOINT = null;
        indexCombos.forEach(indexSet => {
            var sumDist = 0;
            var countOverMax = 0;
            for (var i = 0; i < indexSet.length; i++) {
                var obj = liftedObjects[i];
                var point = touchPoints[indexSet[i]];
                if (point == null)
                    sumDist += 10000; // to ensure null points are never prioritized
                else {
                    var dist = Math.sqrt(Math.abs(obj.x - point.x) ** 2 + Math.abs(obj.y - point.y) ** 2);
                    if (dist > TouchTracker.maxPxDifferenceBetweenSpeculativeAndFinal)
                        countOverMax += 1;
                    sumDist += dist;
                }
            }

            if (minDist > sumDist && ctOverMax >= countOverMax) {
                indices = indexSet;
                minDist = sumDist;
                ctOverMax = countOverMax;
            }
        });

        //Process the result
        if (ctOverMax <=1)
        for (var i = 0; i < indices.length; i++) {
            liftedObjects[i].__FOUNDPOINT = touchPoints[indices[i]];
        }

        return ctOverMax <= 1;
    }

    //INCREDIBLY POORLY OPTIMIZED TODO FIXME HACK SEND HELP SEND JESUS
    //This will make the garbage collector very, very angry
    _matchMissingTouchesGetPossibleIndexCombos(touchArray, count) {
        var uniqueIndices = [];
        var finalIndices = [];
        var temp = [];
        TouchTracker._matchMissingTouchesGetPossibleIndexCombosIterative(touchArray, uniqueIndices, temp, 0, touchArray.length - 1, 0, count);

        //Then take the unique index count and shift it **touchArray.length** amount of times
        for (var j = 0; j < uniqueIndices.length; j++) {
            var arr = [...uniqueIndices[j]];
            for (var i = 0; i < touchArray.length; i++) {
                var first = arr.shift();
                arr.push(first);
                finalIndices.push([...arr]);
            }
        }
        return finalIndices.filter((val, idx, self) => TouchTracker._matchMissingTouchesFilterIndexOf(self, val) === idx);
    }

    static _matchMissingTouchesFilterIndexOf(arr, val) {
        for (var i = 0; i < arr.length; i++) {
            var eq = true;
            for (var j = 0; j < val.length; j++) {
                if (arr[i][j] != val[j]) {
                    eq = false;
                    break;
                }
            }
            if (eq)
                return i;
        }
        return -1;
    }

    static _matchMissingTouchesGetPossibleIndexCombosIterative(array, output, temp, start, end, index, count) {
        if (index == count) {
            output.push([...temp]);
            return;
        }

        for (var i = start; i <= end && end - i + 1 >= count - index; i++) {
            temp[index] = i;
            TouchTracker._matchMissingTouchesGetPossibleIndexCombosIterative(array, output, temp, i + 1, end, index + 1, count);
        }
    }

    //Removes a tracked object from thte tracking list
    _removeTrackedObj(trackedObj) {
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

        for (var i = 0; i < touches.length; i++) {
            //Copy the touch point object and tag it as active
            var point = new TouchPoint(touches[i].identifier, touches[i].pageX, touches[i].pageY);
            point.radiusLong = Math.max(touches[i].radiusX, touches[i].radiusY);
            point.radiusLong = Math.min(touches[i].radiusX, touches[i].radiusY);
            point.radiusAngle = touches[i].rotationAngle;
            this._activeTouches.push(point);
            //First, see if we're in a lifted state
            if (this._state == "lifted") {
                //Ok, this is the object that was lifted, so throw out a speculative move
                var linkedObj = this._currentLiftedObjects[0];
                linkedObj.speculativeX = point.x;
                linkedObj.speculativeY = point.y;
                linkedObj.radiusLong = point.radiusLong;
                linkedObj.radiusShort = point.radiusShort;
                linkedObj.rotationAngle = point.rotationAngle;
                linkedObj.speculative = true;
                linkedObj.lastSpeculativeMoveTime = Date.now();
                this.onObjectSpeculativeMove(linkedObj, point.x, point.y);
            }
        }
    }

    /**
     * 
     * @param {TouchEvent} event 
     */
    _onTouchMove(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        this._lastTouchEvent = Date.now();

        for (var i = 0; i < touches.length; i++) {
            var touchIndex = this._findTouch(touches[i].identifier);

            if (touchIndex >= 0) {
                var touchObj = this._activeTouches[touchIndex];
                var trackedObj = touchObj._touchObjectTracked;
                //Update the touch point's x and y values
                touchObj.x = touches[i].pageX;
                touchObj.y = touches[i].pageY;
                touchObj.radiusLong = Math.max(touches[i].radiusX, touches[i].radiusY);
                touchObj.radiusLong = Math.min(touches[i].radiusX, touches[i].radiusY);
                touchObj.radiusAngle = touches[i].rotationAngle;
                touchObj.lastMoveTime = Date.now();
                //Determine if we are currently tracking
                if (trackedObj) {
                    trackedObj.speculativeX = touchObj.x;
                    trackedObj.speculativeY = touchObj.y;
                    trackedObj.radiusLong = touchObj.radiusLong;
                    trackedObj.radiusShort = touchObj.radiusShort;
                    trackedObj.rotationAngle = touchObj.rotationAngle;
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

        for (var i = 0; i < touches.length; i++) {
            var touchIndex = this._findTouch(touches[i].identifier);

            if (touchIndex >= 0) {
                var touchObj = this._activeTouches[touchIndex];
                this._activeTouches.splice(touchIndex, 1); //Remove the touch object
                //Check if it is attached to a tracked object and actively monitored
                if (!touchObj.ignorePoint && touchObj._touchObjectTracked) {
                    touchObj._touchObjectTracked.touchPoint = null;
                    this._handleObjectLifted(touchObj, touchObj._touchObjectTracked);
                }
                touchObj._touchObjectTracked =null;

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