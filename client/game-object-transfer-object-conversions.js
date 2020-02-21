const vectorToCoordinates = ({x, y}) => ({x : x/resolutionRationToDefault,y : y/resolutionRationToDefault});

const coordinatesToVector = (coord, vec) => {
	vec.x = coord.x * resolutionRationToDefault;
	vec.y = coord.y * resolutionRationToDefault;
};