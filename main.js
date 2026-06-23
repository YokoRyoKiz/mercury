const canvas = document.getElementById('scroll-canvas');
const context = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const loader = document.getElementById('loader');

// TOTAL_FRAMES should be defined in frames_info.js
const frameCount = typeof TOTAL_FRAMES !== 'undefined' ? TOTAL_FRAMES : 0; 

const images = [];
let imagesLoaded = 0;

const pad = (num, size) => {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

const getImagePath = (index) => {
  return `./frames/frame_${pad(index, 4)}.jpg`;
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderFrame(Math.round(currentFrame));
});

function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,
        nh = ih * r,
        cx, cy, cw, ch, ar = 1;

    if (nw < w) ar = w / nw;                             
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  
    nw *= ar;
    nh *= ar;

    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

function renderFrame(index) {
  if (images[index] && images[index].complete && images[index].naturalHeight !== 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawImageProp(context, images[index], 0, 0, canvas.width, canvas.height);
  }
}

// Preload images
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = getImagePath(i);
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 1) {
      renderFrame(0);
    }
    // Hide loader once 50 frames or all frames are loaded
    if (imagesLoaded === Math.min(50, frameCount) || imagesLoaded === frameCount) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }
  img.onerror = () => {
     // Handle missing frames gracefully to not block loader
     imagesLoaded++;
  }
  images.push(img);
}

if (frameCount === 0) {
    loader.style.display = 'none';
    console.error("TOTAL_FRAMES not found. Did the extraction script complete?");
}

// Scroll logic
let targetFrame = 0;
let currentFrame = 0;

function updateScroll() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  if (maxScroll > 0 && frameCount > 0) {
    const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
    targetFrame = scrollFraction * (frameCount - 1);
    
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.05) {
        currentFrame += diff * 0.15; // Smooth factor
        renderFrame(Math.round(currentFrame));
    }
    
    if (scrollFraction > 0.02) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s ease';
    } else {
      overlay.style.opacity = '1';
    }

    // Final Message logic
    const finalMsg = document.getElementById('final-message');
    if (finalMsg) {
      if (scrollFraction > 0.88) {
         const progress = (scrollFraction - 0.88) / 0.12;
         finalMsg.style.opacity = Math.min(1, progress * 1.5).toFixed(3);
         finalMsg.style.transform = `translate(-50%, -50%) scale(${0.8 + progress * 0.4})`;
      } else {
         finalMsg.style.opacity = '0';
         finalMsg.style.transform = `translate(-50%, -50%) scale(0.8)`;
      }
    }

    // Info Panels logic
    const panels = document.querySelectorAll('.info-panel');
    const panelRanges = [
      { start: 0.05, end: 0.25 },
      { start: 0.20, end: 0.40 },
      { start: 0.35, end: 0.55 },
      { start: 0.50, end: 0.70 },
      { start: 0.65, end: 0.85 }
    ];

    panels.forEach((panel, index) => {
      const range = panelRanges[index];
      if (range) {
        if (scrollFraction >= range.start && scrollFraction <= range.end) {
          const progress = (scrollFraction - range.start) / (range.end - range.start);
          
          // Y translation: from bottom of viewport (100vh) to top (-50vh)
          const yPos = 100 - (progress * 150); 
          
          // Opacity: fade in 0 -> 0.15, fade out 0.85 -> 1
          let opacity = 1;
          const fadeDuration = 0.15;
          if (progress < fadeDuration) {
             opacity = progress / fadeDuration;
          } else if (progress > 1 - fadeDuration) {
             opacity = (1 - progress) / fadeDuration;
          }
          
          panel.style.visibility = 'visible';
          panel.style.opacity = opacity.toFixed(3);
          panel.style.transform = `translateY(${yPos}vh)`;
        } else {
          panel.style.visibility = 'hidden';
          panel.style.opacity = '0';
        }
      }
    });
  }
  requestAnimationFrame(updateScroll);
}

requestAnimationFrame(updateScroll);
