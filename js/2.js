// Enhanced AnimationController for Techno Sutra AR
// Manages complex animations for particles, shapes, and 3D effects

class AnimationController {
    constructor(options = {}) {
        this.animations = new Map();
        this.activeAnimations = new Set();
        this.globalTime = 0;
        this.isRunning = false;
        this.animationId = null;
        
        // Configuration
        this.baseDuration = options.baseDuration || 2000;
        this.baseInterval = options.baseInterval || 100;
        this.maxAnimations = options.maxAnimations || 1000;
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Event system
        this.listeners = new Map();
        
        this.start();
    }
    
    // Animation management
    addAnimation(target, property, config = {}) {
        const id = this.generateId();
        const animation = {
            id,
            target,
            property,
            from: config.from || 0,
            to: config.to || 1,
            duration: config.duration || this.baseDuration,
            delay: config.delay || 0,
            easing: config.easing || this.easing.linear,
            yoyo: config.yoyo || false,
            loop: config.loop !== undefined ? config.loop : true,
            loopCount: 0,
            maxLoops: config.maxLoops || Infinity,
            startTime: null,
            pausedTime: 0,
            isPaused: false,
            isReversed: false,
            onStart: config.onStart || null,
            onUpdate: config.onUpdate || null,
            onComplete: config.onComplete || null,
            onCycleComplete: config.onCycleComplete || null,
            currentValue: config.from || 0,
            progress: 0
        };
        
        this.animations.set(id, animation);
        this.activeAnimations.add(id);
        
        return id;
    }
    
    removeAnimation(id) {
        if (this.animations.has(id)) {
            const animation = this.animations.get(id);
            if (animation.onComplete) {
                animation.onComplete(animation);
            }
            this.animations.delete(id);
            this.activeAnimations.delete(id);
            return true;
        }
        return false;
    }
    
    pauseAnimation(id) {
        const animation = this.animations.get(id);
        if (animation && !animation.isPaused) {
            animation.isPaused = true;
            animation.pausedTime = this.globalTime;
        }
    }
    
    resumeAnimation(id) {
        const animation = this.animations.get(id);
        if (animation && animation.isPaused) {
            animation.isPaused = false;
            if (animation.startTime) {
                animation.startTime += this.globalTime - animation.pausedTime;
            }
        }
    }
    
    // Main animation loop
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            const deltaTime = currentTime - this.lastFrameTime;
            this.globalTime = currentTime;
            this.lastFrameTime = currentTime;
            
