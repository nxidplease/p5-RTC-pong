const vectorToCoordinates = ({x, y}) => ({x : x/width,y : y/height});

const coordinatesToVector = (coord, vec) => {
	vec.x = coord.x * width;
	vec.y = coord.y * height;
};