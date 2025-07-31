// RotatingSmallerSphereSort
export default function RotatingSmallerSphereSort(gridSize, currentTime, controller) {
    const positions = [];
    const center = gridSize / 2;
    const reducedRadius = gridSize / 3; // Make the sphere smaller
    const t = currentTime / 2000;

    for (let i = 0; i < gridSize * gridSize; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / (gridSize * gridSize));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t; // Adding time-based rotation

        const x3d = Math.sin(phi) * Math.cos(theta);
        const y3d = Math.sin(phi) * Math.sin(theta);
        const z3d = Math.cos(phi);

        // Rotate around the y-axis
        const rotationAngle = t;
        const rotatedX = x3d * Math.cos(rotationAngle) - z3d * Math.sin(rotationAngle);
        const rotatedZ = x3d * Math.sin(rotationAngle) + z3d * Math.cos(rotationAngle);

        const projectedX = center + rotatedX * reducedRadius;
        const projectedY = center + y3d * reducedRadius;

        positions.push({ x: projectedX, y: projectedY });
    }

    return positions;
}
