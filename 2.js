controller.addAnimation(shape, 'scale', {
    from: 1,
    to: 2,
    x: 100,
    duration: controller.baseDuration,
    interval: controller.baseInterval,
    easing: easing.sineInOut,
    yoyo: true,
    loop: false,
    onUpdate: (animation) => {
        // Called every frame
    },
    onStart: (animation) => {
        // Called when animation begins
    },
    onComplete: (animation) => {
        // Called when animation ends
    },
    onCycleComplete: (animation) => {
        // Called when all shapes complete one cycle
    }    
});