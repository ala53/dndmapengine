//This file tracks all the active touch points on the screen

//Plan:
// If a new touch point appears for less than 3 seconds, we ignore it,
// as it is most likely an accidental touch

//If a new touch point remains for more than 3 seconds, then we assume it is a 
//map object and start tracking it

//If a single tracked object disappears for more than 15 seconds, we 
//stop tracking it

//If a single tracked object disappears for less than 15 seconds, and
//then a new touch point appears for > 1 second, we assume it is the same
//object and move it to that point

//If a tracked object moves and we receive a triggered touch_move event,
//we move the object

//If two or more tracked objects disappear before the first one
//is set back down, we go into a special mode, reconstruction, 
//assuming the table
//was bumped. Until all objects are returned or > 1 minute passes,
//we remain in this mode. When an object is placed and remains for > 1
//second, we find the object in the state table that is physically closest
//to it and not actively being tracked (i.e. missing) and we link the two.

var active_touches = [];
var tracked_touches = [];
var touch_has_missing_object = false;
var touch_in_reconstruction_mode = false;

function trackedTouchObject() {

}

function touchPoint({id, x, y}) {
    return {id, x, y, startTime: Date.now(), attached: null};
}

function onTouchDown(event) {
    //Put the touch in the active_touches list


    if (touch_in_reconstruction_mode) {
        setTimeout(() => reconstructTouchPoint(0), 1000);
    }
    else if (touch_has_missing_object) {
        setTimeout(() => reattachTouchPoint(0), 1000);
    }
    else {

    }
}

function onTouchUp(event) {

}

function onTouchMove(event) {

}

function onTouchCancel(event) {

}

function reconstructTouchPoint(pointId) {
    //See if the touch point is still there
}