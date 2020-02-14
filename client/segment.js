class LineSegment{
	constructor(p1, p2){
		this.p1 = p1;
		this.p2 = p2;
	}

	draw(color) {
		stroke(color);
		strokeWeight(2);
		line(this.p1.x, this.p1.y, this.p2.x, this.p2.y)
		strokeWeight(1);
	}
}