            // Update FPS counter
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                this.fps = Math.round(1000 / deltaTime);
            }
            
            // Process all active animations
            this.updateAnimations(currentTime);
            
            // Clean up completed animations
            this.cleanupAnimations();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    updateAnimations(currentTime) {
        for (const id of this.activeAnimations) {
            const animation = this.animations.get(id);
            if (!animation || animation.isPaused) continue;
            
            // Initialize start time
            if (animation.startTime === null) {
                animation.startTime = currentTime + animation.delay;
                if (animation.onStart) {
                    animation.onStart(animation);
                }
                continue;
            }
            
            // Check if animation should start
            if (currentTime < animation.startTime) continue;
            
            // Calculate progress
            const elapsed = currentTime - animation.startTime;
            let progress = Math.min(elapsed / animation.duration, 1);
            
            // Apply easing
            const easedProgress = animation.easing(progress);
            
            // Handle yoyo effect
            let finalProgress = easedProgress;
            if (animation.yoyo) {
                if (animation.isReversed) {
                    finalProgress = 1 - easedProgress;
                }
            }
            
            // Calculate current value
            const range = animation.to - animation.from;
            animation.currentValue = animation.from + (range * finalProgress);
            animation.progress = progress;
            
            // Apply animation to target
            if (animation.target && typeof animation.target === 'object') {
                animation.target[animation.property] = animation.currentValue;
            }
            
            // Call update callback
            if (animation.onUpdate) {
                animation.onUpdate(animation);
            }
            
            // Handle completion
            if (progress >= 1) {
                this.handleAnimationComplete(animation);
            }
        }
    }
    
    handleAnimationComplete(animation) {
        if (animation.yoyo && !animation.isReversed) {
            // Start reverse cycle
            animation.isReversed = true;
            animation.startTime = this.globalTime;
        } else {
            // Complete cycle
            animation.loopCount++;
            
            if (animation.onCycleComplete) {
                animation.onCycleComplete(animation);
            }
            
            if (animation.loop && animation.loopCount < animation.maxLoops) {
                // Restart animation
                animation.startTime = this.globalTime;
                animation.isReversed = false;
            } else {
                // Animation finished
                if (animation.onComplete) {
                    animation.onComplete(animation);
                }
                this.activeAnimations.delete(animation.id);
            }
        }
    }
    
    cleanupAnimations() {
        // Remove animations that are no longer active
        for (const [id, animation] of this.animations) {
            if (!this.activeAnimations.has(id)) {
                this.animations.delete(id);
            }
        }
        
        // Limit total animations for performance
        if (this.animations.size > this.maxAnimations) {
            const excess = this.animations.size - this.maxAnimations;
            const oldestIds = Array.from(this.animations.keys()).slice(0, excess);
            oldestIds.forEach(id => this.removeAnimation(id));
        }
    }
    
    // Utility methods
    generateId() {
        return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getActiveCount() {
        return this.activeAnimations.size;
    }
    
    getTotalCount() {
        return this.animations.size;
    }
    
    getFPS() {
        return this.fps;
    }
    
    // Easing functions
    easing = {
        linear: (t) => t,
        
        sineIn: (t) => 1 - Math.cos(t * Math.PI / 2),
        sineOut: (t) => Math.sin(t * Math.PI / 2),
        sineInOut: (t) => 0.5 * (1 - Math.cos(Math.PI * t)),
        
        quadIn: (t) => t * t,
        quadOut: (t) => t * (2 - t),
        quadInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        
        cubicIn: (t) => t * t * t,
        cubicOut: (t) => (--t) * t * t + 1,
        cubicInOut: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        
        quartIn: (t) => t * t * t * t,
        quartOut: (t) => 1 - (--t) * t * t * t,
        quartInOut: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        
        quintIn: (t) => t * t * t * t * t,
        quintOut: (t) => 1 + (--t) * t * t * t * t,
        quintInOut: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
        
        expoIn: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
        expoOut: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        expoInOut: (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
            return (2 - Math.pow(2, -20 * t + 10)) / 2;
        },
        
        circIn: (t) => 1 - Math.sqrt(1 - t * t),
        circOut: (t) => Math.sqrt(1 - (--t) * t),
        circInOut: (t) => t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - (2 * t - 2) * (2 * t - 2)) + 1) / 2,
        
        backIn: (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        },
        backOut: (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },
        backInOut: (t) => {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            return t < 0.5
                ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        },
        
        elastic: (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            const c4 = (2 * Math.PI) / 3;
            return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
        },
        
        bounce: (t) => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        }
    };
    
    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    // Preset animation factories
    createPulseAnimation(target, property = 'scale', options = {}) {
        return this.addAnimation(target, property, {
            from: options.from || 1,
            to: options.to || 1.2,
            duration: options.duration || 1000,
            easing: this.easing.sineInOut,
            yoyo: true,
            loop: true,
            ...options
        });
    }
    
    createSpinAnimation(target, property = 'rotation', options = {}) {
        return this.addAnimation(target, property, {
            from: 0,
            to: Math.PI * 2,
            duration: options.duration || 3000,
            easing: this.easing.linear,
            loop: true,
            ...options
        });
    }
    
    createFloatAnimation(target, property = 'y', options = {}) {
        return this.addAnimation(target, property, {
            from: options.from || 0,
            to: options.to || 20,
            duration: options.duration || 2000,
            easing: this.easing.sineInOut,
            yoyo: true,
            loop: true,
            ...options
        });
    }
    
    createGlowAnimation(target, property = 'opacity', options = {}) {
        return this.addAnimation(target, property, {
            from: 0.3,
            to: 1.0,
            duration: options.duration || 1500,
            easing: this.easing.sineInOut,
            yoyo: true,
            loop: true,
            ...options
        });
    }
}

// Export the AnimationController class as default
export default AnimationController;

// Example usage for reference (commented out):
/*
// Create controller
const controller = new AnimationController({
    baseDuration: 2000,
    baseInterval: 100
});

// Create a shape object to animate
const shape = { scale: 1, rotation: 0, opacity: 1 };

// Add various animations
controller.addAnimation(shape, 'scale', {
    from: 1,
    to: 2,
    duration: controller.baseDuration,
    easing: controller.easing.sineInOut,
    yoyo: true,
    loop: true,
    onUpdate: (animation) => {
        // Called every frame with current animation state
        console.log(`Scale: ${animation.currentValue}`);
    },
    onStart: (animation) => {
        console.log('Scale animation started');
    },
    onComplete: (animation) => {
        console.log('Scale animation completed');
    },
    onCycleComplete: (animation) => {
        console.log(`Scale cycle ${animation.loopCount} completed`);
    }
});

// Add rotation animation
controller.createSpinAnimation(shape, 'rotation', {
    duration: 3000
});

// Add pulse effect
controller.createPulseAnimation(shape, 'opacity', {
    from: 0.5,
    to: 1.0,
    duration: 1000
});
*/