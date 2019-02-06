/* eslint-disable require-jsdoc */
$(function () {
  // Peer object
  const peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  let localStream;
  let existingCall;

  peer.on('open', () => {
    $('#my-id').text(peer.id);
    step1();
  });

  // Receiving a call
  peer.on('call', call => {
    // Answer the call automatically (instead of prompting user) for demo purposes
    call.answer(localStream);
    step3(call);
  });

  peer.on('error', err => {
    alert(err.message);
    // Return to step 2 if error occurs
    step2();
  });

  $('#make-call').on('submit', e => {
    e.preventDefault();
    // Initiate a call!
    console.log($('#callto-id').val());
    const call = peer.call($('#callto-id').val(), localStream);
    step3(call);
  });

  $('#end-call').on('click', () => {
    existingCall.close();
    step2();
  });

  // Retry if getUserMedia fails
  $('#step1-retry').on('click', () => {
    $('#step1-error').hide();
    step1();
  });

  // set up audio and video input selectors
  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label ||
            'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text(deviceInfo.label ||
            'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option);
        }
      }

      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
    });

  function step1() {
    // Get audio/video stream
    const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      video: { deviceId: videoSource ? { exact: videoSource } : undefined },
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      // CHENGED
      // localStream = stream;
      localStream = threeCanvas.captureStream($('#FrameRate').val());
      if (existingCall) {
        // existingCall.replaceStream(stream);
        existingCall.replaceStream(localStream);
        return;
      }

      step2();
    }).catch(err => {
      $('#step1-error').show();
      console.error(err);
    });
  }

  function step2() {
    $('#step1, #step3').hide();
    $('#step2').show();
    $('#callto-id').focus();
  }

  function step3(call) {
    // Hang up on an existing call if present
    if (existingCall) {
      existingCall.close();
    }
    // Wait for stream on the call, then set peer video display
    call.on('stream', stream => {
      const el = $('#their-video').get(0);
      el.srcObject = stream;
      el.play();
    });

    // UI stuff
    existingCall = call;
    $('#their-id').text(call.remoteId);
    call.on('close', step2);
    $('#step1, #step2').hide();
    $('#step3').show();
  }



  // ページの読み込みを待つ
  //window.addEventListener('load', init);
  threeCanvas = document.querySelector('#threeCanvas');
  // function init() {

  //   // サイズを指定
  //   const width = 280;
  //   const height = 210;

  //   // レンダラーを作成
  //   const renderer = new THREE.WebGLRenderer({
  //     canvas: threeCanvas
  //   });
  //   renderer.setPixelRatio(window.devicePixelRatio);
  //   renderer.setSize(width, height);

  //   // シーンを作成
  //   const scene = new THREE.Scene();

  //   // カメラを作成
  //   const camera = new THREE.PerspectiveCamera(45, width / height);
  //   camera.position.set(0, 0, +1000);

  //   // 箱を作成
  //   const geometry = new THREE.BoxGeometry(400, 400, 400);
  //   const material = new THREE.MeshNormalMaterial();
  //   const box = new THREE.Mesh(geometry, material);
  //   scene.add(box);

  //   tick();

  //   // 毎フレーム時に実行されるループイベントです
  //   function tick() {
  //     box.rotation.y += 0.01;
  //     renderer.render(scene, camera); // レンダリング

  //     requestAnimationFrame(tick);
  //   }
  // }
});
