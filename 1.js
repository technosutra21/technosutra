// Constants for performance
const GOLDEN_ANGLE = Math.PI * (1 + Math.sqrt(5));
const TWO_PI = Math.PI * 2;

// Cache for precomputed sphere positions
let sphereCache = {
    gridSize: 0,
    staticData: [],
    positions: []
};

// Enhanced RotatingSmallerSphereSort with performance optimizations
export default function RotatingSmallerSphereSort(gridSize = 40, currentTime, controller) {
    // Guard against invalid gridSize
    if (gridSize <= 0) return [];
    
    const count = gridSize * gridSize;
    const center = gridSize / 2;
    const reducedRadius = gridSize / 3;
    const t = currentTime / 2000;

    // Rebuild cache only if gridSize changed
    if (sphereCache.gridSize !== gridSize) {
        sphereCache.gridSize = gridSize;
        sphereCache.staticData.length = 0;
        
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / count);
            const theta0 = GOLDEN_ANGLE * i;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            sphereCache.staticData.push({
                sinPhi,
                cosPhi,
                theta0,
                phase: i / count * TWO_PI
            });
        }
        
        // Resize positions array
        sphereCache.positions.length = count;
        for (let i = 0; i < count; i++) {
            sphereCache.positions[i] = {
                x: 0, y: 0, z: 0,
                depth: 0, opacity: 0, size: 0,
                angle: 0, phase: 0
            };
        }
    }

    // Add pulsing effect
    const pulse = 1 + 0.1 * Math.sin(currentTime / 1000);
    const finalRadius = reducedRadius * pulse;

    // Enhanced rotation angles
    const rotationAngle = t;
    const rotationY = t * 0.7;
    
    // Precompute rotation values
    const cosRotZ = Math.cos(rotationAngle);
    const sinRotZ = Math.sin(rotationAngle);
    const cosRotY = Math.cos(rotationY);
    const sinRotY = Math.sin(rotationY);

    // Update existing position objects instead of creating new ones
    for (let i = 0; i < count; i++) {
        const cached = sphereCache.staticData[i];
        const pos = sphereCache.positions[i];
        
        const theta = cached.theta0 + t;
        
        // Compute 3D position using cached values
        const x3d = cached.sinPhi * Math.cos(theta);
        const y3d = cached.sinPhi * Math.sin(theta);
        const z3d = cached.cosPhi;

        // Apply rotations using precomputed values
        const rotatedX = x3d * cosRotZ - z3d * sinRotZ;
        const rotatedZ = x3d * sinRotZ + z3d * cosRotZ;
        const rotatedY = y3d;
        
        const finalY = rotatedY * cosRotY - rotatedZ * sinRotY;
        const finalZ = rotatedY * sinRotY + rotatedZ * cosRotY;

        // Update position object in-place
        pos.x = center + rotatedX * finalRadius;
        pos.y = center + finalY * finalRadius;
        pos.z = finalZ;
        pos.depth = (finalZ + 1) * 0.5; // Normalize to 0-1
        pos.opacity = 0.3 + 0.7 * pos.depth;
        pos.size = 1 + 2 * pos.depth;
        pos.angle = theta;
        pos.phase = cached.phase;
    }

    return sphereCache.positions;
}

// Wrapper function for compatibility with HTML import
export function generatePositions(gridSize, time, controller) {
    const spherePositions = RotatingSmallerSphereSort(gridSize, time, controller);
    
    // Convert to normalized coordinates (0-1) for screen mapping
    return spherePositions.map(pos => ({
        x: pos.x / gridSize, // Normalize to 0-1
        y: pos.y / gridSize, // Normalize to 0-1
        depth: pos.depth,
        opacity: pos.opacity,
        size: pos.size
    }));
}

// Enhanced cosmic background generator with memory leak fixes
export function createCosmicBackground(canvas, ctx) {
    const nebulaClouds = [];
    const stars = [];
    let isDestroyed = false;
    
    // Create nebula clouds with cached gradients
    for (let i = 0; i < 8; i++) {
        const cloud = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 50 + Math.random() * 150,
            speed: 0.1 + Math.random() * 0.3,
            color: `hsl(${180 + Math.random() * 120}, 70%, 30%)`,
            opacity: 0.1 + Math.random() * 0.2,
            gradient: null,
            lastX: -1,
            lastY: -1,
            lastRadius: -1
        };
        nebulaClouds.push(cloud);
    }
    
    // Create distant stars with reduced count for performance
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5,
            twinkle: Math.random() * TWO_PI,
            speed: Math.random() * 0.02
        });
    }
    
    return {
        update(time) {
            if (isDestroyed) return;
            
            // Update nebula positions
            for (let i = 0; i < nebulaClouds.length; i++) {
                const cloud = nebulaClouds[i];
                cloud.x += Math.sin(time * cloud.speed) * 0.3;
                cloud.y += Math.cos(time * cloud.speed) * 0.2;
                
                // Wrap around
                if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
                if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
                if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
                if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;
            }
            
            // Update star twinkle with modulo to prevent overflow
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                star.twinkle = (star.twinkle + star.speed) % TWO_PI;
            }
        },
        
        draw(time) {
            if (isDestroyed) return;
            
            // Draw nebula clouds with cached gradients
            for (let i = 0; i < nebulaClouds.length; i++) {
                const cloud = nebulaClouds[i];
                
                // Only recreate gradient if position or radius changed significantly
                if (!cloud.gradient || 
                    Math.abs(cloud.x - cloud.lastX) > 5 ||
                    Math.abs(cloud.y - cloud.lastY) > 5 ||
                    Math.abs(cloud.radius - cloud.lastRadius) > 1) {
                    
                    cloud.gradient = ctx.createRadialGradient(
                        cloud.x, cloud.y, 0,
                        cloud.x, cloud.y, cloud.radius
                    );
                    cloud.gradient.addColorStop(0, cloud.color.replace('30%', '40%'));
                    cloud.gradient.addColorStop(0.6, cloud.color.replace('30%', '20%'));
                    cloud.gradient.addColorStop(1, 'transparent');
                    
                    cloud.lastX = cloud.x;
                    cloud.lastY = cloud.y;
                    cloud.lastRadius = cloud.radius;
                }
                
                ctx.save();
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = cloud.gradient;
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.radius, 0, TWO_PI);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw twinkling stars
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(star.twinkle));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, TWO_PI);
                ctx.fill();
                ctx.restore();
            }
        },
        
        resize() {
            if (isDestroyed) return;
            
            // Redistribute elements when canvas resizes and invalidate gradients
            for (let i = 0; i < nebulaClouds.length; i++) {
                const cloud = nebulaClouds[i];
                if (cloud.x > canvas.width) cloud.x = Math.random() * canvas.width;
                if (cloud.y > canvas.height) cloud.y = Math.random() * canvas.height;
                cloud.gradient = null; // Force gradient recreation
            }
            
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                if (star.x > canvas.width) star.x = Math.random() * canvas.width;
                if (star.y > canvas.height) star.y = Math.random() * canvas.height;
            }
        },
        
        destroy() {
            isDestroyed = true;
            // Clear arrays to help GC
            nebulaClouds.length = 0;
            stars.length = 0;
        }
    };
}