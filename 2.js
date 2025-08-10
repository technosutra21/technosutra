// Enhanced particle and animation controller for Techno Sutra background effects
export function createAnimationController() {
    let idCounter = 0;
    const animationsToDelete = []; // Avoid deleting during iteration
    
    return {
        baseDuration: 2000,
        baseInterval: 100,
        animations: new Map(),
        
        addAnimation(shape, type, options = {}) {
            // Use incrementing counter instead of Math.random() for better ID uniqueness
            const animationId = options.id ?? `${shape.id || ++idCounter}_${type}`;
            const animation = {
                id: animationId,
                shape,
                type,
                duration: options.duration ?? this.baseDuration, // Fix undefined duration
                ...options,
                startTime: performance.now(),
                isActive: true
            };
            
            this.animations.set(animationId, animation);
            
            if (options.onStart) {
                options.onStart(animation);
            }
            
            return animationId;
        },
        
        updateAnimations(currentTime) {
            animationsToDelete.length = 0;
            
            // Use for-of instead of forEach to avoid iteration issues
            for (const [id, animation] of this.animations) {
                if (!animation.isActive) continue;
                
                const elapsed = currentTime - animation.startTime;
                const progress = Math.min(elapsed / animation.duration, 1);
                
                // Apply easing
                let easedProgress = progress;
                if (animation.easing) {
                    easedProgress = this.applyEasing(progress, animation.easing);
                }
                
                // Update shape based on animation type
                if (animation.type === 'scale') {
                    const scale = animation.from + (animation.to - animation.from) * easedProgress;
                    if (animation.shape.setScale) {
                        animation.shape.setScale(scale);
                    }
                }
                
                if (animation.onUpdate) {
                    animation.onUpdate(animation);
                }
                
                // Check if animation is complete
                if (progress >= 1) {
                    if (animation.yoyo && !animation.reversed) {
                        // Reverse the animation
                        animation.reversed = true;
                        animation.startTime = currentTime;
                        const temp = animation.from;
                        animation.from = animation.to;
                        animation.to = temp;
                    } else if (animation.loop) {
                        // Restart the animation
                        animation.startTime = currentTime;
                        animation.reversed = false;
                    } else {
                        // Animation complete - mark for deletion
                        if (animation.onComplete) {
                            animation.onComplete(animation);
                        }
                        animationsToDelete.push(id);
                    }
                }
            }
            
            // Delete completed animations after iteration
            for (const id of animationsToDelete) {
                this.animations.delete(id);
            }
        },
        
        applyEasing(t, easingType) {
            switch (easingType) {
                case 'sineInOut':
                    return -(Math.cos(Math.PI * t) - 1) / 2;
                case 'quadInOut':
                    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                case 'cubicInOut':
                    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                default:
                    return t; // Linear
            }
        },
        
        removeAnimation(id) {
            this.animations.delete(id);
        },
        
        clearAnimations() {
            this.animations.clear();
        }
    };
}

// Enhanced particle system for background effects with performance optimizations
export function createParticleSystem(canvas, ctx) {
    const particles = [];
    const maxParticles = 100; // Reduced for better performance
    const gradientCache = new Map(); // Cache gradients by size
    let lastFrameTime = 0;
    let isDestroyed = false;
    
    // Pre-render particle sprite for better performance
    function createParticleSprite(size, intensity) {
        const spriteSize = size * 8;
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = spriteSize;
        spriteCanvas.height = spriteSize;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        const gradient = spriteCtx.createRadialGradient(
            spriteSize/2, spriteSize/2, 0,
            spriteSize/2, spriteSize/2, size * 4
        );
        gradient.addColorStop(0, `rgba(0, 255, 149, ${intensity})`);
        gradient.addColorStop(0.4, `rgba(157, 0, 255, ${intensity * 0.6})`);
        gradient.addColorStop(1, 'rgba(0, 255, 149, 0)');
        
        spriteCtx.fillStyle = gradient;
        spriteCtx.beginPath();
        spriteCtx.arc(spriteSize/2, spriteSize/2, size * 4, 0, Math.PI * 2);
        spriteCtx.fill();
        
        // Add bright center
        spriteCtx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
        spriteCtx.beginPath();
        spriteCtx.arc(spriteSize/2, spriteSize/2, size * 0.5, 0, Math.PI * 2);
        spriteCtx.fill();
        
        return spriteCanvas;
    }
    
    class Particle {
        constructor() {
            this.reset(true); // Initialize with random life
        }
        
        reset(randomLife = false) {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.life = randomLife ? Math.random() : 1;
            this.maxLife = 3 + Math.random() * 2;
            this.size = 1 + Math.random() * 2;
            this.twinkle = Math.random() * Math.PI * 2;
            this.twinkleSpeed = 0.02 + Math.random() * 0.03;
            this.sprite = null;
            this.lastIntensity = -1;
        }
        
        update(deltaTime) {
            if (isDestroyed) return;
            
            this.x += this.vx * deltaTime * 60; // Normalize for 60fps
            this.y += this.vy * deltaTime * 60;
            this.life -= deltaTime * 0.002; // Frame-rate independent
            this.twinkle = (this.twinkle + this.twinkleSpeed * deltaTime * 60) % (Math.PI * 2);
            
            // Wrap around screen
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
            
            if (this.life <= 0) {
                this.reset();
            }
        }
        
        draw() {
            if (isDestroyed) return;
            
            const alpha = this.life * (0.5 + 0.5 * Math.sin(this.twinkle));
            const intensity = 0.3 + 0.7 * Math.sin(this.twinkle);
            
            // Create or reuse sprite if intensity changed significantly
            if (!this.sprite || Math.abs(intensity - this.lastIntensity) > 0.1) {
                this.sprite = createParticleSprite(this.size, intensity);
                this.lastIntensity = intensity;
            }
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.8;
            ctx.drawImage(
                this.sprite,
                this.x - this.size * 4,
                this.y - this.size * 4
            );
            ctx.restore();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    return {
        update(currentTime) {
            if (isDestroyed) return;
            
            const deltaTime = lastFrameTime ? (currentTime - lastFrameTime) / 1000 : 0.016;
            lastFrameTime = currentTime;
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update(deltaTime);
            }
        },
        
        draw() {
            if (isDestroyed) return;
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].draw();
            }
        },
        
        resize() {
            if (isDestroyed) return;
            
            // Redistribute particles when canvas resizes
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];
                if (particle.x > canvas.width) particle.x = Math.random() * canvas.width;
                if (particle.y > canvas.height) particle.y = Math.random() * canvas.height;
            }
        },
        
        destroy() {
            isDestroyed = true;
            particles.length = 0;
            gradientCache.clear();
        }
    };
}