const SYNC_REQUESTS = 100;

let p2p;

class P2P{
	constructor(wsService, initiator = false){
		this.rtc = new RTCPeerConnection({
			iceServers: [{
				urls: 'stun:stun.l.google.com:19302'
			},{
				url: 'turn:numb.viagenie.ca',
				credential: 'muazkh',
				username: 'webrtc@live.com'
			}]
		});
		this.wsService = wsService;
		this.initiator = initiator;
		this.registerHandlers();
	}
	
	registerHandlers(){
		this.rtc.onicecandidate = this.handleICECandidateEvent;
		this.rtc.onnegotiationneeded = this.handleNegotiationNeededEvent;
		this.rtc.onconnectionstatechange = this.onConnectionStateChange;
		this.rtc.onicegatheringstatechange = this.onIceGatheringStateChange;
		this.rtc.oniceconnectionstatechange = this.onIceConnectionStateChange;
		
		if(this.initiator){
			this.handleDataChannel(this.rtc.createDataChannel("gameData"));
		} else {
			this.rtc.ondatachannel = (ev) => this.handleDataChannel(ev.channel);
		}
	}
	
	onIceGatheringStateChange = (ev) => {
		console.log("RTC ice gathering changed: ", this.rtc.iceGatheringState);
	}

	onIceConnectionStateChange = (ev) => {
		console.log("RTC ice conncetion state changed: ", this.rtc.iceConnectionState);
	}

	onConnectionStateChange = (ev) => {
		console.log("RTC connection state changed: ", this.rtc.connectionState);
	}
	
	handleICECandidateEvent = (ev) => {
		if(ev.candidate) {
			this.wsService.sendMsg({
				type: 'new-ice-candidate',
				candidate: ev.candidate
			})
		}
	};
	
	handleNegotiationNeededEvent = () => {
		console.log("I'm offering!");
		this.rtc.createOffer()
		.then((offer) => this.rtc.setLocalDescription(offer))
		.then(() => this.wsService.sendMsg({
			type: 'com-offer',
			sdp: this.rtc.localDescription
		}))
	}
	
	handleDataChannel(dataChannel) {
		gameDataChannel = new GameDataChannel(dataChannel, this.initiator);
	}
}