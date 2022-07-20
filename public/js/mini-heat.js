'use strict';

let showcase;
let iframe = document.getElementById('showcase');

let map = document.getElementById('map');
let minX, minY, maxX, maxY;
let currentSweep;
let heatmapInstance;
let points = [];
let heat_width;
let heat_height;
let heat_max = 0;

let sweep_data = [];

let modes = document.querySelectorAll('.mode-control');
let moves = document.querySelectorAll('.move-control');
let transitions = document.querySelectorAll('.transition-control');

// ** Replace demo applicationKey with your application key **
const JS_FIDDLE_KEY = "paste your key";
const MODEL_SID = "paste your model";

// sdk embed
const params = `m=${MODEL_SID}&hhl=0&play=1&tiles=1&hl=0&qs=1&applicationKey=${JS_FIDDLE_KEY}`;

let settings = {
    sweep: '',
    mode: 'INSIDE',
    transition: 'FLY'
};

// Define iframe's src with my Space url
// iframe.setAttribute('src', `https://my.matterport.com/show/?m=${MODEL_SID}&hhl=0&play=1&tiles=1&hl=0&qs=1`);
iframe.setAttribute('src', `/bundle/showcase.html?${params}`);

// Initialize showcase SDK when iframe has loaded
iframe.addEventListener('load', showcaseLoader, true);

function showcaseLoader() {
    // Connect to SDK with applicationKey and iframe element
    try {
        // matterportに接続する前にmap領域の大きさを調整
        const promise = new Promise((resolve) => {

            let img = document.getElementById("model-img");
            let map_container = document.getElementById("map-container");
            map_container.style.width = img.width + "px";
            console.log(img.width);
            heat_width = img.width;
            heat_height = img.height;

            resolve('成功しました');
        }).then((result) => {
            window.MP_SDK.connect(iframe, JS_FIDDLE_KEY, '3.10').then(loadedShowcaseHandler).catch(handleError);
            console.log(result);
        });

    }
    catch (e) {
        console.error(e);
    }

}

function loadedShowcaseHandler(response) {
    // Define showcase and event listeners
    showcase = response;

    showcase.Model.getData().then(loadedSpaceHandler);
    showcase.on(showcase.Sweep.Event.ENTER, changedSweepHandler);

    // matterport上のカメラの向きが変わるたびにマップ上の現在地の向きを変える
    showcase.Camera.pose.subscribe((pose) => {
        let rotation = pose.rotation;
        let circle = document.getElementById("circle");

        let inversionY = (rotation.y * -1);
        circle.style.transform = "rotate(" + inversionY + "deg)";
        console.log(inversionY);

    });

}

function loadedSpaceHandler(metadata) {

    // Initialize min and max values
    minX = maxX = minY = maxY = 0;

    let sweeps = metadata.sweeps.map(function (sweep) {
        console.log(sweep);

        if (sweep.position && sweep.placementType === "auto") {
            // Format data
            let p = {
                pid: sweep.uuid,
                x: sweep.position.x || 0,
                y: sweep.position.z || 0
            };

            // Define min and max values for each axis
            setMinAndMax(p.x, p.y);

            // Define starting sweep
            if (p.x == 0 && p.y == 0) {
                settings.sweep = sweep.uuid;
            }

            return p;
        }
    });

    // Add each sweep to the div
    sweeps.map(sweepToMap);

    heatmapInstance = h337.create({
        // only container is required, the rest will be defaults
        container: document.querySelector('#map-container')
    });

    let data = {
        max: heat_max,
        min:0,
        data: points
    };

    heatmapInstance.setData(data);
    console.log(sweep_data);

    // Add event listeners to elements based on control type
    moves.forEach(function (elem) {

        elem.addEventListener('click', function () {
            movement(showcase.Camera.Direction[elem.value]);
        });
    });

    document.getElementById('ABOVE').addEventListener('click', function () {
        rotation(0, 15);
    });
    document.getElementById('BELOW').addEventListener('click', function () {
        rotation(0, -15);
    });
    document.getElementById('LTURN').addEventListener('click', function () {
        rotation(-15, 0);
    });
    document.getElementById('RTURN').addEventListener('click', function () {
        rotation(15, 0);
    });

    modes.forEach(function (elem) {

        elem.addEventListener('click', function () {

            let prev = document.querySelector('.mode-control.active');
            toggleActive(elem, prev);
            modeChange(elem.value);
        });
    });

    transitions.forEach(function (elem) {

        elem.addEventListener('click', function () {

            let prev = document.querySelector('.transition-control.active');
            settings.transition = elem.value;
            toggleActive(elem, prev);
        });
    });

    document.addEventListener('keydown', inputHandler, true);

}

