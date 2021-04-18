var mapInfo = require("../../map/MapInfo");
function initMapChooser(callback) {
    var mapList = mapInfo.maps;
var elem = document.getElementById("mapchooserinternal");
    mapList.forEach((mapObj) => {
        var map = mapObj;
        //For each one, create a button
        var fn = function () {
            document.getElementById("mapchooser").remove();
            callback(map);
        }

        var btn = document.createElement("button");
        btn.innerText = map.name;
        btn.style.marginTop = "10px";
        btn.style.marginRight = "3%";
        btn.style.width = "30%";
        btn.ontouchend = fn;
        btn.onmouseup = fn;
        btn.__map = map;

        elem.appendChild(btn);

    });
}