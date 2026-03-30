// Initialize settings on page load
window.onload = () => {
    // Check local storage for existing module states. 
    // If they don't exist, default to 'true' (enabled).
    const modules = ['earn', 'store', 'game', 'ads'];
    
    modules.forEach(mod => {
        let isEnabled = localStorage.getItem(`module_${mod}`);
        
        // If it hasn't been set yet, set it to true
        if (isEnabled === null) {
            localStorage.setItem(`module_${mod}`, 'true');
            isEnabled = 'true';
        }
        
        // Update the UI switch to match the saved state
        document.getElementById(`toggle-${mod}`).checked = (isEnabled === 'true');
    });
};

// Function called when a switch is flipped
function updateModule(moduleName, isEnabled) {
    // Save the state as a string in local storage
    localStorage.setItem(`module_${moduleName}`, isEnabled.toString());
    
    // Optional: Visual confirmation in console
    console.log(`Module '${moduleName}' is now ${isEnabled ? 'ON' : 'OFF'}`);
}

// --- LEVEL CALCULATOR LOGIC ---

// 1. Load existing thresholds when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // We set default values if none exist in local storage yet
    document.getElementById('lvl2-req').value = localStorage.getItem('lvl2_req') || 1000;
    document.getElementById('lvl3-req').value = localStorage.getItem('lvl3_req') || 5000;
    document.getElementById('lvl4-req').value = localStorage.getItem('lvl4_req') || 15000;
    document.getElementById('lvl5-req').value = localStorage.getItem('lvl5_req') || 50000;
});

// 2. Save settings when the button is clicked
function saveLevelSettings() {
    const l2 = document.getElementById('lvl2-req').value;
    const l3 = document.getElementById('lvl3-req').value;
    const l4 = document.getElementById('lvl4-req').value;
    const l5 = document.getElementById('lvl5-req').value;

    localStorage.setItem('lvl2_req', l2);
    localStorage.setItem('lvl3_req', l3);
    localStorage.setItem('lvl4_req', l4);
    localStorage.setItem('lvl5_req', l5);

    // Provide visual feedback
    const btn = document.querySelector('.btn-save');
    const originalText = btn.innerText;
    btn.innerText = "Saved Successfully! ✓";
    btn.style.backgroundColor = "var(--success)";
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.backgroundColor = "var(--accent)";
    }, 2000);
}
// --- MOBILE RESPONSIVE LOGIC ---

function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Toggle the 'show' class to trigger CSS animations
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

// --- TASK MANAGER LOGIC ---

// 1. Initialize tasks array from local storage (or empty array)
let activeTasks = JSON.parse(localStorage.getItem('app_tasks')) || [];

// 2. Render tasks when page loads
document.addEventListener('DOMContentLoaded', () => {
    renderAdminTasks();
});

// 3. Function to add a new task
function addTask() {
    const title = document.getElementById('task-title').value;
    const reward = document.getElementById('task-reward').value;
    const icon = document.getElementById('task-icon').value;
    const url = document.getElementById('task-url').value;

    // Basic validation
    if (!title || !reward || !url) {
        alert("Please fill in the Title, Reward, and URL.");
        return;
    }

    // Create task object with a unique ID
    const newTask = {
        id: Date.now().toString(),
        title: title,
        reward: reward,
        icon: icon,
        url: url
    };

    // Add to array and save
    activeTasks.push(newTask);
    localStorage.setItem('app_tasks', JSON.stringify(activeTasks));

    // Clear inputs
    document.getElementById('task-title').value = '';
    document.getElementById('task-reward').value = '';
    document.getElementById('task-url').value = '';

    // Update UI
    renderAdminTasks();
}

// 4. Function to delete a task
function deleteTask(id) {
    // Filter out the task with the matching ID
    activeTasks = activeTasks.filter(task => task.id !== id);
    localStorage.setItem('app_tasks', JSON.stringify(activeTasks));
    renderAdminTasks();
}

// 5. Function to render the list in the admin panel
function renderAdminTasks() {
    const container = document.getElementById('admin-task-list');
    container.innerHTML = ''; // Clear current list

    if (activeTasks.length === 0) {
        container.innerHTML = '<div class="empty-tasks">No active tasks. Add one above!</div>';
        return;
    }

    activeTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'admin-task-item';
        taskElement.innerHTML = `
            <div class="task-info-admin">
                <div class="task-icon-admin">${task.icon}</div>
                <div>
                    <h5 style="font-size: 1rem; margin-bottom: 3px;">${task.title}</h5>
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Reward: ${task.reward} 🪙</span>
                </div>
            </div>
            <button onclick="deleteTask('${task.id}')" class="btn-delete">Delete</button>
        `;
        container.appendChild(taskElement);
    });
}