// sweepするたびに発火するイベント
// sweepするたびにマップ上の現在地をmatterport上の現在地に合わせる
function changedSweepHandler(oldP, newP) {
    // Update map markers
    currentSweep = 'p' + newP;
    let curr = document.getElementById(currentSweep);
    let prev = document.getElementById('p' + oldP) || curr;

    settings.sweep = (curr && curr.value) || '';
    toggleActive(curr, prev);

    // prev.style.visibility = "hidden";

    // curr.scrollIntoView({
    //     block: "center",
    //     inline: "center"
    // });
    // curr.style.visibility = "visible";

    for (let i = 0; i < sweep_data.length; i++) {
        
        if(sweep_data[i].pid === curr.value) {
            heatmapInstance.addData({
                x: sweep_data[i].coordinate_x,
                y: sweep_data[i].coordinate_y,
                value: 20
            });
        }
    }    

}

function inputHandler(event) {

    if (event.defaultPrevented) {
        return;
        // Do nothing if the event was already processed
    }

    // Determine which key triggered the event and appropriate SDK action and parameters
    let key = event.key || event.keyCode || event.charCode || event.which;
    let direction;
    switch (key) {
        case "ArrowDown" || 40:
            direction = event.altKey ? 'DOWN' : 'BACK';
            movement(showcase.Camera.Direction[direction]);
            break;

        case "ArrowUp" || 38:
            direction = event.altKey ? 'UP' : 'FORWARD';
            movement(showcase.Camera.Direction[direction]);
            break;

        case "ArrowLeft" || 37:
            movement(showcase.Camera.Direction['LEFT']);
            break;

        case "ArrowRight" || 39:
            movement(showcase.Camera.Direction['RIGHT']);
            break;

        case "Enter" || 13:
            // Define action for enter key.
            break;

        case "Escape" || 27:
            // Define action for escape key.
            break;

        default:
            return;
        // otherwise, quit.
    }

    // Cancel the default
    event.preventDefault();
}

function movement(direction) {
    // Accepts 'LEFT', 'RIGHT', 'FORWARD', 'BACK'
    return showcase.Camera.moveInDirection(direction).then(handleMessage).catch(handleError);
}

function rotation(horizontal, vertical) {
    return showcase.Camera.rotate(horizontal, vertical).then(handleMessage).catch(handleError);
}

function modeChange(mode) {
    settings.mode = mode;
    return showcase.Mode.moveTo(showcase.Mode.Mode[mode]).then(handleMessage).catch(handleError);
}

function sweepMove(event) {
    // sweep extracts sweep ID from the clicked element's value,
    // transition is defined by value in settings object
    // rotation.x rotates camera vertically (up and down)
    // rotation.y rotates camera horizonally (left and right)
    return showcase.Sweep.moveTo(event.target.value || document.getElementById('p' + event).value, {
        transition: showcase.Sweep.Transition[settings.transition]
    }).then(handleMessage).catch(handleError);
}

function scaleToContainer(num, min, max, scale, offset) {
    // calculate position as percentage with left and top offset
    // return ( ((num - min) / (max - min)) * 78 ) + 6;
    return (((num - min) / (max - min)) * scale) + offset;
}

//
function sweepToMap(p) {
    // Create a sweep marker and position it over the floorplan
    if (p) {
        let btn = document.createElement('BUTTON');
        let cList = 'sweep z-depth-3';

        let x = scaleToContainer(p.x, minX, maxX, 70, 15);
        let y = scaleToContainer(p.y, minY, maxY, 60, 20);

        btn.setAttribute('id', 'p' + p.pid);
        btn.setAttribute('value', p.pid);
        btn.style.left = x + '%';
        btn.style.top = y + '%';
        btn.setAttribute('class', cList);

        btn.addEventListener('click', sweepMove);
        map.appendChild(btn);

        let val = Math.floor(Math.random() * 100);

        heat_max = Math.max(heat_max, val);
        let coordinate_x = Math.floor(x * heat_width / 100);
        let coordinate_y = Math.floor(y * heat_height / 100)
        let point = {
            x: coordinate_x,
            y: coordinate_y,
            value: val + 20
        };

        points.push(point);
  
        sweep_data.push({"pid":p.pid,"coordinate_x":coordinate_x,"coordinate_y":coordinate_y});
    }
}

// document.getElementById('map-container').onclick = function (ev) {
//     heatmapInstance.addData({
//         x: ev.layerX,
//         y: ev.layerY,
//         value: 20
//     });
// };
function setMinAndMax(x, y) {
    // Compare a set of coordinates to update min and max
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxX, y);
}

function toggleActive(curr, prev) {
    if (prev) {
        prev.classList.remove('active');
    }

    if (curr) {
        curr.classList += ' active';
    }
}

function handleMessage(message) {
    console.log(message);
}

function handleError(err) {
    console.error(err);
}

// リサイズしてもマップの現在地がずれないようにする
window.addEventListener('resize', function () {
    let curr = document.getElementById(currentSweep);
    curr.scrollIntoView({
        block: "center",
        inline: "center"
    });
}, false);