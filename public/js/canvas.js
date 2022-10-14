
	funcQuadrant();

function funcQuadrant() {
var i = 0;
var str = '<SELECT id="sectorAngle" onChange="funcSector(false)">';
	for (i=0; i<=360; i++) {
		str += '<OPTION value="' + i + '">' + i + '</OPTION>';
	}
	document.getElementById('sector_angle').innerHTML = str + '</SELECT>';
	document.getElementById('sectorAngle').selectedIndex = 60;

	str = '<SELECT id="getQuadrant" onChange="funcSector(true)">';
	for (i=0; i<=5; i++) {
		str += '<OPTION value="' + i + '">' + i + '</OPTION>';
	}
	document.getElementById('quadrant').innerHTML = str + '</SELECT>';
	document.getElementById('getQuadrant').selectedIndex = 1;

	drawSectorCanvas(1, 60, true);
}

// カウンタの無限回転仕様
function funcEndlessCounter(id, m, n) {
	if(n<1) {
		n = m;
	} else if(n>m) {
		n = 1;
	}
	document.getElementById(id).selectedIndex = n;
	return n;
}

// 扇形の中心角と象限を決定する
function funcSector(flag) {
var q = document.getElementById('getQuadrant').selectedIndex;
var deg = document.getElementById('sectorAngle').selectedIndex;
	if(flag) {
		q = funcEndlessCounter('getQuadrant', 4, q);
	} else {
		deg = funcEndlessCounter('sectorAngle', 359, deg);
	}
	if(document.figure.mode[0].checked) {
		drawSectorCanvas(q, deg, false);
	} else {
		drawSectorCanvas(q, deg, true);
	}
}

// 扇形を描線するか塗り潰すかの決定
function setMode(dmode) {
var q = document.getElementById('getQuadrant').selectedIndex;
var deg = document.getElementById('sectorAngle').selectedIndex;
	drawSectorCanvas(q, deg, dmode);
}

// 中心角と象限を指定して扇形を作図する
function drawSectorCanvas(quadrant, rad, mode) {
var cvs = document.getElementById('sector_q_canvas');
var pen = cvs.getContext('2d');
var w = cvs.width;
var h = cvs.height;
var x = w/2;
var y = h/2;
var r = 170;
	rad *= Math.PI/180;
	// Canvas 全体をクリアする
	pen.clearRect(0, 0, w, h);

	// 円周
	pen.strokeStyle = 'teal';
	pen.lineWidth = 1;
	pen.beginPath();
	pen.arc(x, y, r, 0, Math.PI*2);
	pen.stroke();

	// 中心の十文字
	pen.strokeStyle = 'seagreen';
	pen.lineWidth = 0.5;
	pen.beginPath();
	pen.moveTo(x, 0);
	pen.lineTo(x, h);
	pen.moveTo(0, y);
	pen.lineTo(w, y);
	pen.stroke();

	// ペン軸の座標基準点を移動させる
	pen.translate(x, y);

	// 扇形を象限 (quadrant) ごとに描く
	pen.fillStyle = 'lightskyblue';
	pen.strokeStyle = 'lavender';
	pen.lineWidth = 2;
	pen.beginPath();
		pen.moveTo(0, 0);
	switch (quadrant) {
	case 4:
		pen.arc(0, 0, r, 0, rad);
		break;
	case 3:
		pen.arc(0, 0, r, Math.PI/2, Math.PI/2+rad);
		break;
	case 2:
		pen.arc(0, 0, r, -Math.PI, -Math.PI+rad);
		break;
	case 1:
	default:
		pen.arc(0, 0, r, -Math.PI/2, -Math.PI/2+rad);
		break;
	}
	pen.closePath();
	if(mode) { pen.fill(); }
	pen.stroke();

	// 時計の文字盤
	pen.strokeStyle = 'mediumvioletred';
	pen.lineWidth = 1;
	pen.beginPath();
	pen.arc(0, 0, 100, 0, Math.PI*2);
	pen.stroke();

	pen.font = '26px Times New Roman';
	pen.fillStyle = 'magenta';
	pen.fillText('12', -11, -110);
	pen.fillText('1', 54, -96);
	pen.fillText('2', 99, -52);
	pen.fillText('3', 113, 8);
	pen.fillText('4', 97, 68);
	pen.fillText('5', 55, 112);
	pen.fillText('6', -6, 127);
	pen.fillText('7', -68, 115);
	pen.fillText('8', -111, 68);
	pen.fillText('9', -123, 8);
	pen.fillText('10', -120, -53);
	pen.fillText('11', -75, -96);

	// ペン軸をリセットする
	pen.translate(-x, -y);

	// 象限の記載と中心点 O
	pen.font = '25px Arial';
	pen.fillStyle = 'aquamarine';
	pen.fillText('1', w-50, 50);
	pen.fillText('2', 40, 50);
	pen.fillText('3', 40, h-40);
	pen.fillText('4', w-50, h-40);
	pen.font = '22px Times New Roman';
	pen.fillStyle = 'midnightblue';
	pen.fillText('O', x-22, y+22);
}
-->
</SCRIPT>
