import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

window.deletePost = async function(postId) {
  if (!confirm("Delete this post?")) return;

  const postDiv = document.getElementById(`post-${postId}`);
  if (postDiv) {
    postDiv.style.transition = "opacity 0.5s";
    postDiv.style.opacity = 0;

    // wait for the fade to finish
    setTimeout(async () => {
      await deleteDoc(doc(db, "posts", postId));
      loadPosts(); // reload posts after deletion
    }, 500);
  } else {
    await deleteDoc(doc(db, "posts", postId));
    loadPosts();
  }
};


const app = document.getElementById("app");

let selectedAvatar = "";
let currentPage = "posts";


// AUTO LOGIN
window.onload = function () {
  const savedUser = localStorage.getItem("username");

  if (savedUser) {
    showMainApp();
  } else {
    showLogin();
  }
};


// LOGIN PAGE
function showLogin() {
  app.innerHTML = `
    <div class="header">Girls4Girls</div>
    <div class="page">
      <h3>Choose Avatar</h3>

      <button onclick="selectAvatar('🌸')">🌸</button>
      <button onclick="selectAvatar('🍀')">🍀</button>
      <button onclick="selectAvatar('✨')">✨</button>
      <button onclick="selectAvatar('🦋')">🦋</button>
      <button onclick="selectAvatar('👠')">👠</button>
      <button onclick="selectAvatar('🍓')">🍓</button>
      <button onclick="selectAvatar('🍪')">🍪</button>
      <button onclick="selectAvatar('👽')">👽</button>
      <button onclick="selectAvatar('💄')">💄</button>
      <button onclick="selectAvatar('🍄')">🍄</button>
      <button onclick="selectAvatar('🥐')">🥐</button>
      <button onclick="selectAvatar('🐞')">🐞</button>

      <br><br>

      <input id="username" placeholder="Enter username" />
      <br><br>

      <button onclick="continueToHome()">Continue</button>
    </div>
  `;
}

window.selectAvatar = function (avatar) {
  selectedAvatar = avatar;
};

window.continueToHome = function () {
  const username = document.getElementById("username").value;

  if (!username || !selectedAvatar) {
    alert("Select avatar and enter username");
    return;
  }

  localStorage.setItem("username", username);
  localStorage.setItem("avatar", selectedAvatar);

  showMainApp();
};


// MAIN APP
function showMainApp() {
  app.innerHTML = `
    <div class="header">Girls4Girls</div>

    <div class="page" id="pageContent"></div>

    <div style="
      position:fixed;
      bottom:0;
      width:100%;
      background:white;
      border-top:1px solid #ccc;
      display:flex;
      justify-content:space-around;
      padding:10px;
    ">
      <button onclick="navigate('posts')">🏠</button>
      <button onclick="navigate('mood')">😊</button>
      <button onclick="navigate('period')">📅</button>
      <button onclick="navigate('profile')">👤</button>
      <button onclick="navigate('logout')">🚪</button>
    </div>
  `;

  navigate("posts");
}


// NAVIGATION
window.navigate = function (page) {
  if (page === "posts") showPostsPage();
  if (page === "mood") showMoodPage();
  if (page === "period") showPeriodPage();
  if (page === "profile") showProfilePage();
  if (page === "logout") showLogoutPage();
};


// POSTS PAGE
function showPostsPage() {
  const username = localStorage.getItem("username");
  const avatar = localStorage.getItem("avatar");

  document.getElementById("pageContent").innerHTML = `
    <h3>${avatar} ${username}</h3>

    <textarea id="postInput" placeholder="Share something..." rows="3"></textarea>
    <br>
    <button onclick="createPost()">Post</button>

    <hr>

    <div id="postsContainer"></div>
  `;

  loadPosts();
}


window.createPost = async function () {
  const text = document.getElementById("postInput").value;
  if (!text.trim()) return;

  await addDoc(collection(db, "posts"), {
    text: text,
    username: localStorage.getItem("username"),
    avatar: localStorage.getItem("avatar"),
    hugs: 0,
    huggedBy: [],
    comments: [],
    time: new Date()
  });

  document.getElementById("postInput").value = "";
  loadPosts();
};


