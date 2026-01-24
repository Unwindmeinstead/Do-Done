// Done - Ultra Minimal Mode-Based PWA

class DoneApp {
    constructor() {
        this.tasks = [];
        this.settings = { haptics: true };
        this.mode = 0; // 0: Check, 1: Insights, 2: Settings
        this.inputActive = false;

        this.init();
    }

    init() {
        this.loadTasks();
        this.loadSettings();
        this.applyTheme();
        this.renderTasks();
        this.renderOverlays(); // Prepare hidden overlays
        this.setupInteractions();
        this.updateButtonIcon();
    }

    loadTasks() {
        const saved = localStorage.getItem('done_tasks');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    saveTasks() {
        localStorage.setItem('done_tasks', JSON.stringify(this.tasks));
    }

    loadSettings() {
        const saved = localStorage.getItem('done_settings');
        if (saved) this.settings = JSON.parse(saved);
    }

    saveSettings() {
        localStorage.setItem('done_settings', JSON.stringify(this.settings));
    }

    // --- Rendering ---

    renderTasks() {
        const list = document.getElementById('tasksList');
        if (this.tasks.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="empty-prompt">what are you getting done today?</span></div>`;
            return;
        }

        // Sort: High Priority > Normal > Completed
        const sorted = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
            return b.id - a.id;
        });

        list.innerHTML = sorted.map(t => {
            const dateStr = new Date(t.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return `
            <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
                <div class="task-checkbox ${t.completed ? 'checked' : ''}"></div>
                <div class="task-content">
                    <span class="task-text">${this.escape(t.text)}</span>
                    <div class="task-meta">
                        ${t.priority === 'high' ? '<span class="meta-priority">High Priority</span> • ' : ''}
                        <span>${dateStr}</span>
                    </div>
                </div>
                <button class="delete-btn">✕</button>
            </div>
        `}).join('');
    }

    renderOverlays() {
        // Calculate Metrics
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.completed).length;
        const rate = total ? Math.round((done / total) * 100) : 0;
        const highPriority = this.tasks.filter(t => t.priority === 'high').length;
        const streak = this.calculateStreak();

        // Insights Overlay
        document.getElementById('insightsOverlay').innerHTML = `
            <button class="close-overlay" onclick="app.closeOverlays()">✕</button>
            <h2>Insights</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${rate}%</span>
                    <span class="stat-label">Efficiency</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${streak}</span>
                    <span class="stat-label">Day Streak</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${done}</span>
                    <span class="stat-label">Completed</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${highPriority}</span>
                    <span class="stat-label">High Priority</span>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <span class="section-title">Weekly Focus</span>
                <div style="height: 140px; display: flex; align-items: flex-end; gap: 8px; margin-top: 20px;">
                    ${[...Array(7)].map((_, i) => {
            const h = 20 + Math.random() * 80;
            const isToday = i === 6;
            return `<div style="flex:1; background: ${isToday ? 'var(--text-primary)' : 'rgba(255,255,255,0.1)'}; height: ${h}%; border-radius: 8px; transition: height 1s ease;"></div>`;
        }).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; color: var(--text-tertiary); font-size: 10px; text-transform: uppercase;">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>
        `;

        // Settings Overlay
        document.getElementById('settingsOverlay').innerHTML = `
            <button class="close-overlay" onclick="app.closeOverlays()">✕</button>
            <h2>Settings</h2>
            
            <div class="settings-container">
                <div class="settings-section">
                    <span class="section-title">Preferences</span>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-label">
                                <span class="setting-name">Haptic Feedback</span>
                                <span class="setting-desc">Vibrate on interactions</span>
                            </div>
                            <label class="ios-toggle">
                                <input type="checkbox" ${this.settings.haptics ? 'checked' : ''} onchange="app.toggleSetting('haptics')">
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-label">
                                <span class="setting-name">Light Mode</span>
                                <span class="setting-desc">Experimental</span>
                            </div>
                            <label class="ios-toggle">
                                <input type="checkbox" ${this.settings.theme === 'light' ? 'checked' : ''} onchange="app.toggleSetting('theme')">
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <span class="section-title">Data</span>
                    <div class="settings-group">
                        <button class="danger-btn" onclick="app.clearData()">
                            <span>Clear All Data</span>
                            <span style="font-size: 18px;">›</span>
                        </button>
                    </div>
                </div>

                <div class="app-info">
                    <span class="app-version">Done v1.1.0</span>
                    <span class="app-credit">Designed for Focus</span>
                </div>
            </div>
        `;
    }

    // --- Interactions ---

    setupInteractions() {
        const btn = document.getElementById('actionButton');
        const inputContainer = document.getElementById('inputContainer');
        const input = document.getElementById('taskInput');
        const list = document.getElementById('tasksList');

        // Button Click Logic
        btn.addEventListener('click', () => {
            if (this.mode === 0) this.toggleInput();
            if (this.mode === 1) this.openOverlay('insightsOverlay');
            if (this.mode === 2) this.openOverlay('settingsOverlay');
            this.haptic();
        });

        // Swipe on Button Area
        let startX = 0;
        const bottomNav = document.getElementById('bottomNav');

        bottomNav.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
        bottomNav.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 30) {
                if (diff > 0 && this.mode > 0) this.mode--; // Swipe Right -> Left Mode
                else if (diff < 0 && this.mode < 2) this.mode++; // Swipe Left -> Right Mode

                this.updateButtonIcon();
                this.haptic();
            }
        }, { passive: true });

        // Input Handling
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.addTask();
        });

        // Flash Effect on Type
        let typeTimeout;
        input.addEventListener('input', () => {
            input.classList.add('typing');
            inputContainer.classList.add('typing');

            clearTimeout(typeTimeout);
            typeTimeout = setTimeout(() => {
                input.classList.remove('typing');
                inputContainer.classList.remove('typing');
            }, 100); // Fast flash
        });

        // Task List Delegation
        list.addEventListener('click', e => {
            // If input is active, close it (handled by global click, but let's ensure task interaction works)

            const item = e.target.closest('.task-item');
            if (!item) return;
            const id = parseInt(item.dataset.id);

            if (e.target.classList.contains('delete-btn')) {
                this.deleteTask(id);
            } else {
                this.toggleTask(id);
            }
        });

        // Global Click to close input
        document.addEventListener('click', (e) => {
            // If input is not active, ignore
            if (!this.inputActive) return;

            const isClickInsideInput = document.getElementById('inputContainer').contains(e.target);
            const isClickOnActionButton = document.getElementById('actionButton').contains(e.target);

            // If passed the checks, close it
            if (!isClickInsideInput && !isClickOnActionButton) {
                this.toggleInput();
            }
        });

        // Submit Button
        document.getElementById('submitBtn').addEventListener('click', () => this.addTask());
    }

    // --- Modes & UI ---

    updateButtonIcon() {
        const icons = [
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>', // Check
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-6"/></svg>', // Chart
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' // Gear
        ];

        document.getElementById('actionButton').innerHTML = icons[this.mode];
    }

    toggleInput() {
        const bar = document.getElementById('inputContainer');
        const isActive = bar.classList.contains('active');

        if (isActive) {
            bar.classList.remove('active');
            document.getElementById('taskInput').blur();
            document.getElementById('bottomNav').classList.remove('hidden');
            this.inputActive = false;
        } else {
            bar.classList.add('active');
            document.getElementById('bottomNav').classList.add('hidden');
            setTimeout(() => document.getElementById('taskInput').focus(), 100);
            this.inputActive = true;
        }
    }

    openOverlay(id) {
        document.getElementById(id).classList.add('active');
        this.renderOverlays(); // Refresh stats if opening insights
    }

    closeOverlays() {
        document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));
    }

    // --- Actions ---

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (!text) return;

        this.tasks.unshift({
            id: Date.now(),
            text,
            priority: 'normal',
            completed: false
        });

        this.saveTasks();
        this.renderTasks();
        input.value = '';

        // Flash input to signal success
        input.classList.remove('typing');
        document.getElementById('inputContainer').classList.remove('typing');

        // Recalculate overlays if open (live update)
        if (document.querySelector('.overlay-page.active')) {
            this.renderOverlays();
        }

        this.haptic();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.haptic();
        }
    }

    deleteTask(id) {
        if (confirm('Delete?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
        }
    }

    clearData() {
        if (confirm('Clear all tasks?')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.closeOverlays();
        }
    }

    toggleSetting(key) {
        if (key === 'theme') {
            this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
            this.applyTheme();
        } else if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = !this.settings[key];
            if (key === 'haptics' && this.settings.haptics) this.haptic();
        }
        this.saveSettings();
        this.renderOverlays(); // Re-render to show updated toggle state
    }

    applyTheme() {
        if (this.settings.theme === 'light') {
            document.body.setAttribute('data-theme', 'light');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#f2f2f7');
        } else {
            document.body.removeAttribute('data-theme');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#000000');
        }
    }

    calculateStreak() {
        // Simple mock streak calculation based on dates 
        return Math.floor(Math.random() * 5) + 1;
    }

    haptic() {
        if (!this.settings.haptics) return;
        if (navigator.vibrate) navigator.vibrate(10);
    }

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Start App
const app = new DoneApp();
window.app = app; // For onclick handlers in overlays
