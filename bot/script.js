// ==========================================
// 1. TELEGRAM SDK INITIALIZATION
// ==========================================
const tg = window.Telegram.WebApp;
tg.expand();

// ==========================================
// 1.5 FIREBASE INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAIy5CYDeeYgHjJ9QBtlOFnM6Dy5eZu3AA",
  authDomain: "m-c-bot.firebaseapp.com",
  projectId: "m-c-bot",
  storageBucket: "m-c-bot.firebasestorage.app",
  messagingSenderId: "390271091201",
  appId: "1:390271091201:web:c04f9c143e4c851abcf600"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const appContent = document.getElementById('app-content');
const navItems = document.querySelectorAll('.nav-item');

function checkTelegramEnvironment() {
    const popup = document.getElementById('tg-warning-popup');
    if (tg.platform === "unknown" || !tg.initData) {
        if(popup) popup.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeWarningPopup() {
    const popup = document.getElementById('tg-warning-popup');
    if(popup) popup.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// ==========================================
// 2. SKELETON LOADERS
// ==========================================
const skeletons = {
    home: `
        <div class="skeleton skel-home-banner"></div>
        <div class="skel-grid">
            <div class="skeleton skel-box"></div>
            <div class="skeleton skel-box"></div>
        </div>
    `,
    earn: `
        <div class="skel-task-item"><div class="skeleton skel-avatar"></div><div class="skel-lines"><div class="skeleton skel-line"></div><div class="skeleton skel-line short"></div></div></div>
        <div class="skel-task-item"><div class="skeleton skel-avatar"></div><div class="skel-lines"><div class="skeleton skel-line"></div><div class="skeleton skel-line short"></div></div></div>
        <div class="skel-task-item"><div class="skeleton skel-avatar"></div><div class="skel-lines"><div class="skeleton skel-line"></div><div class="skeleton skel-line short"></div></div></div>
    `,
    profile: `
        <div style="display:flex; flex-direction:column; align-items:center; background: var(--surface-light); padding: 30px; border-radius: 16px; margin-bottom: 20px;">
            <div class="skeleton" style="width: 85px; height: 85px; border-radius: 50%; margin-bottom: 15px;"></div>
            <div class="skeleton" style="width: 150px; height: 20px; margin-bottom: 10px;"></div>
            <div class="skeleton" style="width: 100px; height: 15px;"></div>
        </div>
    `,
    default: `
        <div style="display:flex; flex-direction:column; align-items:center; margin-top:50px; gap:15px;">
            <div class="skeleton" style="width: 80px; height: 80px; border-radius: 50%;"></div>
            <div class="skeleton" style="width: 150px; height: 20px;"></div>
            <div class="skeleton" style="width: 250px; height: 15px;"></div>
        </div>
    `
};

// ==========================================
// 3. NAVIGATION & ROUTER LOGIC
// ==========================================
async function navigateTo(pageName, clickedElement) {
    navItems.forEach(item => {
        item.classList.remove('active');
        const icon = item.querySelector('ion-icon');
        icon.setAttribute('name', icon.getAttribute('data-icon') + '-outline');
    });
    
    clickedElement.classList.add('active');
    const activeIcon = clickedElement.querySelector('ion-icon');
    activeIcon.setAttribute('name', activeIcon.getAttribute('data-icon'));

    appContent.innerHTML = skeletons[pageName] || skeletons['default'];

    try {
        await new Promise(resolve => setTimeout(resolve, 300));

        // Admin check
        const checkModules = ['earn', 'store', 'game', 'ads'];
        if (checkModules.includes(pageName)) {
            const adminState = localStorage.getItem(`module_${pageName}`);
            if (adminState === 'false') {
                const fallback = await fetch(`pages/coming-soon.html`);
                appContent.innerHTML = await fallback.text();
                document.body.style.overflow = 'hidden'; 
                return; 
            }
        }

        const response = await fetch(`pages/${pageName}.html`);
        
        if (!response.ok) {
            const fallback = await fetch(`pages/coming-soon.html`);
            appContent.innerHTML = await fallback.text();
            document.body.style.overflow = 'hidden'; 
            return;
        }

        const html = await response.text();
        appContent.innerHTML = html;
        
      // --- DYNAMIC PAGE RENDERING TRIGGERS ---
        if (pageName === 'earn') {
            renderUserTasks();
        } else if (pageName === 'profile') {
            renderUserProfile();
        } else if (pageName === 'game') {
            renderGameArcade(); 
        } else if (pageName === 'store') {
            renderStoreProducts(); // <-- Added this line!
        }
        
        document.body.style.overflow = 'auto'; 

    } catch (error) {
        console.error("Error loading page:", error);
        appContent.innerHTML = `<div style="text-align:center; color:red; margin-top:50px;">Error loading content. Are you running a local server?</div>`;
    }
}

// ==========================================
// 4. LEVEL CALCULATOR
// ==========================================
function calculateUserLevel(userBalance) {
    const req2 = parseInt(localStorage.getItem('lvl2_req')) || 1000;
    const req3 = parseInt(localStorage.getItem('lvl3_req')) || 5000;
    const req4 = parseInt(localStorage.getItem('lvl4_req')) || 15000;
    const req5 = parseInt(localStorage.getItem('lvl5_req')) || 50000;

    let currentLevel = 1;
    let levelColorVar = '--lvl1-color'; 

    if (userBalance >= req5) {
        currentLevel = 5; levelColorVar = '--lvl5-color';
    } else if (userBalance >= req4) {
        currentLevel = 4; levelColorVar = '--lvl4-color';
    } else if (userBalance >= req3) {
        currentLevel = 3; levelColorVar = '--lvl3-color';
    } else if (userBalance >= req2) {
        currentLevel = 2; levelColorVar = '--lvl2-color';
    }

    document.getElementById('user-level-display').innerText = `Lvl ${currentLevel}`;
    document.documentElement.style.setProperty('--current-level-color', `var(${levelColorVar})`);
}

// ==========================================
// 5. PAGE-SPECIFIC RENDERING LOGIC
// ==========================================
function renderUserTasks() {
    const container = document.getElementById('user-task-container');
    if (!container) return;

    const tasks = JSON.parse(localStorage.getItem('app_tasks')) || [];

    if (tasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 30px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                <p>No tasks available right now. Check back later!</p>
            </div>`;
        return;
    }

    let html = '';
    tasks.forEach(task => {
        html += `
            <div class="task-card">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 2rem;">${task.icon}</div>
                    <div>
                        <h4 style="margin-bottom: 4px;">${task.title}</h4>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">+ ${task.reward} 🪙</span>
                    </div>
                </div>
                <button onclick="window.open('${task.url}', '_blank')" style="background: var(--accent-color); color: white; border: none; padding: 8px 16px; border-radius: 50px; font-weight: bold; cursor: pointer;">Start</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderUserProfile() {
    const nameEl = document.getElementById('profile-page-name');
    const idEl = document.getElementById('profile-page-id');
    const levelEl = document.getElementById('profile-page-level');
    const avatarEl = document.getElementById('profile-page-avatar');

    if (!nameEl) return;

    nameEl.innerText = document.querySelector('.user-name').innerText;
    levelEl.innerText = document.getElementById('user-level-display').innerText;

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        idEl.innerText = `ID: ${tg.initDataUnsafe.user.id}`;
        if (tg.initDataUnsafe.user.photo_url) {
            avatarEl.src = tg.initDataUnsafe.user.photo_url;
        }
    } else {
        idEl.innerText = "ID: Web_Guest_123";
    }
    
    const currentLevelColor = getComputedStyle(document.documentElement).getPropertyValue('--current-level-color');
    avatarEl.style.borderColor = currentLevelColor;
    levelEl.style.color = currentLevelColor;
}

// ==========================================
// 6. GAME ARCADE LOGIC
// ==========================================
let currentGameData = null; // Stores the data of the game currently being viewed

function renderGameArcade() {
    const grid = document.getElementById('game-arcade-grid');
    if (!grid) return;

    const games = JSON.parse(localStorage.getItem('app_games')) || [];

    if (games.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 50px 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🎮</div>
                <p>The arcade is currently empty. Games coming soon!</p>
            </div>`;
        return;
    }

    let html = '';
    // Store games data globally so the modal can access it
    window.arcadeGames = games; 

    games.forEach((game, index) => {
        html += `
            <div class="arcade-card" onclick="openGameDetails(${index})">
                <div class="arcade-icon">${game.icon}</div>
                <div class="arcade-title">${game.title}</div>
                <div class="arcade-reward">+ ${game.reward} 🪙</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function openGameDetails(index) {
    const game = window.arcadeGames[index];
    currentGameData = game; // Save for the Play button

    document.getElementById('modal-game-icon').innerText = game.icon;
    document.getElementById('modal-game-title').innerText = game.title;
    document.getElementById('modal-game-desc').innerText = game.desc;
    document.getElementById('modal-game-reward').innerText = `+ ${game.reward} 🪙 per win`;

    const modal = document.getElementById('game-details-modal');
    modal.style.display = 'flex';
    
    // Set the play button action
    document.getElementById('modal-play-btn').onclick = () => launchGame(game);
}

function closeGameDetails() {
    document.getElementById('game-details-modal').style.display = 'none';
}

async function launchGame(game) {
    closeGameDetails(); // Close the modal
    
    // Replace the entire app content with the actual game HTML
    try {
        const response = await fetch(`games/${game.file}.html`);
        if (!response.ok) throw new Error("Game file not found");
        
        const html = await response.text();
        appContent.innerHTML = html;
        
        // Hide bottom nav while playing for a full-screen experience
        document.getElementById('bottom-nav').style.display = 'none';
        
        // We trigger a custom event so the injected game HTML knows it has loaded 
        // and passes the reward amount to it
        setTimeout(() => {
            const event = new CustomEvent('gameLoaded', { detail: { reward: parseInt(game.reward) } });
            document.dispatchEvent(event);
        }, 100);

    } catch (err) {
        alert("Sorry, this game file is missing or broken!");
        // Simulate clicking the Game tab to reload the arcade
        document.querySelector('[data-icon="game-controller"]').parentElement.click();
    }
}

// Function to exit a game and return to arcade
function exitGame() {
    document.getElementById('bottom-nav').style.display = 'flex';
    document.querySelector('[data-icon="game-controller"]').parentElement.click();
}

// ==========================================
// 8. FIREBASE USER SYNC LOGIC
// ==========================================
async function syncUserData() {
    let userId = 'guest_123';
    let firstName = 'Guest User';

    // Grab real data if opened inside Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id.toString();
        firstName = tg.initDataUnsafe.user.first_name;
    }

    // Point to this specific user's document in the 'users' collection
    const userRef = db.collection('users').doc(userId);

    try {
        const docSnap = await userRef.get();

        if (docSnap.exists) {
            // USER EXISTS: Load their real balance from Firebase
            const userData = docSnap.data();
            updateWalletUI(userData.balance);
            console.log("User loaded from Firebase:", userData);
        } else {
            // NEW USER: Create their profile in Firebase
            await userRef.set({
                firstName: firstName,
                balance: 0,
                totalReferrals: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            updateWalletUI(0);
            console.log("New user created in Firebase!");
        }
    } catch (error) {
        console.error("Error syncing with Firebase:", error);
        // Fallback for testing offline
        updateWalletUI(6500); 
    }
}

// Helper function to update the top bar and level
function updateWalletUI(balance) {
    const walletDisplay = document.querySelector('.wallet span:first-child');
    if(walletDisplay) walletDisplay.innerText = balance.toLocaleString();
    
    // Automatically recalculate their level based on their real balance!
    calculateUserLevel(balance);
}

// Render products on the Store tab
function renderStoreProducts() {
    const grid = document.getElementById('store-product-grid');
    if (!grid) return;

    const items = JSON.parse(localStorage.getItem('app_store_items')) || [];

    if (items.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 50px 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🛍️</div>
                <p>The store is currently empty. More items coming soon!</p>
            </div>`;
        return;
    }

    // Reset grid display if it was changed
    grid.style.display = 'grid';
    let html = '';

    items.forEach(item => {
        // Format price nicely (e.g., 50000 -> 50k)
        let displayPrice = item.price >= 1000 ? (item.price / 1000) + 'k' : item.price;

        html += `
            <div class="store-product-card" onclick="openSubPage('withdraw', 'portal', 'Checkout - ${item.title}')">
                <div class="product-image-wrapper" style="background: ${item.theme};">
                    <div class="product-icon">${item.icon}</div>
                </div>
                <div class="product-details">
                    <h4 class="product-title">${item.title}</h4>
                    <p class="product-subtitle">${item.subtitle}</p>
                    <div class="product-bottom">
                        <span class="product-price">${displayPrice} 🪙</span>
                        <button class="buy-btn">Buy</button>
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// ==========================================
// 8. SUB-PAGE ROUTING LOGIC (History, Payments, etc.)
// ==========================================

async function openSubPage(folder, file, title) {
    const container = document.getElementById('subpage-container');
    const contentArea = document.getElementById('subpage-content');
    const titleArea = document.getElementById('subpage-title');
    
    // Set title and show loading state
    titleArea.innerText = title;
    contentArea.innerHTML = `<div style="text-align:center; padding-top: 50px;"><div class="skeleton" style="width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 20px;"></div><p style="color: var(--text-muted);">Loading...</p></div>`;
    
    // Slide it in immediately
    container.classList.add('open');

    try {
        // Fetch the file from the specific subfolder
        const response = await fetch(`additional/${folder}/${file}.html`);
        if (!response.ok) throw new Error("File not found");
        
        const html = await response.text();
        contentArea.innerHTML = html;

    } catch (error) {
        contentArea.innerHTML = `<div style="text-align:center; padding-top: 50px; color: #ff3b30;"><ion-icon name="alert-circle-outline" style="font-size: 3rem; margin-bottom: 10px;"></ion-icon><p>Screen under construction.</p></div>`;
    }
}

function closeSubPage() {
    document.getElementById('subpage-container').classList.remove('open');
    // Clear content after animation finishes to reset state
    setTimeout(() => {
        document.getElementById('subpage-content').innerHTML = '';
    }, 300);
}

// ==========================================
// 9. REFERRAL SYSTEM LOGIC
// ==========================================

function copyReferralLink() {
    // 1. Replace 'YourSuperBot' with your actual bot's username from BotFather
    const botUsername = 'YourSuperBot'; 
    let userId = 'guest_123';

    // 2. Get the real Telegram ID if available
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
    }

    // 3. Construct the deep link
    const refLink = `https://t.me/${botUsername}?start=ref_${userId}`;

    // 4. Copy to clipboard
    navigator.clipboard.writeText(refLink).then(() => {
        // Visual feedback for the user
        const statusBtn = document.getElementById('copy-status');
        if (statusBtn) {
            statusBtn.innerText = 'Copied! ✓';
            statusBtn.style.color = 'white';
            statusBtn.style.background = 'var(--success)'; // Green color
            
            // Reset button after 2 seconds
            setTimeout(() => {
                statusBtn.innerText = 'Copy';
                statusBtn.style.color = 'var(--text-muted)';
                statusBtn.style.background = 'var(--surface-light)';
            }, 2000);
        }
        
        // Use Telegram's native haptic feedback for a premium feel
        tg.HapticFeedback.notificationOccurred('success');
    }).catch(err => {
        alert("Failed to copy link. Please try again.");
    });
}

// ==========================================
// 9. INITIALIZATION ON LOAD
// ==========================================
window.onload = () => {
    checkTelegramEnvironment();

    // Set Name in the UI immediately
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const userNameEl = document.querySelector('.user-name');
        if(userNameEl) userNameEl.innerText = tg.initDataUnsafe.user.first_name;
    }

    // Connect to Firebase and fetch the real balance!
    syncUserData();

    // Load Home tab by default
    if (navItems.length > 0) {
        navigateTo('home', navItems[0]);
    }
};