// LOAD POSTS
async function loadPosts() {
  const container = document.getElementById("postsContainer");
  const q = query(collection(db, "posts"), orderBy("time", "desc"));
  const snapshot = await getDocs(q);

  container.innerHTML = "";

  snapshot.forEach(postDoc => {
    const post = postDoc.data();
    const postDiv = document.createElement("div");
    postDiv.id = `post-${postDoc.id}`;
    postDiv.innerHTML = `
    <p><b>${post.username}</b>: ${post.text}</p>
    <p>
      <button onclick="hugPost('${postDoc.id}')">
        ❤️ (${post.hugs || 0})
      </button>

      &nbsp;&nbsp;
      💬 <span onclick="toggleComments('${postDoc.id}')" style="cursor:pointer;">
        Comments (${(post.comments || []).length})
      </span>

      ${post.username === localStorage.getItem("username") ? `
      &nbsp;&nbsp;
      <button onclick="deletePost('${postDoc.id}')">🗑️ Delete</button>` : ""}
    </p>

    <div id="commentsBox-${postDoc.id}" style="display:none; margin-top:10px;">
      ${(post.comments || []).map(c =>
        `<p><b>${c.username}:</b> ${c.text}</p>`
      ).join("")}

      <input id="comment-${postDoc.id}" placeholder="Write comment">
      <button onclick="addComment('${postDoc.id}')">Send</button>
    </div>

    <hr>
  `;

  container.appendChild(postDiv);
});
}


// HUG
window.hugPost = async function(postId) {

  const username = localStorage.getItem("username");

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  let huggedBy = postSnap.data().huggedBy || [];
  let hugs = postSnap.data().hugs || 0;

  if (huggedBy.includes(username)) {

    huggedBy = huggedBy.filter(u => u !== username);
    hugs--;

  } else {

    huggedBy.push(username);
    hugs++;

  }

  await updateDoc(postRef, {
    huggedBy: huggedBy,
    hugs: hugs
  });

  loadPosts();
};


window.toggleComments = function(postId) {

  const box = document.getElementById(`commentsBox-${postId}`);

  if (box.style.display === "none")
    box.style.display = "block";
  else
    box.style.display = "none";
};

window.addComment = async function(postId) {

  const input = document.getElementById(`comment-${postId}`);
  const text = input.value;

  if (!text) return;

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  let comments = postSnap.data().comments || [];

  comments.push({
    username: localStorage.getItem("username"),
    text: text
  });

  await updateDoc(postRef, {
    comments: comments
  });

  loadPosts();
};



// MOOD PAGE
function showMoodPage() {
  document.getElementById("pageContent").innerHTML = `
    <h3>Mood Tracker</h3>

    <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:20px;">

  <div onclick="selectMood('happy')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😊</div>
    <div>Happy</div>
  </div>

  <div onclick="selectMood('sad')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😔</div>
    <div>Sad</div>
  </div>

  <div onclick="selectMood('angry')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😡</div>
    <div>Angry</div>
  </div>

  <div onclick="selectMood('bored')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">🥱</div>
    <div>Bored</div>
  </div>

  <div onclick="selectMood('anxious')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😰</div>
    <div>Anxious</div>
  </div>

  <div onclick="selectMood('tired')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😴</div>
    <div>Tired</div>
  </div>

  <div onclick="selectMood('excited')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😃</div>
    <div>Excited</div>
  </div>

  <div onclick="selectMood('lonely')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">🥺</div>
    <div>Lonely</div>
  </div>

  <div onclick="selectMood('relaxed')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">😇</div>
    <div>Relaxed</div>
  </div>

  <div onclick="selectMood('frustrated')" style="text-align:center; cursor:pointer;">
    <div style="font-size:30px;">🫨</div>
    <div>Frustrated</div>
  </div>

</div>


    <br><br>

    <textarea id="moodNote" placeholder="Optional note"></textarea>
    <br><br>

    <button onclick="saveMood()">Save Mood</button>

    <div id="moodSuggestion"></div>
  `;
}

