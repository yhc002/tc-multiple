/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');
const video3 = document.querySelector('video#video3');
const video4 = document.querySelector('video#video4');

let pc1Local;
let pc1Remote;
let pc2Local;
let pc2Remote;
let pc3Local;
let pc3Remote;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};


function gotStream(stream) {
  console.log('Received local stream');
  video1.srcObject = stream;
  video1.style.background = "none";
  window.localStream = stream;
  callButton.disabled = false;
}

function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {width: {exact: 1280}, height: {exact: 720}}
      })
      .then(gotStream)
      .catch(e => console.log('getUserMedia() error: ', e));
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting calls');
  const audioTracks = window.localStream.getAudioTracks();
  const videoTracks = window.localStream.getVideoTracks();
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  // Create an RTCPeerConnection via the polyfill.
  const servers = null;
  pc1Local = new RTCPeerConnection(servers);
  pc1Remote = new RTCPeerConnection(servers);
  pc1Remote.ontrack = gotRemoteStream1;
  pc1Local.onicecandidate = iceCallback1Local;
  pc1Remote.onicecandidate = iceCallback1Remote;
  console.log('pc1: created local and remote peer connection objects');

  pc2Local = new RTCPeerConnection(servers);
  pc2Remote = new RTCPeerConnection(servers);
  pc2Remote.ontrack = gotRemoteStream2;
  pc2Local.onicecandidate = iceCallback2Local;
  pc2Remote.onicecandidate = iceCallback2Remote;
  console.log('pc2: created local and remote peer connection objects');

  pc3Local = new RTCPeerConnection(servers);
  pc3Remote = new RTCPeerConnection(servers);
  pc3Remote.ontrack = gotRemoteStream3;
  pc3Local.onicecandidate = iceCallback3Local;
  pc3Remote.onicecandidate = iceCallback3Remote;
  console.log('pc3: created local and remote peer connection objects');

  window.localStream.getTracks().forEach(track => pc1Local.addTrack(track, window.localStream));
  console.log('Adding local stream to pc1Local');
  window.localStream.getTracks().forEach(track => pc2Local.addTrack(track, window.localStream));
  console.log('Adding local stream to pc2Local');
  window.localStream.getTracks().forEach(track => pc3Local.addTrack(track, window.localStream));
  console.log('Adding local stream to pc3Local');

  const {codecs} = RTCRtpSender.getCapabilities('video');
  const codecIndex = codecs.findIndex(c => c.mimeType === "video/H264" && c.sdpFmtpLine.includes("packetization-mode=0"));
  if(codecIndex<0) {
    const codecIndex = codecs.findIndex(c => c.mimeType === "video/H264");
    if(codecIndex<0) {
     alert("h264 not supported. codec set to default");
    }
  }
  if(codecIndex>=0) {
    const selectedCodec = codecs[codecIndex];
    codecs.splice(codecIndex, 1);
    codecs.unshift(selectedCodec);
    const transceiver1 = pc1Local.getTransceivers().find(t => t.sender && t.sender.track === localStream.getVideoTracks()[0]);
    transceiver1.setCodecPreferences(codecs);
    const transceiver2 = pc2Local.getTransceivers().find(t => t.sender && t.sender.track === localStream.getVideoTracks()[0]);
    transceiver2.setCodecPreferences(codecs);
    const transceiver3 = pc3Local.getTransceivers().find(t => t.sender && t.sender.track === localStream.getVideoTracks()[0]);
    transceiver3.setCodecPreferences(codecs);

    console.log('setting codec to h264',transceiver1)
  }


  pc1Local
      .createOffer(offerOptions)
      .then(gotDescription1Local, onCreateSessionDescriptionError);

  pc2Local.createOffer(offerOptions)
      .then(gotDescription2Local, onCreateSessionDescriptionError);

  pc3Local.createOffer(offerOptions)
      .then(gotDescription3Local, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

function gotDescription1Local(desc) {
  pc1Local.setLocalDescription(desc);
  console.log(`Offer from pc1Local\n${desc.sdp}`);
  pc1Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc1Remote.createAnswer().then(gotDescription1Remote, onCreateSessionDescriptionError);
}

function gotDescription1Remote(desc) {
  pc1Remote.setLocalDescription(desc);
  console.log(`Answer from pc1Remote\n${desc.sdp}`);
  pc1Local.setRemoteDescription(desc);
}

function gotDescription2Local(desc) {
  pc2Local.setLocalDescription(desc);
  console.log(`Offer from pc2Local\n${desc.sdp}`);
  pc2Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2Remote.createAnswer().then(gotDescription2Remote, onCreateSessionDescriptionError);
}

function gotDescription2Remote(desc) {
  pc2Remote.setLocalDescription(desc);
  console.log(`Answer from pc2Remote\n${desc.sdp}`);
  pc2Local.setRemoteDescription(desc);
}

function gotDescription3Local(desc) {
  pc3Local.setLocalDescription(desc);
  console.log(`Offer from pc3Local\n${desc.sdp}`);
  pc3Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc3Remote.createAnswer().then(gotDescription3Remote, onCreateSessionDescriptionError);
}

function gotDescription3Remote(desc) {
  pc3Remote.setLocalDescription(desc);
  console.log(`Answer from pc3Remote\n${desc.sdp}`);
  pc3Local.setRemoteDescription(desc);
}

function hangup() {
  console.log('Ending calls');
  pc1Local.close();
  pc1Remote.close();
  pc2Local.close();
  pc2Remote.close();
  pc3Local.close();
  pc3Remote.close();
  pc1Local = pc1Remote = null;
  pc2Local = pc2Remote = null;
  pc3Local = pc3Remote = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}

function gotRemoteStream1(e) {
  if (video2.srcObject !== e.streams[0]) {
    video2.srcObject = e.streams[0];
    video2.style.background = "none";
    console.log('pc1: received remote stream');
  }
}

function gotRemoteStream2(e) {
  if (video3.srcObject !== e.streams[0]) {
    video3.srcObject = e.streams[0];
    video3.style.background = "none";
    console.log('pc2: received remote stream');
  }
}

function gotRemoteStream3(e) {
  if (video4.srcObject !== e.streams[0]) {
    video4.srcObject = e.streams[0];
    video4.style.background = "none";
    console.log('pc3: received remote stream');
  }
}

function iceCallback1Local(event) {
  handleCandidate(event.candidate, pc1Remote, 'pc1: ', 'local');
}

function iceCallback1Remote(event) {
  handleCandidate(event.candidate, pc1Local, 'pc1: ', 'remote');
}

function iceCallback2Local(event) {
  handleCandidate(event.candidate, pc2Remote, 'pc2: ', 'local');
}

function iceCallback2Remote(event) {
  handleCandidate(event.candidate, pc2Local, 'pc2: ', 'remote');
}

function iceCallback3Local(event) {
  handleCandidate(event.candidate, pc3Remote, 'pc3: ', 'local');
}

function iceCallback3Remote(event) {
  handleCandidate(event.candidate, pc3Local, 'pc3: ', 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
  dest.addIceCandidate(candidate)
      .then(onAddIceCandidateSuccess, onAddIceCandidateError);
  console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add ICE candidate: ${error.toString()}`);
}