const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3768 });

const connections = [];

wss.on('connection', (ws) => {

	console.log("new connection");

	ws.pending = [];

	if(connections.length == 2){
		ws.close();
	}
	
	connections.push(ws);

	if(connections.length == 2){
		const other = connections[0];
		ws.other = other;
		other.other = ws;

		const currRandom = Math.floor(Math.random() * 10);
		let otherRandom = Math.floor(Math.random() * 10);

		while(otherRandom == currRandom){
			otherRandom = Math.floor(Math.random() * 10);
		}

		ws.send(JSON.stringify({
			type: 'random',
			mine: currRandom,
			other: otherRandom
		}));

		other.send(JSON.stringify({
			type: 'random',
			mine: otherRandom,
			other: currRandom
		}));

		console.log("Generated:", currRandom, otherRandom);

		if(other.missedMessage){
			ws.send(other.missedMessage);
		}
	}

	ws.on('message', (msg) => {
		console.log("received", msg);
		if(connections.length == 2){
			ws.other.send(msg);
		} else {
			ws.missedMessage = msg;
		}
	});
	ws.on('close', () => {
		console.log("Client disconnected");
		connections.splice(connections.indexOf(ws), 1);
		console.log("Connections left: " + connections.length);
	})
});