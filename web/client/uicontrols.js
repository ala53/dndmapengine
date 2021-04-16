var _reloadTimeClicked = 0;

function reloadBtnClickStart() {
    _reloadTimeClicked = Date.now();
}

function reloadBtnClickEnd() {
    if (Date.now() - _reloadTimeClicked > 1000)
        location.reload();
}