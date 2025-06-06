const socket = io();
const room = "demo-room";

let localStream, remoteStream, peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

socket.emit('join', room);

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localVideo.srcObject = stream;
  localStream = stream;
  socket.on('ready', startCall);
}).catch(console.error);

function startCall() {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', { room, candidate: e.candidate });
    }
  };

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.createOffer().then(offer => {
    return peerConnection.setLocalDescription(offer);
  }).then(() => {
    socket.emit('offer', { room, offer: peerConnection.localDescription });
  });

  socket.on('answer', answer => {
    peerConnection.setRemoteDescription(answer);
  });

  socket.on('ice-candidate', candidate => {
    peerConnection.addIceCandidate(candidate);
  });
}

socket.on('offer', offer => {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', { room, candidate: e.candidate });
    }
  };

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.setRemoteDescription(offer).then(() => {
    return peerConnection.createAnswer();
  }).then(answer => {
    return peerConnection.setLocalDescription(answer);
  }).then(() => {
    socket.emit('answer', { room, answer: peerConnection.localDescription });
  });

  socket.on('ice-candidate', candidate => {
    peerConnection.addIceCandidate(candidate);
  });
});
