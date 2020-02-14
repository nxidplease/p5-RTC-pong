const eps = 0.0000001;
function between(a, b, c) {
    return a-eps <= b && b <= c+eps;
}
function intersects(a,b,c,d,p,q,r,s) {
	const det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
	  return false;
	} else {
	  const lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
	  const gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
	  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
  };

function segmentsIntersect(seg1, seg2){
	return intersects(seg1.p1.x, seg1.p1.y,seg1.p2.x, seg1.p2.y,seg2.p1.x, seg2.p1.y,seg2.p2.x, seg2.p2.y);
}