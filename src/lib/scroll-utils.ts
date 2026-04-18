/**
 * Custom smooth scroll with easing function
 * @param targetY The target scroll position
 * @param duration Duration in ms
 */
export function smoothScrollTo(targetY: number, duration: number = 800) {
  const startY = window.pageYOffset;
  const difference = targetY - startY;
  const startTime = performance.now();

  function easeOutQuart(t: number) {
    return 1 - (--t) * t * t * t;
  }

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    window.scrollTo(0, startY + (difference * easeOutQuart(progress)));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