function showSuggestion(mood) {

  let suggestion = "";
  let activities = "";

  if (mood === "happy") {
    suggestion = "You're in a positive emotional state. This is a great time to connect and create.";
    activities = "• Talk to a friend\n• Work on something creative\n• Listen to music\n• Share your happiness with someone";
  }

  else if (mood === "sad") {
    suggestion = "Your mind may need comfort and emotional support.";
    activities = "• Journal your thoughts\n• Watch comfort videos\n• Listen to calm music\n• Rest and hydrate";
  }

  else if (mood === "angry") {
    suggestion = "Your body has built-up tension that needs release.";
    activities = "• Take a walk\n• Do deep breathing\n• Listen to music\n• Take a short break";
  }

  else if (mood === "anxious") {
    suggestion = "Your nervous system may be overstimulated. Calm activities help.";
    activities = "• Slow breathing (4-4-4 technique)\n• Listen to calming sounds\n• Sit quietly\n• Drink water";
  }

  else if (mood === "neutral") {
    suggestion = "Your emotional state is stable.";
    activities = "• Try something enjoyable\n• Talk to someone\n• Go outside\n• Do a hobby";
  }

  else if (mood === "bored") {
  suggestion = "Your brain needs stimulation and novelty.";
  activities = "• Try a new hobby\n• Watch something interesting\n• Talk to a friend\n• Go outside for a walk\n• Listen to a new playlist";
}

else if (mood === "tired") {
  suggestion = "Your body and mind need rest and recovery.";
  activities = "• Take a short nap\n• Drink water\n• Stretch gently\n• Listen to calm music\n• Reduce screen time and relax";
}

if (mood === "excited") {
    suggestion = "You're full of energy and enthusiasm. Channel it into something fun or productive!";
    activities = "• Start a new project\n• Go for an adventure\n• Share your excitement with friends\n• Try something spontaneous";
}

else if (mood === "lonely") {
    suggestion = "You may need connection and comfort. Reaching out helps.";
    activities = "• Call or message a friend\n• Write in a journal\n• Listen to soothing music\n• Spend time in nature";
}

else if (mood === "relaxed") {
    suggestion = "You're calm and at ease. Perfect time to enjoy simple pleasures.";
    activities = "• Meditate or do deep breathing\n• Read a book\n• Enjoy a warm drink\n• Listen to soft music";
}

else if (mood === "frustrated") {
    suggestion = "You may feel blocked or tense. Small steps help release stress.";
    activities = "• Take a short walk\n• Stretch or exercise lightly\n• Write down your thoughts\n• Do a calming activity";
}


  document.getElementById("moodSuggestion").innerHTML = `
    <br><br><strong>hey, </strong> ${suggestion}
    <br><br>
    <strong>do these:</strong>
    <br>
    ${activities.replace(/\n/g, "<br>")}
  `;
}


let selectedMood = "";

window.selectMood = function (mood) {
  selectedMood = mood;
};

window.saveMood = async function () {

  if (!selectedMood) {
    alert("Select mood");
    return;
  }

  await addDoc(collection(db, "moods"), {
    mood: selectedMood,
    username: localStorage.getItem("username"),
    time: new Date()
  });

  // SHOW suggestion after saving
  showSuggestion(selectedMood);
};



// PERIOD PAGE
function showPeriodPage() {
  document.getElementById("pageContent").innerHTML = `
    <h3>Period Tracker</h3>
    <input type="date" id="lastPeriodDate">
    <button onclick="savePeriod()">Save</button>

    <div class="calendar-header">
      <button onclick="changeMonth(-1)">‹</button>
      <span id="monthYear"></span>
      <button onclick="changeMonth(1)">›</button>
    </div>

    <div id="calendar"></div>

    <p id="prediction"></p>
    <p id="phase"></p>

  `;

  renderCalendar();
  calculatePeriod();
}

window.savePeriod = async function () {
  const lastDate = document.getElementById("lastPeriodDate").value;
  if (!lastDate) return alert("Select a date");

  localStorage.setItem("lastPeriodDate", lastDate);

  await addDoc(collection(db, "periods"), {
    lastPeriodDate: lastDate,
    username: localStorage.getItem("username"),
    time: new Date()
  });

  calculatePhase(lastDate);
};



