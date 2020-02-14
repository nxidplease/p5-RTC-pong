const SYNC_REQUESTS = 100;

let p2p;

class P2P{
	constructor(wsService, initiator = false){
		this.rtc = new RTCPeerConnection();
		this.wsService = wsService;
		this.initiator = initiator;
		this.registerHandlers();
	}
	
	registerHandlers(){
		this.rtc.onicecandidate = this.handleICECandidateEvent;
		this.rtc.onnegotiationneeded = this.handleNegotiationNeededEvent;
		
		if(this.initiator){
			this.handleDataChannel(this.rtc.createDataChannel("gameData"));
		} else {
			this.rtc.ondatachannel = (ev) => this.handleDataChannel(ev.channel);
		}
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