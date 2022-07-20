// minimal heatmap instance configuration
var heatmapInstance = h337.create({
    container: document.querySelector('.heatmap'),
    radius: 90
});

document.querySelector('.demo-wrapper').onclick = function (ev) {
    heatmapInstance.addData({
        x: ev.layerX,
        y: ev.layerY,
        value: 1
    });
    alert(ev.layerX + ' : ' + ev.layerY);
};

