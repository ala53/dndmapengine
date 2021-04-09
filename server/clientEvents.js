function requestTileState() {

}

function requestMapInfo() {

}

//Called by the client when one of the player objects disappears
//from the touch screen or when a player object moves to a different
//grid square
function updateTouchPoints(touchPoints) {
    //touchPoints = [{playerId = 0, gridX = 0, gridY = 0, present = true}]
}

module.exports = {
    requestTileState: {type: "get", call: requestTileState},
    updateTouchPoints: {type: "set", call: updateTouchPoints},
}