// ===== Firebase Imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, updatePassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyC8UcPwnEVLTV-NDb2yu4x_l_td0acsXi4",
  authDomain: "moriomgame-fa3c7.firebaseapp.com",
  databaseURL: "https://moriomgame-fa3c7-default-rtdb.firebaseio.com/",
  projectId: "moriomgame-fa3c7",
  appId: "1:613189870143:web:de74d7ea5b46e635684e8a",
  measurementId: "G-H1CNT2YKDH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const analytics = getAnalytics(app);

// ======= Registration (Send Email Link) =======
async function registerWithEmail() {
  const email = document.getElementById("regEmail").value;
  const actionCodeSettings = {
    url: window.location.origin + '/finish.html',
    handleCodeInApp: true
  };
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    alert("Check your email to set your password!");
    logEvent(analytics, 'sign_up', { method: 'email_link' });
  } catch (err) {
    alert(err.message);
  }
}

// ======= Login with Email + Password =======
async function loginWithPassword() {
  const email = document.getElementById("logEmail").value;
  const password = document.getElementById("logPass").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful! Redirecting to game...");
    window.location.href = "game.html";
  } catch (err) {
    alert(err.message);
  }
}

// ======= Magic Link Handling =======
if (window.location.pathname.includes('finish.html')) {
  window.onload = async () => {
    const url = window.location.href;
    if (isSignInWithEmailLink(auth, url)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) email = prompt("Enter your email to confirm");
      try {
        const result = await signInWithEmailLink(auth, email, url);
        window.localStorage.removeItem('emailForSignIn');

        const passwordInput = document.getElementById("passwordInput");
        const submitBtn = document.getElementById("setPasswordBtn");
        submitBtn.onclick = async () => {
          const password = passwordInput.value;
          if (password.length < 6) { alert("Password must be 6+ characters"); return; }
          await updatePassword(result.user, password);
          alert("Password set! You can login now.");
          window.location.href = "index.html";
        };
      } catch (err) { alert(err.message); }
    }
  };
}

// ======= Join Room =======
async function joinRoom(roomId, avatarUrl) {
  const user = auth.currentUser;
  if (!user) { alert("Login first"); return; }

  const roomMembersRef = ref(db, 'rooms/' + roomId + '/members');
  await runTransaction(roomMembersRef, currentMembers => {
    currentMembers = currentMembers || {};
    const slots = ["1", "2", "3", "4", "5", "6"];
    const mySlot = slots.find(s => !currentMembers[s]);

    if (!mySlot) {
      alert("Room full!");
      return;
    }

    currentMembers[mySlot] = {
      uid: user.uid,
      email: user.email,
      avatar: avatarUrl,
      slot: mySlot,
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400
    };

    return currentMembers;
  });

  // If room fills, mark started
  const statusRef = ref(db, 'rooms/' + roomId + '/status');
  onValue(ref(db, 'rooms/' + roomId + '/members'), snap => {
    const members = snap.val() || {};
    if (Object.keys(members).length === 6) {
      set(statusRef, 'started');
    }
  });

  window.location.href = "game.html";
}

// Export
window.registerWithEmail = registerWithEmail;
window.loginWithPassword = loginWithPassword;
window.joinRoom = joinRoom;
