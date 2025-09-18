// ===== Firebase Imports =====
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase instances
const db = getDatabase();
const auth = getAuth();

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Store all players
let players = {};
const avatarCache = {}; // cache avatar images for smooth rendering

// ===== Drawing Loop =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  Object.values(players).forEach(p => {
    // Cache avatar image
    if (!avatarCache[p.avatar]) {
      const img = new Image();
      img.src = p.avatar;
      avatarCache[p.avatar] = img;
    }

    const img = avatarCache[p.avatar];
    if (img.complete) {
      ctx.drawImage(img, p.x - 25, p.y - 25, 50, 50); // avatar 50x50
    } else {
      // fallback if image not loaded yet
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player label
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(`P${p.slot}`, p.x - 10, p.y - 35);
  });

  requestAnimationFrame(draw);
}

// ===== Listen for Players =====
onValue(ref(db, 'rooms/room1/members'), snap => {
  players = snap.val() || {};
});

// ===== Movement Controls =====
document.addEventListener("keydown", e => {
  const user = auth.currentUser;
  if (!user) return;

  // Find current player
  const me = Object.values(players).find(p => p.uid === user.uid);
  if (!me) return;

  // Move player with arrow keys
  if (e.key === "ArrowUp") me.y -= 5;
  if (e.key === "ArrowDown") me.y += 5;
  if (e.key === "ArrowLeft") me.x -= 5;
  if (e.key === "ArrowRight") me.x += 5;

  // Update position in Firebase
  set(ref(db, `rooms/room1/members/${me.slot}`), me);
});

// Start drawing
draw();
