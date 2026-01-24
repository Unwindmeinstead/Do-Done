// Done - Ultra Minimal Mode-Based PWA

class DoneApp {
    constructor() {
        this.settings = {
            haptics: true,
            theme: 'dark', // 'dark', 'light', 'auto'
            autoSort: true,
            hideCompleted: false,
            accentColor: '#ffffff'
        };
        this.mode = 0; // 0: Tasks, 1: Insights, 2: Settings
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
        setTimeout(() => this.updateNavUI(), 100);
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

        // Sort: High > Mid > Normal > Completed
        const sorted = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const priorityWeight = { high: 2, medium: 1, normal: 0 };
            const weightA = priorityWeight[a.priority] || 0;
            const weightB = priorityWeight[b.priority] || 0;
            if (weightA !== weightB) return weightB - weightA;
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
                        ${t.priority === 'high' ? '<span class="meta-priority high">High Priority</span> • ' : t.priority === 'medium' ? '<span class="meta-priority mid">Medium</span> • ' : ''}
                        <span>${dateStr}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="priority-dot-btn p-${t.priority}" onclick="event.stopPropagation(); app.togglePriority(${t.id})">
                        <div class="priority-dot"></div>
                    </button>
                    <button class="delete-btn" onclick="event.stopPropagation(); app.deleteTask(${t.id})">✕</button>
                </div>
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
            <h2 class="settings-title">Settings</h2>
            
            <div class="settings-container">
                <div class="settings-section">
                    <span class="section-title">Preference</span>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-label">
                                <span class="setting-name">Haptic Feedback</span>
                                <span class="setting-desc">Tactile response on actions</span>
                            </div>
                            <label class="ios-toggle-wrapper">
                                <input type="checkbox" ${this.settings.haptics ? 'checked' : ''} onchange="app.toggleSetting('haptics')">
                                <div class="ios-toggle"></div>
                            </label>
                        </div>
                        <div class="setting-item" onclick="app.cycleTheme()">
                            <div class="setting-label">
                                <span class="setting-name">Appearance</span>
                                <span class="setting-desc">${this.settings.theme.charAt(0).toUpperCase() + this.settings.theme.slice(1)} Mode</span>
                            </div>
                            <div class="setting-value-hint">
                                ${this.settings.theme === 'dark' ? '🌙' : this.settings.theme === 'light' ? '☀️' : '🌗'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <span class="section-title">Workflow</span>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-label">
                                <span class="setting-name">Auto-Sort</span>
                                <span class="setting-desc">Keep priority tasks at top</span>
                            </div>
                            <label class="ios-toggle-wrapper">
                                <input type="checkbox" ${this.settings.autoSort ? 'checked' : ''} onchange="app.toggleSetting('autoSort')">
                                <div class="ios-toggle"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <span class="section-title">Data</span>
                    <div class="settings-group">
                        <button class="setting-btn" onclick="app.exportData()">
                            <span>Export JSON</span>
                            <span class="btn-icon">↓</span>
                        </button>
                        <button class="setting-btn" onclick="app.importData()">
                            <span>Import JSON</span>
                            <span class="btn-icon">↑</span>
                        </button>
                        <button class="danger-btn" onclick="app.clearData()">
                            <span>Clear All Data</span>
                            <span class="btn-icon">×</span>
                        </button>
                    </div>
                </div>

                <div class="app-info">
                    <span class="app-version">Done v1.3.0</span>
                    <span class="app-credit">Designed for Focus</span>
                </div>
            </div>
        `;
    }

    // --- Interactions ---

    setupInteractions() {
        const inputContainer = document.getElementById('inputContainer');
        const input = document.getElementById('taskInput');
        const list = document.getElementById('tasksList');
        const bottomNav = document.getElementById('bottomNav');

        // Swipe on Button Area
        let startX = 0;
        bottomNav.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
        bottomNav.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 40) {
                if (diff > 0 && this.mode > 0) this.setMode(this.mode - 1);
                else if (diff < 0 && this.mode < 2) this.setMode(this.mode + 1);
            }
        }, { passive: true });

        // Input Handling
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent new line in contenteditable
                this.addTask();
            }
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

        // Task List Delegation - Simplified since buttons have inline handlers now
        list.addEventListener('click', e => {
            const item = e.target.closest('.task-item');
            if (!item) return;
            const id = parseInt(item.dataset.id);

            // Only toggle completion if we didn't click actions (handled by stopPropagation above, but good to be safe)
            if (!e.target.closest('.task-actions')) {
                this.toggleTask(id);
            }
        });

        // Global Click to close input
        document.addEventListener('click', (e) => {
            // If input is not active, ignore
            if (!this.inputActive) return;

            const isClickInsideInput = document.getElementById('inputContainer').contains(e.target);
            const isClickOnNav = document.getElementById('bottomNav').contains(e.target);

            // If passed the checks, close it
            if (!isClickInsideInput && !isClickOnNav) {
                this.toggleInput();
            }
        });

        // Submit Button
        document.getElementById('submitBtn').addEventListener('click', () => this.addTask());
    }

    // --- Modes & UI ---

    setMode(m) {
        if (this.mode === m && m !== 0) return; // Already there, unless it's tasks where we might want to toggle input

        if (this.mode === 0 && m === 0) {
            this.toggleInput();
            return;
        }

        this.mode = m;
        this.updateNavUI();
        this.haptic();

        // Navigate - Close current overlays UI and open the one for the new mode
        document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));

        if (this.mode === 1) this.openOverlay('insightsOverlay');
        else if (this.mode === 2) this.openOverlay('settingsOverlay');
    }

    updateNavUI() {
        // Update active class on items
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.mode) === this.mode);
        });

        // Move indicator
        const indicator = document.getElementById('navIndicator');
        const items = [
            document.getElementById('navInsights'),
            document.getElementById('navTasks'),
            document.getElementById('navSettings')
        ];

        // The modes are 0:Tasks, 1:Insights, 2:Settings. 
        // In HTML they are ordered: Insights (1), Tasks (0), Settings (2)
        const order = [1, 0, 2];
        const index = order.indexOf(this.mode);

        if (indicator) {
            const track = document.getElementById('navTrack');
            const trackWidth = track.offsetWidth || 204; // Fallback if not yet rendered
            const itemWidth = (trackWidth) / 3;
            indicator.style.width = `${itemWidth}px`;
            indicator.style.transform = `translateX(${index * itemWidth}px)`;
        }
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
            // Small delay to ensure transition starts
            setTimeout(() => {
                const el = document.getElementById('taskInput');
                el.focus();
                // Move cursor to end if needed (though usually empty)
            }, 100);
            this.inputActive = true;
        }
    }

    openOverlay(id) {
        document.getElementById(id).classList.add('active');
        this.renderOverlays(); // Refresh stats if opening insights
    }

    closeOverlays() {
        document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));
        this.mode = 0;
        this.updateNavUI();
    }

    // --- Actions ---

    addTask() {
        const input = document.getElementById('taskInput');
        // contenteditable uses innerText/textContent
        const text = input.innerText.trim();

        if (!text) return;

        // Visual Feedback Immediate
        input.innerText = ''; // Clear text content
        input.classList.remove('typing');
        document.getElementById('inputContainer').classList.remove('typing');

        this.showSplash(text);
        this.haptic();

        // Faster commit to list
        setTimeout(() => {
            this.commitTask(text);
            document.getElementById('taskInput').focus();
        }, 350);
    }

    commitTask(text) {
        this.tasks.unshift({
            id: Date.now(),
            text,
            priority: 'normal',
            completed: false
        });

        this.saveTasks();
        this.renderTasks();

        // Recalculate overlays if open (live update)
        if (document.querySelector('.overlay-page.active')) {
            this.renderOverlays();
        }
    }

    showSplash(text) {
        let el = document.getElementById('taskSplash');
        if (!el) {
            el = document.createElement('div');
            el.id = 'taskSplash';
            el.className = 'task-splash';
            document.body.appendChild(el);
        }

        el.innerText = text;
        el.classList.remove('exit');
        requestAnimationFrame(() => el.classList.add('active'));

        setTimeout(() => {
            el.classList.add('exit');
            el.classList.remove('active');
        }, 300); // Shorter display time
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

    togglePriority(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const cycle = ['normal', 'medium', 'high'];
            let idx = cycle.indexOf(task.priority);
            task.priority = cycle[(idx + 1) % cycle.length];

            this.saveTasks();
            this.renderTasks();
            this.haptic();
        }
    }

    deleteTask(id) {
        this.openConfirm('Delete this task?', () => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.closeConfirm();
            this.haptic();
        });
    }

    openConfirm(msg, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const btn = document.getElementById('confirmActionBtn');
        document.getElementById('confirmMessage').innerText = msg;

        modal.classList.add('active');
        btn.onclick = onConfirm;
        this.haptic();
    }

    closeConfirm() {
        document.getElementById('confirmModal').classList.remove('active');
    }

    clearData() {
        this.openConfirm('Clear all data?', () => {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.closeConfirm();
            this.closeOverlays();
            this.haptic();
        });
    }

    toggleSetting(key) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = !this.settings[key];
            this.saveSettings();
            if (key === 'haptics' && this.settings.haptics) this.haptic();
            if (key === 'autoSort') this.renderTasks();
        }
    }

    cycleTheme() {
        const themes = ['dark', 'light', 'auto'];
        let idx = themes.indexOf(this.settings.theme);
        this.settings.theme = themes[(idx + 1) % themes.length];
        this.applyTheme();
        this.saveSettings();
        this.renderOverlays(); // Update hint
        this.haptic();
    }

    applyTheme() {
        if (this.settings.theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#ffffff');
        } else if (this.settings.theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#000000');
        } else {
            // Auto - check system
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) document.documentElement.removeAttribute('data-theme');
            else document.documentElement.setAttribute('data-theme', 'light');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', isDark ? '#000000' : '#ffffff');
        }
    }

    exportData() {
        const data = JSON.stringify({ tasks: this.tasks, settings: this.settings });
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `done-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        this.haptic();
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.tasks) this.tasks = data.tasks;
                    if (data.settings) this.settings = { ...this.settings, ...data.settings };
                    this.saveTasks();
                    this.saveSettings();
                    this.renderTasks();
                    this.renderOverlays();
                    this.applyTheme();
                    alert('Import successful!');
                } catch (err) {
                    alert('Invalid file format.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
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
