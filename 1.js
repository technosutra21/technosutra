// Enhanced RotatingSmallerSphereSort with improved visual effects
export default function RotatingSmallerSphereSort(gridSize, currentTime, controller) {
    const positions = [];
    const center = gridSize / 2;
    const reducedRadius = gridSize / 3; // Make the sphere smaller
    const t = currentTime / 2000;

    // Add pulsing effect
    const pulse = 1 + 0.1 * Math.sin(currentTime / 1000);
    const finalRadius = reducedRadius * pulse;

    for (let i = 0; i < gridSize * gridSize; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / (gridSize * gridSize));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t; // Adding time-based rotation

        const x3d = Math.sin(phi) * Math.cos(theta);
        const y3d = Math.sin(phi) * Math.sin(theta);
        const z3d = Math.cos(phi);

        // Enhanced rotation with multiple axes
        const rotationAngle = t;
        const rotationY = t * 0.7; // Different speed for Y rotation
        
        // Rotate around the y-axis first
        let rotatedX = x3d * Math.cos(rotationAngle) - z3d * Math.sin(rotationAngle);
        let rotatedZ = x3d * Math.sin(rotationAngle) + z3d * Math.cos(rotationAngle);
        let rotatedY = y3d;
        
        // Then rotate around X-axis for more complex movement
        const finalY = rotatedY * Math.cos(rotationY) - rotatedZ * Math.sin(rotationY);
        const finalZ = rotatedY * Math.sin(rotationY) + rotatedZ * Math.cos(rotationY);

        const projectedX = center + rotatedX * finalRadius;
        const projectedY = center + finalY * finalRadius;

        // Add depth-based opacity and size
        const depth = (finalZ + 1) / 2; // Normalize to 0-1
        const opacity = 0.3 + 0.7 * depth;
        const size = 1 + 2 * depth;

        positions.push({ 
            x: projectedX, 
            y: projectedY, 
            z: finalZ,
            depth: depth,
            opacity: opacity,
            size: size,
            angle: theta,
            phase: i / (gridSize * gridSize) * Math.PI * 2
        });
    }

    return positions;
}

// Enhanced cosmic background generator
export function createCosmicBackground(canvas, ctx) {
    const nebulaClouds = [];
    const stars = [];
    
    // Create nebula clouds
    for (let i = 0; i < 8; i++) {
        nebulaClouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 50 + Math.random() * 150,
            speed: 0.1 + Math.random() * 0.3,
            color: `hsl(${180 + Math.random() * 120}, 70%, 30%)`,
            opacity: 0.1 + Math.random() * 0.2
        });
    }
    
    // Create distant stars
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02
        });
    }
    
    return {
        update(time) {
            // Update nebula positions
            nebulaClouds.forEach(cloud => {
                cloud.x += Math.sin(time * cloud.speed) * 0.3;
                cloud.y += Math.cos(time * cloud.speed) * 0.2;
                
                // Wrap around
                if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
                if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
                if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
                if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;
            });
            
            // Update star twinkle
            stars.forEach(star => {
                star.twinkle += star.speed;
            });
        },
        
        draw(time) {
            // Draw nebula clouds
            nebulaClouds.forEach(cloud => {
                const gradient = ctx.createRadialGradient(
                    cloud.x, cloud.y, 0,
                    cloud.x, cloud.y, cloud.radius
                );
                gradient.addColorStop(0, cloud.color.replace('30%', '40%'));
                gradient.addColorStop(0.6, cloud.color.replace('30%', '20%'));
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            
            // Draw twinkling stars
            stars.forEach(star => {
                const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(star.twinkle));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        },
        
        resize() {
            // Redistribute elements when canvas resizes
            nebulaClouds.forEach(cloud => {
                if (cloud.x > canvas.width) cloud.x = Math.random() * canvas.width;
                if (cloud.y > canvas.height) cloud.y = Math.random() * canvas.height;
            });
            stars.forEach(star => {
                if (star.x > canvas.width) star.x = Math.random() * canvas.width;
                if (star.y > canvas.height) star.y = Math.random() * canvas.height;
            });
        }
    };
}
