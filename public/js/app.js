'use strict';

let showcase;
let iframe = document.getElementById('showcase');

let map = document.getElementById('map');
let minX, minY, maxX, maxY;

let modes = document.querySelectorAll('.mode-control');
let moves = document.querySelectorAll('.move-control');
let transitions = document.querySelectorAll('.transition-control');

// ** Replace demo applicationKey with your application key **
const JS_FIDDLE_KEY = "paste your key";
const MODEL_SID = "JGPnGQ6hosj";

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

    console.log(metadata.sweeps);
    console.log(showcase);

    let sweeps = metadata.sweeps.map(function (sweep) {

        if (sweep.position && sweep.placementType === "auto") {
            console.log(sweep);
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

// 場所を移動するたびに発火するイベント
// sweepするたびにマップ上の現在地をmatterport上の現在地に合わせる
function changedSweepHandler(oldP, newP) {
    // Update map markers
    let curr = document.getElementById('p' + newP);
    let prev = document.getElementById('p' + oldP) || curr;

    settings.sweep = (curr && curr.value) || '';
    toggleActive(curr, prev);

    prev.style.visibility = "hidden";

    curr.scrollIntoView({
        block: "center",
        inline: "center"
    });
    curr.style.visibility = "visible";

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

// モデルごとに計算方法が違う?
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

        // let x = scaleToContainer(p.x, minX, maxX, 71, 13);
        // let y = scaleToContainer(p.y, minY, maxY, 74, 15) - 10;
        let x = scaleToContainer(p.x, minX, maxX, ((maxX - minX) * 4 - 5), 41.2);
        let y = scaleToContainer(p.y, minY, maxY, 75, 19.6);

        btn.setAttribute('id', 'p' + p.pid);
        btn.setAttribute('value', p.pid);
        btn.style.left = x + '%';
        btn.style.top = y + '%';
        btn.setAttribute('class', cList);

        btn.addEventListener('click', sweepMove);
        map.appendChild(btn);

        // console.log(p.x);
    }
}

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

// canvasデータ保存用のメソッド
document.getElementById("save-image").addEventListener('click', function () {


    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    let webgl_canvas = iframeDocument.getElementsByClassName("webgl-canvas");
    webgl_canvas[0].setAttribute('id', 'webgl-canvas');

    const canvas_container = iframeDocument.getElementById("canvas-container");
    const show = iframeDocument.getElementsByClassName("showcase");


    let style = window.getComputedStyle(canvas_container);
    let value = style.getPropertyValue('background');

    // map_area.insertBefore(circle, map_group);

    show[0].appendChild(circle);

    let webgl_canvas3 = iframeDocument.getElementById("webgl-canvas");
    console.log(webgl_canvas3);

    // canvasをダウンロード
    // canvasDownload("webgl-canvas");

});

/**
 * Canvasを画像としてダウンロード
 *
 * @param {string} id          対象とするcanvasのid
 * @param {string} [type]      画像フォーマット
 * @param {string} [filename]  DL時のデフォルトファイル名
 * @return {void}
 */
function canvasDownload(id, type = "image/png", filename = "canvas") {
    const blob = getBlobFromCanvas(id, type);       // canvasをBlobデータとして取得
    const dataURI = window.URL.createObjectURL(blob);  // Blobデータを「URI」に変換

    // JS内部でクリックイベントを発動→ダウンロード
    const event = document.createEvent("MouseEvents");
    event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    const a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    a.href = dataURI;         // URI化した画像
    a.download = filename;    // デフォルトのファイル名
    a.dispatchEvent(event);   // イベント発動
}

/**
  * 現状のCanvasを画像データとして返却
  *
  * @param {string}  id     対象とするcanvasのid
  * @param {string}  [type] MimeType
  * @return {blob}
  */
function getBlobFromCanvas(id, type = "image/png") {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    const canvas = iframeDocument.getElementById("webgl-canvas");
    // const canvas = document.querySelector(id);
    const base64 = canvas.toDataURL(type);              // "data:image/png;base64,iVBORw0k～"
    const tmp = base64.split(",");                     // ["data:image/png;base64,", "iVBORw0k～"]
    const data = atob(tmp[1]);                          // 右側のデータ部分(iVBORw0k～)をデコード
    const mime = tmp[0].split(":")[1].split(";")[0];    // 画像形式(image/png)を取り出す

    // Blobのコンストラクタに食わせる値を作成
    let buff = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        buff[i] = data.charCodeAt(i);
    }

    return (
        new Blob([buff], { type: mime })
    );
}