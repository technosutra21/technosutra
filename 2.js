// Enhanced particle and animation controller for Techno Sutra background effects
export function createAnimationController() {
    return {
        baseDuration: 2000,
        baseInterval: 100,
        animations: new Map(),
        
        addAnimation(shape, type, options) {
            const animationId = `${shape.id || Math.random()}_${type}`;
            const animation = {
                id: animationId,
                shape,
                type,
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
            this.animations.forEach((animation, id) => {
                if (!animation.isActive) return;
                
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
                        // Animation complete
                        if (animation.onComplete) {
                            animation.onComplete(animation);
                        }
                        this.animations.delete(id);
                    }
                }
            });
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

// Enhanced particle system for background effects
export function createParticleSystem(canvas, ctx) {
    const particles = [];
    const maxParticles = 150;
    
    class Particle {
        constructor() {
            this.reset();
            this.life = Math.random(); // Start with random life to distribute particles
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.life = 1;
            this.maxLife = 3 + Math.random() * 2;
            this.size = 1 + Math.random() * 2;
            this.twinkle = Math.random() * Math.PI * 2;
            this.twinkleSpeed = 0.02 + Math.random() * 0.03;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= 0.006;
            this.twinkle += this.twinkleSpeed;
            
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
            const alpha = this.life * (0.5 + 0.5 * Math.sin(this.twinkle));
            const intensity = 0.3 + 0.7 * Math.sin(this.twinkle);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.8;
            
            // Create a glowing effect
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
            gradient.addColorStop(0, `rgba(0, 255, 149, ${intensity})`);
            gradient.addColorStop(0.4, `rgba(157, 0, 255, ${intensity * 0.6})`);
            gradient.addColorStop(1, 'rgba(0, 255, 149, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a bright center
            ctx.globalAlpha = alpha;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    return {
        update() {
            particles.forEach(particle => particle.update());
        },
        
        draw() {
            particles.forEach(particle => particle.draw());
        },
        
        resize() {
            // Redistribute particles when canvas resizes
            particles.forEach(particle => {
                if (particle.x > canvas.width) particle.x = Math.random() * canvas.width;
                if (particle.y > canvas.height) particle.y = Math.random() * canvas.height;
            });
        }
    };
}