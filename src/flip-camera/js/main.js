const constraints = window.constraints = {
  audio: false,
  video: true
};

let xAxis=1;
let yAxis=1;

const videoLocal = document.getElementById('gum-local');
const videoCopy = document.getElementById('gum-copy');

const horizontal = document.getElementById('horizontal');
const vertical = document.getElementById('vertical');
horizontal.disabled = true;
vertical.disabled = true;

function handleSuccess(stream) {
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  videoLocal.srcObject = stream;
  videoCopy.srcObject = stream;
  horizontal.disabled = false;
  vertical.disabled = false;
}

function handleError(error) {
  if (error.name === 'ConstraintNotSatisfiedError') {
    const v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}

function flip(x,y) {
  videoCopy.style.transform = `scaleX(${x}) scaleY(${y})`
}

document.getElementById('showVideo').addEventListener('click', e => init(e));
horizontal.addEventListener('click', _ => { xAxis*=-1; videoCopy.style.transform = `scaleX(${xAxis}) scaleY(${yAxis})` });
vertical.addEventListener('click', _ => { yAxis*=-1; videoCopy.style.transform = `scaleX(${xAxis}) scaleY(${yAxis})` });
