"use strict";

const JS_FIDDLE_KEY = "paste your key";
const MODEL_SID = "JGPnGQ6hosj";

const resolution = {
  width: 600,
  height: 800
};

const visibility = {
  mattertags: false,
  sweeps: true
};

let iframe = document.getElementById('showcase');

document.addEventListener("DOMContentLoaded", () => {
  iframe.setAttribute('src', `https://mpembed.com/show/?m=${MODEL_SID}&minimap=3`);
  iframe.addEventListener('load', () => showcaseLoader(iframe));
});

function showcaseLoader(iframe) {
  try {
    iframe.contentWindow.MP_SDK.connect(iframe, JS_FIDDLE_KEY, '3.10')
      .then(loadedShowcaseHandler)
      .catch(console.error);
  } catch (e) {
    console.error(e);
  }
}

async function loadedShowcaseHandler(mpSdk) {
  await mpSdk.Renderer.takeScreenShot(resolution, visibility)
    .then(function (screenShotUri) {
      // set src of an img element
      let img = doecument.getElementByID("img-test");
      alert(screenShotUri);
    });
  // const modelNode = await mpSdk.Scene.createNode();
  // const fbxComponent = modelNode.addComponent(mpSdk.Scene.Component.DAE_LOADER, {
  //   url: 'https://github.com/mrdoob/three.js/blob/dev/examples/models/collada/stormtrooper/stormtrooper.dae',
  // });

  // fbxComponent.inputs.localScale = {
  //   x: 0.3,
  //   y: 0.3,
  //   z: 0.3
  // };

  // modelNode.obj3D.position.set(0, -1.65, 0);

  // modelNode.obj3D.rotation.y = Math.PI

  // modelNode.start();

  // let step = -0.1
  // let zPos = 0
  // const tick = function () {
  //   requestAnimationFrame(tick);
  //   if (zPos >= 1.8) {
  //     step = -0.02
  //   } else if (zPos <= -0.4) {
  //     step = 0.02
  //   }
  //   zPos += step
  //   modelNode.obj3D.rotation.y += 0.02;
  //   modelNode.obj3D.position.set(0, -1.65, zPos);
  // }
  // tick();
  let mattertagData = mpSdk.Mattertag.getData();
  console.log(mattertagData);

  // prevent navigating to the tag on click
  var noNavigationTag = mattertagData[0];
  mpSdk.Mattertag.preventAction(noNavigationTag.sid, {
    navigating: true,
  });

  // prevent the billboard from showing
  var noBillboardTag = mattertagData[1];
  mpSdk.Mattertag.preventAction(noBillboardTag.sid, {
    opening: true,
  });

  var noActionsTag = mattertagData[2];
  mpSdk.Mattertag.preventAction(noActionsTag.sid, {
    opening: true,
    navigating: true,
  });
}