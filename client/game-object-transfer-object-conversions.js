const vectorToCoordinates = ({x, y, z}) => ({x,y,z});

const coordinatesToVector = (coord, vec) => {
	vec.x = coord.x;
	vec.y = coord.y;
};