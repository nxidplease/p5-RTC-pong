const PADDLE_WIDTH = 30;
const PADDLE_HEIGHT = 150;
const PADDLE_MARGIN = 20;
const CONTROL_ACCEL = 0.0025;
const MAX_VEL = 0.75;
const REATAINED_VEL = 0.9;

class Paddle{
	constructor(pos, id){
		this.id = id;
		this.pos = pos;
		this.vel = createVector(0,0);
		this.acc = createVector(0,0);
		this.clr = color(0, 170, 0);
	}

	get rightEdge(){
		return new LineSegment({
			x: this.pos.x + PADDLE_WIDTH/2,
			y: this.pos.y + PADDLE_HEIGHT/2
		},{
			x: this.pos.x + PADDLE_WIDTH/2,
			y: this.pos.y - PADDLE_HEIGHT/2
		});
	}

	get leftEdge(){
		return new LineSegment({
			x: this.pos.x - PADDLE_WIDTH/2,
			y: this.pos.y + PADDLE_HEIGHT/2
		},{
			x: this.pos.x - PADDLE_WIDTH/2,
			y: this.pos.y - PADDLE_HEIGHT/2
		});
	}

	get topEdge(){
		return new LineSegment({
			x: this.pos.x - PADDLE_WIDTH/2,
			y: this.pos.y - PADDLE_HEIGHT/2
		},{
			x: this.pos.x + PADDLE_WIDTH/2,
			y: this.pos.y - PADDLE_HEIGHT/2
		});
	}

	get bottomEdge(){
		return new LineSegment({
			x: this.pos.x - PADDLE_WIDTH/2,
			y: this.pos.y + PADDLE_HEIGHT/2
		},{
			x: this.pos.x + PADDLE_WIDTH/2,
			y: this.pos.y + PADDLE_HEIGHT/2
		});
	}

	reset(){
		this.pos.y = height/2;
		this.vel.mult(0);
		this.acc.mult(0);
	}

	peerUpdate(msg){
		coordinatesToVector(msg.pos, this.pos);
		coordinatesToVector(msg.vel, this.vel);
		coordinatesToVector(msg.acc, this.acc);
	}

	update(dt){
		this.vel.add(p5.Vector.mult(this.acc, dt));
		this.vel.limit(MAX_VEL);

		if(this.acc.y == 0){
			this.vel.mult(REATAINED_VEL);
		}

		this.pos.add(p5.Vector.mult(this.vel, dt));

		if(this.pos.y < PADDLE_HEIGHT / 2){
			this.pos.y = PADDLE_HEIGHT / 2;
		}

		if(this.pos.y > height - PADDLE_HEIGHT / 2){
			this.pos.y = height - PADDLE_HEIGHT / 2;
		}
	}

	draw(){
		fill(this.clr);
		stroke(0);
		rect(this.pos.x, this.pos.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	}

	up(dt){
		this.acc.y = -CONTROL_ACCEL * dt;
	}

	down(dt){
		this.acc.y = CONTROL_ACCEL * dt;
	}
}