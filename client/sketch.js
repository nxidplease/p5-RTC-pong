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

const DEFAULT_WIDTH = 2560;
const DEFAULT_HEIGHT = 1440;

const resolutions = [{
	w: 2560,
	h: 1440
},{
	w: 2048,
	h: 1152
},{
	w: 1920, 
	h: 1080
},{
	w: 1600,
	h: 900
},{
	w: 1366,
	h: 768
},{
	w: 1280,
	h: 720
},{
	w: 1024,
	h: 575
},{
	w: 960,
	h: 854
},{
	w: 854,
	h: 480
},{
	w: 848,
	h: 480
},{
	w: 800,
	h: 450
},{
	w: 768,
	h: 432
},{
	w: 640,
	h: 360
},{
	w: 426,
	h: 240
},{
	w: 256,
	h: 144
}];

let resolutionRationToDefault;

const START_DELAY = 5;

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
let scorer;

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
	ball.reset(createVector(width/2, height/2));
}

function resetGame(){
	Object.values(paddles).forEach((p) => p.reset());
	resetBall();
}

function chooseRes(){
	for(let i = 0; i < resolutions.length; i++){
		const r = resolutions[i];
		if((i == resolutions.length - 1) || 
			((r.w <= windowWidth) && 
			 (r.h <= windowHeight))){
				 return r;
			 }
	}
}

function setupCanvas(){
	const r = chooseRes();
	resolutionRationToDefault = r.w / DEFAULT_WIDTH;
	createCanvas(r.w, r.h);
	console.log(width, height, resolutionRationToDefault);
}

async function keyReleased(){
	switch(state){
		case GAME_STATE.NAME_INPUT:{
			if(keyCode === ENTER){
				audio = new AudioContext();
				const inputNotEmpty = input => input.value().trim().length > 0;
				if(inputNotEmpty(userNameInput) && inputNotEmpty(serverAddressInput)){
					messanger = new WsService(userNameInput.value(), serverAddressInput.value());
					inputDiv.remove();
					setupCanvas();
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

function drawBounds(){
	push();
	stroke(0);
	strokeWeight(2);
	noFill();
	rect(width/2, height/2, width, height);
	pop();
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
	drawBounds();
	drawGameObjects();
	centeredTxt(`You control the ${initiator?'left':'right'} paddle`, height/4);
	centeredTxt("Press SPACE to ready up");
	centeredTxt(`Hi ${me.name}, you're connected to ${other.name}`, 3 * height/4);
}

function waitingForOtherReady(){
	drawBounds();
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
		drawBounds();
		drawGameObjects();
		const txt = "Game starts in " + countDown;
		centeredTxt(txt);
	}	
}

function playing(){
	drawBounds();
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
		const scoreResult = ball.scoreResult();
	
		if(scoreResult !== SCORE_RESULT.NO_SCORE){
			const leftScored = scoreResult === SCORE_RESULT.LEFT_SCORED;
			scorer = leftScored ? me.name : other.name;
			lastScoreMillis = new Date().getTime();
			resetGame();
			gameDataChannel.sendScore(scorer,lastScoreMillis);
			gameDataChannel.sendBallUpdate();
			state = GAME_STATE.SCORE_INTERVAL;
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
		drawBounds();
		drawGameObjects();
		const scoredTxt = scorer + " scored!";
		const txt = "Game starts in " + countDown;
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