// --- GAME MANAGER LOGIC ---
let activeGames = JSON.parse(localStorage.getItem('app_games')) || [];

document.addEventListener('DOMContentLoaded', () => {
    // Make sure this runs alongside renderAdminTasks()
    if(typeof renderAdminTasks === 'function') renderAdminTasks();
    renderAdminGames();
});

function addGame() {
    const title = document.getElementById('game-title').value;
    const reward = document.getElementById('game-reward').value;
    const icon = document.getElementById('game-icon').value || '🎮';
    const desc = document.getElementById('game-desc').value;
    const file = document.getElementById('game-file').value;

    if (!title || !reward || !desc || !file) {
        alert("Please fill in all game details.");
        return;
    }

    const newGame = {
        id: 'game_' + Date.now().toString(),
        title: title,
        reward: reward,
        icon: icon,
        desc: desc,
        file: file
    };

    activeGames.push(newGame);
    localStorage.setItem('app_games', JSON.stringify(activeGames));

    // Clear inputs
    document.getElementById('game-title').value = '';
    document.getElementById('game-reward').value = '';
    document.getElementById('game-desc').value = '';
    document.getElementById('game-file').value = '';

    renderAdminGames();
}

function deleteGame(id) {
    activeGames = activeGames.filter(game => game.id !== id);
    localStorage.setItem('app_games', JSON.stringify(activeGames));
    renderAdminGames();
}

function renderAdminGames() {
    const container = document.getElementById('admin-game-list');
    if (!container) return;
    container.innerHTML = ''; 

    if (activeGames.length === 0) {
        container.innerHTML = '<div class="empty-tasks">No games published. Add one above!</div>';
        return;
    }

    activeGames.forEach(game => {
        container.innerHTML += `
            <div class="admin-task-item">
                <div class="task-info-admin">
                    <div class="task-icon-admin">${game.icon}</div>
                    <div>
                        <h5 style="font-size: 1rem; margin-bottom: 3px;">${game.title}</h5>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">File: ${game.file}.html | Reward: ${game.reward} 🪙</span>
                    </div>
                </div>
                <button onclick="deleteGame('${game.id}')" class="btn-delete">Remove</button>
            </div>
        `;
    });
}

// --- STORE MANAGER LOGIC ---
let storeItems = JSON.parse(localStorage.getItem('app_store_items')) || [];

// Make sure to hook this into your existing DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    if(typeof renderAdminStore === 'function') renderAdminStore();
});

function addStoreItem() {
    const title = document.getElementById('store-title').value;
    const subtitle = document.getElementById('store-subtitle').value;
    const icon = document.getElementById('store-icon').value || '💳';
    const price = document.getElementById('store-price').value;
    const theme = document.getElementById('store-theme').value;

    if (!title || !subtitle || !price) {
        alert("Please fill in the Title, Subtitle, and Price.");
        return;
    }

    const newItem = {
        id: 'item_' + Date.now().toString(),
        title: title,
        subtitle: subtitle,
        icon: icon,
        price: parseInt(price),
        theme: theme
    };

    storeItems.push(newItem);
    localStorage.setItem('app_store_items', JSON.stringify(storeItems));

    // Clear inputs
    document.getElementById('store-title').value = '';
    document.getElementById('store-subtitle').value = '';
    document.getElementById('store-price').value = '';

    renderAdminStore();
}

function deleteStoreItem(id) {
    storeItems = storeItems.filter(item => item.id !== id);
    localStorage.setItem('app_store_items', JSON.stringify(storeItems));
    renderAdminStore();
}

function renderAdminStore() {
    const container = document.getElementById('admin-store-list');
    if (!container) return;
    container.innerHTML = ''; 

    if (storeItems.length === 0) {
        container.innerHTML = '<div class="empty-tasks">No products in store. Add one above!</div>';
        return;
    }

    storeItems.forEach(item => {
        container.innerHTML += `
            <div class="admin-task-item">
                <div class="task-info-admin">
                    <div class="task-icon-admin" style="background: ${item.theme}; border-radius: 8px; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; font-size: 1.5rem;">${item.icon}</div>
                    <div>
                        <h5 style="font-size: 1rem; margin-bottom: 3px;">${item.title}</h5>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${item.subtitle} | Price: ${item.price.toLocaleString()} 🪙</span>
                    </div>
                </div>
                <button onclick="deleteStoreItem('${item.id}')" class="btn-delete">Remove</button>
            </div>
        `;
    });
}