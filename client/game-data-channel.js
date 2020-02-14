const PeerMsgType = {
	TimeSync: 0,
	TimeAck: 1,
	RTT: 2,
	Ready: 3,
	BallUpdate: 4,
	PaddleUpdate: 5
}

let gameDataChannel;

class GameDataChannel{
	constructor(dataChannel, initiator){
		this.ch = dataChannel;
		this.ch.onmessage = this.messageHandler;
		this.ch.onopen = initiator ? this.initiatorDataChannelOpenHandler : () => state = GAME_STATE.TIME_SYNC;		
		this.otherReady = new Promise((resolve) => {
			this.otherReadyResolve = resolve;
		});
		this.syncsRemaining = SYNC_REQUESTS;
		this.timeDiffSum = 0;
	}
	
	initiatorDataChannelOpenHandler = () => {
		state = GAME_STATE.TIME_SYNC
		this.setSyncStartAndSendTimeSync();
	}
	
	messageHandler = (ev) => {
		const msg = JSON.parse(ev.data);
		switch(msg.type){
			case PeerMsgType.TimeSync:{
				this.sendTimeAck();
				break;
			}
			case PeerMsgType.TimeAck:{
				this.handleTimeAck();
				break;
			}
			case PeerMsgType.RTT:{
				this.rtt = msg.rtt;
				//state = GAME_STATE.WAITING_FOR_OTHER_READY;
				break;
			}
			case PeerMsgType.Ready: {
				this.otherReadyResolve();
				break;
			}
			case PeerMsgType.BallUpdate: {
				this.handleBallUpdate(msg);
				break;
			}
			case PeerMsgType.PaddleUpdate: {
				this.handlePaddleUpdate(msg);
				break;
			}
		}
	};

	setSyncStartAndSendTimeSync(){
		this.syncsRemaining--;
		this.timeSyncStart = new Date().getTime();
		this.sendToPeer({
			type: PeerMsgType.TimeSync,
			time: this.timeSyncStart
		});
	}

	

	handleTimeAck(){
		const now = new Date().getTime();
		this.timeDiffSum += (now - this.timeSyncStart);

		if(this.syncsRemaining > 0){
			this.setSyncStartAndSendTimeSync()
		} else {
			this.rtt = this.timeDiffSum / SYNC_REQUESTS;
			this.sendToPeer({
				type: PeerMsgType.RTT,
				rtt: this.rtt
			})
		}
	}

	sendTimeAck(){
		this.sendToPeer({
			type: PeerMsgType.TimeAck
		})
	}

	sendReadyToPeer(){
		this.sendToPeer({
			type: PeerMsgType.Ready
		});
	}

	handleBallUpdate(msg){
		ball.peerUpdate(msg.ball);
	}
	
	handlePaddleUpdate(msg){
		if(userLeft){
			paddles.right.peerUpdate(msg.paddle);
		} else {
			paddles.left.peerUpdate(msg.paddle);
		}
	}
	
	sendPaddleUpdate(paddle){
		this.sendToPeer({
			type: PeerMsgType.PaddleUpdate,
			paddle: {
				pos: vectorToCoordinates(paddle.pos),
				vel: vectorToCoordinates(paddle.vel),
				acc: vectorToCoordinates(paddle.acc)
			}
		});
	}
	
	sendBallUpdate() {
		this.sendToPeer({
			type: PeerMsgType.BallUpdate,
			ball: {
				pos: vectorToCoordinates(ball.pos),
				vel: vectorToCoordinates(ball.vel)
			}
		});
	}
	
	sendToPeer(obj){
		this.ch.send(JSON.stringify(obj));
	}
}