async function loadPeriodData() {
  const currentUser = localStorage.getItem("username");
  
  // Guard clause: if no user is logged in, don't try to fetch data
  if (!currentUser) {
    console.log("No user logged in.");
    return;
  }

  try {
    const periodsRef = collection(db, "periods");

    // Create the query to find THIS user's latest entry
    const q = query(
      periodsRef,
      where("username", "==", currentUser),
      orderBy("time", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Grab the first (most recent) document found
      const latestDoc = querySnapshot.docs[0].data();
      const savedDate = latestDoc.lastPeriodDate;

      // Update the input field and run your calculation logic
      const dateInput = document.getElementById("lastPeriodDate");
      if (dateInput) {
        dateInput.value = savedDate;
        calculatePhase(savedDate);
      }
    } else {
      console.log("No history found for:", currentUser);
    }
  } catch (error) {
    console.error("Error fetching user-specific data:", error);
  }
}

function calculatePhase(lastDate) {

  const last = new Date(lastDate);
  const today = new Date();

  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
  const cycleDay = diffDays % 28;

  let phase = "";
  let feeling = "";

  if (cycleDay <= 5) {
    phase = "Menstrual Phase";
    feeling = "You may feel low energy, tired, or emotional. Rest and self-care help.";
  }
  else if (cycleDay <= 13) {
    phase = "Follicular Phase";
    feeling = "Your energy increases, focus improves, and motivation grows.";
  }
  else if (cycleDay <= 16) {
    phase = "Ovulation Phase";
    feeling = "Peak fertility phase. You may feel confident, social, attractive, and energetic.";
  }
  else {
    phase = "Luteal Phase";
    feeling = "Hormones shift. You may feel sensitive, emotional, or experience mood swings. Gentle routines help.";
  }

  // Calculate NEXT FUTURE period date
  let nextPeriod = new Date(last);

  while (nextPeriod <= today) {
    nextPeriod.setDate(nextPeriod.getDate() + 28);
  }

  // Days remaining
  const daysLeft = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

  document.getElementById("periodResult").innerHTML = `
    <strong>Current Phase:</strong> ${phase}
    <br><br>
    <strong>What this means:</strong> ${feeling}
    <br><br>
    <strong>Next Period:</strong> ${nextPeriod.toDateString()}
    <br>
    <strong>Days remaining:</strong> ${daysLeft} days
  `;
}



// PROFILE
async function showProfilePage() {
  const username = localStorage.getItem("username");
  const avatar = localStorage.getItem("avatar");

  document.getElementById("pageContent").innerHTML = `
    <h3>${avatar} ${username}</h3>
    <p>Total Posts: <span id="postCount">Loading...</span></p>
    <div id="userPosts"></div>
  `;

  const container = document.getElementById("userPosts");
  const q = query(collection(db, "posts"), orderBy("time", "desc"));
  const snapshot = await getDocs(q);

  let count = 0;
  container.innerHTML = "";

  snapshot.forEach(postDoc => {
    const post = postDoc.data();
    if (post.username === username) {
      count++;
      container.innerHTML += `<p>${post.text}</p>`;
    }
  });

  document.getElementById("postCount").innerText = count;
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

window.savePeriod = function () {

  const date =
    document.getElementById("lastPeriodDate").value;

  if (!date) return;

  localStorage.setItem("lastPeriodDate", date);

  renderCalendar();
  calculatePeriod();
};

function changeMonth(offset) {

  currentMonth += offset;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  renderCalendar();
}

function renderCalendar() {

  const calendar =
    document.getElementById("calendar");

  calendar.innerHTML = "";

  const monthYear =
    document.getElementById("monthYear");

  const date =
    new Date(currentYear, currentMonth);

  monthYear.innerText =
    date.toLocaleString("default",
    { month: "long", year: "numeric" });

  const firstDay =
    new Date(currentYear, currentMonth, 1).getDay();

  const daysInMonth =
    new Date(currentYear,
      currentMonth + 1, 0).getDate();

  const today = new Date();

  const lastPeriod =
    new Date(localStorage.getItem("lastPeriodDate"));

  const nextPeriod = new Date(lastPeriod);
  nextPeriod.setDate(lastPeriod.getDate() + 28);

  for (let i = 0; i < firstDay; i++) {

    const empty =
      document.createElement("div");

    empty.className = "empty";

    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {

    const div =
      document.createElement("div");

    div.className = "day";

    div.innerText = day;

    const thisDate =
      new Date(currentYear, currentMonth, day);

    if (
      thisDate.toDateString() ===
      today.toDateString()
    ) {
      div.classList.add("today");
    }

    if (
      thisDate.toDateString() ===
      lastPeriod.toDateString()
    ) {
      div.classList.add("period");
    }

    if (
      thisDate.toDateString() ===
      nextPeriod.toDateString()
    ) {
      div.classList.add("predicted");
    }

    calendar.appendChild(div);
  }
}

function calculatePeriod() {

  const last =
    new Date(localStorage.getItem("lastPeriodDate"));

  if (!last) return;

  const today = new Date();

  const diff =
    Math.floor((today - last) /
    (1000 * 60 * 60 * 24));

  const next = new Date(last);
  next.setDate(last.getDate() + 28);

  document.getElementById("prediction").innerText =
    "Next period: " + next.toDateString();

  let phase = "";
  let suggestion = "";

  if (diff <= 5) {
    phase = "Menstrual Phase";
    suggestion = "Rest and relax";
  }
  else if (diff <= 13) {
    phase = "Follicular Phase";
    suggestion = "Good energy, try new things";
  }
  else if (diff <= 16) {
    phase = "Ovulation Phase";
    suggestion = "Best time for productivity";
  }
  else {
    phase = "Luteal Phase";
    suggestion = "Take care, avoid stress";
  }

  document.getElementById("phase").innerText =
    "Phase: " + phase +
    " | Suggestion: " + suggestion;
}

renderCalendar();
calculatePeriod();

// LOGOUT PAGE FUNCTION
function showLogoutPage() {

  // clear user data
  localStorage.removeItem("username");
  localStorage.removeItem("avatar");

  // optional firebase signout
  if (typeof signOut === "function" && typeof auth !== "undefined") {
    signOut(auth).catch(() => {});
  }

  // redirect to login
  showLogin();
}
