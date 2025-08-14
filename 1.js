// Enhanced RotatingSmallerSphereSort with color variations
export default function RotatingSmallerSphereSort(gridSize, currentTime, controller) {
    const particles = [];
    const center = gridSize / 2;
    const reducedRadius = gridSize / 3;
    const t = currentTime / 2000;

    for (let i = 0; i < gridSize * gridSize; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / (gridSize * gridSize));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t;

        const x3d = Math.sin(phi) * Math.cos(theta);
        const y3d = Math.sin(phi) * Math.sin(theta);
        const z3d = Math.cos(phi);

        // Rotate around the y-axis
        const rotationAngle = t;
        const rotatedX = x3d * Math.cos(rotationAngle) - z3d * Math.sin(rotationAngle);
        const rotatedZ = x3d * Math.sin(rotationAngle) + z3d * Math.cos(rotationAngle);

        const projectedX = center + rotatedX * reducedRadius;
        const projectedY = center + y3d * reducedRadius;

        // Add depth-based alpha and color variations
        const depth = (rotatedZ + 1) / 2; // Normalize to 0-1
        const alpha = 0.3 + depth * 0.7;
        const hue = (i / (gridSize * gridSize)) * 360 + t * 10;

        particles.push({ 
            x: projectedX, 
            y: projectedY, 
            alpha,
            depth,
            hue,
            size: 1 + depth * 2
        });
    }

    return particles;
}

// Export additional utility functions
export const easing = {
    sineInOut: (t) => 0.5 * (1 - Math.cos(Math.PI * t)),
    quadInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    elastic: (t) => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
};