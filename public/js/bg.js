function generateDots(count, color) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push(`${getRandom(2000)}px ${getRandom(2000)}px ${color}`);
  }
  return dots.join(", ");
}

function getRandom(max) {
  return Math.floor(Math.random() * max);
}

function paintLayer(id, count, size, duration, color) {
  const layer = document.getElementById(id);
  if (!layer) {
    return;
  }

  layer.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    box-shadow: ${generateDots(count, color)};
    animation: animateParticle ${duration}s linear infinite;
  `;
}

function initBG() {
  paintLayer("particles1", 700, 1, 50, "#000");
  paintLayer("particles2", 200, 2, 100, "#000");
  paintLayer("particles3", 100, 3, 150, "#000");

  paintLayer("stars1", 500, 1, 50, "#fff");
  paintLayer("stars2", 200, 2, 100, "#fff");
  paintLayer("stars3", 100, 3, 150, "#fff");
}

document.addEventListener("astro:after-swap", initBG);
initBG();
