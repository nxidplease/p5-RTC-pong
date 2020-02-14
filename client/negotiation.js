let me = {};
let other = {};

class WsService{
	constructor(userName, negotiationEndpoint){
		this.socket = new WebSocket(`ws://${negotiationEndpoint}`);
		this.socket.addEventListener('open', () =>{
			me.name = userName;
		
			this.sendMsg({
				type: 'username',
				name: userName
			});
		});

		this.numsReceieved = new Promise((resolve)=> {
			this.numsResolve = resolve;
		})

		this.otherNameReceived = new Promise((resolve) => {
			this.otherNameResolve = resolve;
		})
		
		this.socket.addEventListener('message', (ev) => {
			const msg = JSON.parse(ev.data);

			switch(msg.type){
				case 'username':{
					other.name = msg.name;
					this.otherNameResolve();
					break;
				}
				case 'random': {
					me.num = msg.mine;
					other.num = msg.other;
					this.numsResolve();
					break;
				}
				case 'com-offer':{
					this.handleComOffer(msg);
					break;
				}
				case 'com-answer':{
					this.handleComAnswer(msg);
					break;
				}
				case 'new-ice-candidate':{
					this.handleNewIceCandidate(msg);
					break;
				}
			}
		});

		
		
	}
	
	sendMsg(obj){
		this.socket.send(JSON.stringify(obj));
	}

	handleComOffer(msg) {
		console.log("I'm answering!");
		p2p = new P2P(this);
		const remoteSDP = new RTCSessionDescription(msg.sdp);
		const rtc = p2p.rtc;
		rtc.setRemoteDescription(remoteSDP)
		.then(() => rtc.createAnswer())
		.then((ans) => rtc.setLocalDescription(ans))
		.then(() => this.sendMsg({
				type: 'com-answer',
				sdp: rtc.localDescription
			}));
	};

	handleNewIceCandidate(msg){
		const iceCandidate = new RTCIceCandidate(msg.candidate);
		p2p.rtc.addIceCandidate(iceCandidate);
	}
	
	handleComAnswer(msg){
		console.log("Remote answered!")
		p2p.rtc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
	}
}
