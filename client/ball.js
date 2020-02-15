const BALL_RADIUS = 17;
const vecMult = p5.Vector.mult;
const vecAdd = p5.Vector.add;
const BALL_SPEED = 0.85;
const MINIMUM_X_COMP = 0.45;

const SCORE_RESULT = {
	NO_SCORE: 0,
	LEFT_SCORED: 1,
	RIGHT_SCORED: 2
}

class Ball {
	constructor(pos){
		this.reset(pos)
		this.color = color(175,0,0);
	}

	reset(pos){
		this.pos = pos;
		this.vel = vecMult(this.generateVel(), BALL_SPEED);
	}

	generateVel(){
		let vel = p5.Vector.random2D();
		while(Math.abs(vel.x) < MINIMUM_X_COMP){
			vel = p5.Vector.random2D();
		}

		return vel;
	}

	checkCollision(leftPaddle, rightPaddle, dt){
		const adjustedPos = vecAdd(this.pos, vecMult(this.vel, BALL_RADIUS));
		const currPosToNextPos = this.pointToNextPoint(adjustedPos, dt);

		this.collideWithPaddle(currPosToNextPos, leftPaddle, true);
		this.collideWithPaddle(currPosToNextPos, rightPaddle, false);
	}

	scoreResult() {
		if(this.pos.x < 0){
			return SCORE_RESULT.RIGHT_SCORED;
		} else if(this.pos.x > width){
			return SCORE_RESULT.LEFT_SCORED;
		} else {
			return SCORE_RESULT.NO_SCORE;
		}
	}

	collideWithPaddle(currPosToNextPos, p, isLeft){
		const verticalEdge = isLeft ? p.rightEdge : p.leftEdge;

		if(segmentsIntersect(verticalEdge, currPosToNextPos)){
			this.vel.x *= -1;

			if(this.vel.y * p.vel.y > 0){
				this.vel.y *= 1.5;
				this.vel.limit(BALL_SPEED);
			} 
			else if(this.vel.y * p.vel.y < 0){
				this.vel.y *= 0.5;
			} else if(p.vel.y == 0 && Math.abs(this.vel.y) < Number.EPSILON) {
				this.vel.y = p.vel.y;
				this.vel.limit(BALL_SPEED);
			}

		} else if(segmentsIntersect(p.topEdge, currPosToNextPos) || 
				  segmentsIntersect(p.bottomEdge, currPosToNextPos)){
			this.vel.y *= -1;
		}
	}

	pointToNextPoint(p, dt){
		return new LineSegment(p, vecAdd(p, vecMult(this.vel, dt)));
	}

	peerUpdate(msg){
		coordinatesToVector(msg.pos, this.pos);
		coordinatesToVector(msg.vel, this.vel);
	}

	update(dt){
		const overBot = this.pos.y + this.vel.y + BALL_RADIUS > height;
		const overTop = this.pos.y + this.vel.y - BALL_RADIUS < 0;
		if(overTop || overBot){
			this.vel.y *= -1;
		}

		this.pos.add(p5.Vector.mult(this.vel, dt));
	}

	draw(){
		fill(this.color);
		noStroke();
		circle(this.pos.x, this.pos.y, BALL_RADIUS * 2);
	}
}