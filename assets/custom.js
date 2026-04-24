function smoothScrollTo(targetY, duration = 100) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  let startTime = null;

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const easedProgress = easeInOutSine(progress);
    window.scrollTo(0, startY + distance * easedProgress);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  requestAnimationFrame(animation);
}

// 🚀 Scroll to top on page load — Fast + Smooth
window.addEventListener("load", () => {
  setTimeout(() => {
    smoothScrollTo(0, 100); // 100ms = Fast Glide
  }, 50); // slight delay to avoid flicker
});
