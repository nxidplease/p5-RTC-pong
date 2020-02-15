let ball;
let userID;
let userPaddle;
let initiator;
let serverAddressInput;
let userNameInput;
let inputDiv;
let messanger;
const paddles = {};
const MOVE_UP = 38;
const MOVE_DOWN = 40;
const ENTER = 13;
const SPACE = 32;
const INTERVAL_TIME = 5;

const START_DELAY = 10;

const GAME_STATE = {
	NAME_INPUT: 0,
	WAITING_FOR_CONNECTION: 1,
	TIME_SYNC: 2,
	WAITING_FOR_START: 3,
	WAITING_FOR_OTHER_READY: 4,
	WAITING_FOR_INITIATOR_START: 5,
	COUNTDOWN: 6,
	PLAYING: 7,
	SCORE_INTERVAL: 8
};


let timeToStart;
let state = GAME_STATE.NAME_INPUT;
let lastScoreMillis;
let lastScoreResult;

function setup() {
	noLoop();
	resizeCanvas(0,0);
	userNameInput = select('#username');
	serverAddressInput = select('#serverAddress');
	inputDiv = select('#input');
	inputDiv.child(userNameInput);
	inputDiv.child(serverAddressInput);
}

function setupGame(leftUserName, rightUserName){
	ball = new Ball(createVector(width/2, height/2));
	paddles.left = new Paddle(createVector(PADDLE_WIDTH/2 + PADDLE_MARGIN, height/2), leftUserName);
	paddles.right = new Paddle(createVector(width - (PADDLE_WIDTH/2 + PADDLE_MARGIN), height/2), rightUserName);
	rectMode(CENTER);
}

function resetBall(){
	ball = new Ball(createVector(width/2, height/2));
}

function resetGame(){
	Object.values(paddles).forEach((p) => p.reset());
	resetBall();
}

async function keyReleased(){
	switch(state){
		case GAME_STATE.NAME_INPUT:{
			if(keyCode === ENTER){
				const inputNotEmpty = input => input.value().trim().length > 0
				if(inputNotEmpty(userNameInput) && inputNotEmpty(serverAddressInput)){
					messanger = new WsService(userNameInput.value(), serverAddressInput.value());
					inputDiv.remove();
					createCanvas(windowWidth, windowHeight);
					loop();
					state = GAME_STATE.WAITING_FOR_CONNECTION;
					Promise.all([messanger.numsReceieved, messanger.otherNameReceived])
					.then(() => {
						initiator = me.num > other.num;
						if(initiator){
							setupGame(me.name, other.name);
							userPaddle = paddles.left;
							p2p = new P2P(messanger, initiator);
						} else {
							setupGame(other.name, me.name);
							userPaddle = paddles.right;
						}
					})
				} else {
					alert("Name and server address can't be empty")
				}
			}
			break;
		}
		case GAME_STATE.WAITING_FOR_START:{
			if(keyCode === SPACE){
				gameDataChannel.sendReadyToPeer();
				state = GAME_STATE.WAITING_FOR_OTHER_READY;
				await gameDataChannel.otherReady;
				state = GAME_STATE.WAITING_FOR_INITIATOR_START;
				if(initiator){
					gameDataChannel.scheduleStart(START_DELAY);
				}
			}
			break;
		}
	}
}

function draw() {
	background(150);

	switch(state){
		case GAME_STATE.WAITING_FOR_CONNECTION:{
			waitingForConnection();
			break;
		}
		case GAME_STATE.TIME_SYNC:{
			timeSync();
			break;
		}
		case GAME_STATE.COUNTDOWN:{
			countDown();
			break;
		}
		case GAME_STATE.WAITING_FOR_OTHER_READY:{
			waitingForOtherReady();
			break;
		}
		case GAME_STATE.WAITING_FOR_START:{
			waitingForStart();
			break;
		}
		case GAME_STATE.PLAYING: {
			playing();
			break;
		}
		case GAME_STATE.SCORE_INTERVAL: {
			scoreInterval();
			break;
		}
	}
}

function drawGameObjects(){
	Object.values(paddles).forEach((p) => { 
		p.draw();
	});
	ball.draw();
}

function waitingForConnection(){
	centeredTxt("Waiting for opponent to connect...");
}

function timeSync(){
	centeredTxt(`You control the ${initiator?'left':'right'} paddle`, height/4);
	centeredTxt(`Hi ${me.name}, you're connected to ${other.name}`, 3 * height/4);
	const centerTxt = gameDataChannel.rtt ? `RTT is ${gameDataChannel.rtt}ms` : 'Syncing Time...';
	centeredTxt(centerTxt);
}

function waitingForStart(){
	drawGameObjects();
	centeredTxt(`You control the ${initiator?'left':'right'} paddle`, height/4);
	centeredTxt("Press SPACE to ready up");
	centeredTxt(`Hi ${me.name}, you're connected to ${other.name}`, 3 * height/4);
}

function waitingForOtherReady(){
	drawGameObjects();
	centeredTxt(`You control the ${initiator?'left':'right'} paddle`, height/4);
	centeredTxt("Waiting for opponent ready");
	centeredTxt(`Hi ${me.name}, you're connected to ${other.name}`, 3 * height/4);
}

function countDown(){
	const timeLeft = (timeToStart - new Date().getTime()) / 1000;

	const countDown = Math.round(timeLeft);

	if(countDown <= 0){
		state = GAME_STATE.PLAYING;
	} else {
		drawGameObjects();
		const txt = "Game start in " + countDown;
		centeredTxt(txt);
	}	
}

function playing(){
	const dtSec = deltaTime;
	handleControls(userPaddle, dtSec);
	Object.values(paddles).forEach((p) => {
		p.update(dtSec) 
		p.draw();
	});
	
	
	ball.checkCollision(paddles.left, paddles.right, dtSec);
	ball.update(dtSec);
	ball.draw();
	if(initiator){
		gameDataChannel.sendPaddleUpdate(paddles.left);
		gameDataChannel.sendBallUpdate();
	} else {
		gameDataChannel.sendPaddleUpdate(paddles.right);
	}

	if(initiator){
		lastScoreResult = ball.scoreResult();
	
		if(lastScoreResult !== SCORE_RESULT.NO_SCORE){
			lastScoreMillis = new Date().getTime();
			gameDataChannel.sendScore(lastScoreResult, lastScoreMillis);
			state = GAME_STATE.SCORE_INTERVAL;
			resetGame();
		}

	}


	fill(0);
	textSize(32)
	text(Math.round(frameRate()), width /2, 32);
}

function scoreInterval(){
	const timeSinceScore = (new Date().getTime() - lastScoreMillis) / 1000;

	const countDown = Math.round(INTERVAL_TIME - timeSinceScore);

	if(countDown <= 0){
		state = GAME_STATE.PLAYING;
	} else {
		drawGameObjects();
		const scorer = lastScoreResult === SCORE_RESULT.LEFT_SCORED ? "Left" : "Right";
		const scoredTxt = scorer + " scored!";
		const txt = "Game start in " + countDown;
		centeredTxt(txt);
		centeredTxt(scoredTxt, height/4);
	}
}

function centeredTxt(txt, h = height/2, size = 80){
	stroke(0);
	fill(0);
	textSize(size);
	text(txt, width/2 - textWidth(txt)/2, h);
}

function handleControls(p, dtSec){
	if(keyIsDown(MOVE_UP) || 
	   keyIsDown(MOVE_DOWN)){
		keyIsDown(MOVE_UP) ? p.up(dtSec): p.down(dtSec);
	} else {
		p.acc.y = 0;
	}
}