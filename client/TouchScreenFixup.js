module.exports =
    /*
    The IR touch screen triggers a touch end event if the touch point has not moved
    for 15 or so seconds, even if it is still present. Sometimes it's less than that,
    it seems to be some sort of weird heuristic. I've seen as little as 2 seconds, but more
    often > 10 seconds. It isn't really logical. It then triggers a new touchstart and
    touchupdate upon resumption. So, this class tracks the touchpoints and blocks touch end
    events if the touch point has not updated in > 10 seconds. It then marks the touch
    point as active, not present and waits for a new touchstart event indicating the 
    touch point has moved.
    
    It only passes through touch events that should have actually fired, so it does
    not pass through the inactivity related touchstart/touchend events
    */
    class TouchScreenFixup {
        _nextId = 0;
        _activeTouchPoints = [];

        //Anything that hasn't gotten an update in 1500ms is assumed to be 
        //a timeout. Nobody can keep their fingers perfectly still, so there's always updates
        //with finger touches. 
        static _touchTimeout = 1500;
        //Any touch object that has not been there at least 5000ms is not allowed to time out
        static _timeoutMinExistTime = 5000;
        static _timeoutResumeMaxDistPx = 50;

        /**
         * 
         * @param {TouchEvent} event 
         */
        touchStart = function (event) { }
        /**
         * 
         * @param {TouchEvent} event 
         */
        touchMove = function (event) { }
        /**
         * 
         * @param {TouchEvent} event 
         */
        touchEnd = function (event) { }

        /**
         * 
         * @param {TouchEvent} e 
         */
        _onTouchStart(e) {
            e.preventDefault();

            var touches = e.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                var srcPt = touches[i];
                //First determine if there's a missing touch
                var point = this._matchNearest(srcPt.pageX, srcPt.pageY);
                if (point) {
                    //Just a resumption, we issue a touch move instead
                    point._hasTimedOut = false;
                    point._srcPtId = srcPt.identifier;
                    point.pageX = srcPt.pageX;
                    point.pageY = srcPt.pageY;
                    point.rotationAngle = srcPt.rotationAngle;
                    point.radiusX = srcPt.radiusX;
                    point.radiusY = srcPt.radiusY;
                    point._lastMove = Date.now();

                    this.touchMove({ changedTouches: [point], preventDefault: ()=>{} });
                }
                else {
                    //New tracking point
                    point = new InternalTouchPoint();
                    point._srcPtId = srcPt.identifier;
                    point.identifier = this._nextId++;
                    point.pageX = srcPt.pageX;
                    point.pageY = srcPt.pageY;
                    point.rotationAngle = srcPt.rotationAngle;
                    point.radiusX = srcPt.radiusX;
                    point.radiusY = srcPt.radiusY;
                    point._lastMove = Date.now();
                    point._createTime = Date.now();

                    this._activeTouchPoints.push(point);

                    this.touchStart({ changedTouches: [point], preventDefault: ()=>{} });
                }
            }
        }

        /**
         * 
         * @param {TouchEvent} e 
         */
        _onTouchMove(e) {
            e.preventDefault();

            var touches = e.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                var point = this._findLinked(touches[i].identifier);
                var srcPt = touches[i];
                point.pageX = srcPt.pageX;
                point.pageY = srcPt.pageY;
                point.rotationAngle = srcPt.rotationAngle;
                point.radiusX = srcPt.radiusX;
                point.radiusY = srcPt.radiusY;
                point._lastMove = Date.now();

                this.touchMove({ changedTouches: [point], preventDefault: ()=>{} });
            }
        }

        /**
         * 
         * @param {TouchEvent} e 
         */
        _onTouchEnd(e) {
            e.preventDefault();

            var touches = e.changedTouches;
            for (var i = 0; i < touches.length; i++) {
                //Find the linked point
                var point = this._findLinked(touches[i].identifier);
                //Handle timeouts internally
                if (Date.now() - point._lastMove > TouchScreenFixup._touchTimeout &&
                 Date.now() - point._createTime > TouchScreenFixup._timeoutMinExistTime && false) {
                    //Timed out
                    point._hasTimedOut = true;
                    point._srcPtId = null;
                }
                else {
                    //Issue touch end events appropriately for **actually** ended touches
                    this._removeTouch(point);

                    this.touchEnd({ changedTouches: [point], preventDefault: ()=>{} });

                    //And clear the data so it's useless to store
                    point.pageX = undefined;
                    point.pageY = undefined;
                    point.radiusX = undefined;
                    point.radiusY = undefined;
                    point.identifier = undefined;
                    point.rotationAngle = undefined;
                    point._srcPtId = undefined;

                }
            }
        }

        _removeTouch(touch) {
            var idx = this._activeTouchPoints.indexOf(touch);

            if (idx == -1)
                return;

            this._activeTouchPoints.splice(idx, 1);
        }

        _findLinked(id) {
            for (var i = 0; i < this._activeTouchPoints.length; i++) {
                if (this._activeTouchPoints[i]._srcPtId == id)
                    return this._activeTouchPoints[i];
            }

            return null;
        }

        //Finds if there is a timed out nearby point present
        _matchNearest(x, y) {
            var closest = Number.POSITIVE_INFINITY;
            var closestPt = null;
            for (var i = 0; i < this._activeTouchPoints.length; i++) {
                var pt = this._activeTouchPoints[i];
                var dist = Math.sqrt((pt.pageX - x) ** 2 + (pt.pageY - y) ** 2);

                if (!pt._hasTimedOut) continue;
                if (dist < TouchScreenFixup._timeoutResumeMaxDistPx && dist < closest) {
                    closest = dist;
                    closestPt = pt;
                }
            }

            return closestPt;
        }
    }

class InternalTouchPoint {
    pageX;
    pageY;
    radiusX;
    radiusY;
    rotationAngle;
    identifier;

    // The touch point we're linked to
    _srcPtId;
    _hasTimedOut = false;

    _lastMove = Date.now();
    _createTime = Date.now();
    preventDefault() {

    }
}