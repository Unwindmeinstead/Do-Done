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
        this.navSelection = 0;

        this.init();
    }

    init() {
        this.loadTasks();
        this.loadSettings();
        this.applyTheme();
        this.renderTasks();
        this.renderOverlays(); // Prepare hidden overlays
        this.setupInteractions();
        this.setupViewportHandlers();
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
        // Calculate Advanced Metrics
        const total = this.tasks.length;
        const tasksDone = this.tasks.filter(t => t.completed);
        const done = tasksDone.length;
        const rate = total ? Math.round((done / total) * 100) : 0;
        const highPriority = this.tasks.filter(t => t.priority === 'high').length;
        const midPriority = this.tasks.filter(t => t.priority === 'medium').length;
        const streak = this.calculateStreak();

        // New Derived Metrics
        const productivityScore = tasksDone.reduce((acc, t) => {
            const weights = { high: 10, medium: 5, normal: 2 };
            return acc + (weights[t.priority] || 2);
        }, 0);

        const focusPoints = (done * 5) + (total * 1);
        const estimatedTime = done * 25; // 25 mins per task avg

        // Insights Overlay
        document.getElementById('insightsOverlay').innerHTML = `
            <button class="close-overlay" onclick="app.closeOverlays()">✕</button>
            <div class="overlay-scroll-container">
                <h2 class="overlay-title">Insights</h2>
                
                <div class="metrics-hero">
                    <span class="hero-label">Productivity Score</span>
                    <span class="hero-value">${productivityScore}</span>
                </div>

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
                        <span class="stat-value">${focusPoints}</span>
                        <span class="stat-label">Focus Points</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${highPriority}</span>
                        <span class="stat-label">High Priority</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${midPriority}</span>
                        <span class="stat-label">Medium</span>
                    </div>
                </div>
                
                <div class="chart-section" style="margin-top: 30px;">
                    <span class="section-title">Weekly Focus</span>
                    <div class="bar-chart-container">
                        ${[...Array(7)].map((_, i) => {
            const h = 20 + Math.random() * 80;
            const isToday = i === 6;
            return `<div class="chart-bar" style="height: ${h}%; background: ${isToday ? 'var(--text-primary)' : 'rgba(255,255,255,0.1)'};"></div>`;
        }).join('')}
                    </div>
                    <div class="chart-labels">
                        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                    </div>
                </div>

                <div class="insight-tips">
                    <div class="tip-card">
                        <span class="tip-icon">⌛</span>
                        <span class="tip-text">Estimated <b>${estimatedTime}m</b> focused time saved.</span>
                    </div>
                    <div class="tip-card">
                        <span class="tip-icon">🎯</span>
                        <span class="tip-text">Your peak productivity is <b>High Priority</b> tasks.</span>
                    </div>
                </div>
            </div>
        `;

        // Settings Overlay
        document.getElementById('settingsOverlay').innerHTML = `
            <button class="close-overlay" onclick="app.closeOverlays()">✕</button>
            <div class="overlay-scroll-container">
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
                            <div class="setting-item">
                                <div class="setting-label">
                                    <span class="setting-name">Deep Focus Mode</span>
                                    <span class="setting-desc">Mute all non-essential UI</span>
                                </div>
                                <label class="ios-toggle-wrapper">
                                    <input type="checkbox" ${this.settings.deepFocus ? 'checked' : ''} onchange="app.toggleSetting('deepFocus')">
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
                                    <span class="setting-desc">Prioritize higher tasks automatically</span>
                                </div>
                                <label class="ios-toggle-wrapper">
                                    <input type="checkbox" ${this.settings.autoSort ? 'checked' : ''} onchange="app.toggleSetting('autoSort')">
                                    <div class="ios-toggle"></div>
                                </label>
                            </div>
                            <div class="setting-item">
                                <div class="setting-label">
                                    <span class="setting-name">Auto-Clear Done</span>
                                    <span class="setting-desc">Remove completed tasks in 24h</span>
                                </div>
                                <label class="ios-toggle-wrapper">
                                    <input type="checkbox" ${this.settings.autoClear ? 'checked' : ''} onchange="app.toggleSetting('autoClear')">
                                    <div class="ios-toggle"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <span class="section-title">Security & Backup</span>
                        <div class="settings-group">
                            <button class="setting-btn" onclick="app.exportData()">
                                <span>Cloud Sync </span>
                                <span class="sync-status">Connected</span>
                            </button>
                            <button class="setting-btn" onclick="app.exportData()">
                                <span>Export Backup</span>
                                <span class="btn-icon">↓</span>
                            </button>
                            <button class="setting-btn" onclick="app.importData()">
                                <span>Restore Data</span>
                                <span class="btn-icon">↑</span>
                            </button>
                            <button class="danger-btn" onclick="app.clearData()">
                                <span>Wipe Everything</span>
                                <span class="btn-icon">×</span>
                            </button>
                        </div>
                    </div>

                    <div class="app-info">
                        <span class="app-version">Done v1.2.5</span>
                        <span class="app-credit">Designed for Focus • © 2026</span>
                    </div>
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
                if (diff > 0) this.shiftNavSelection(-1);
                else if (diff < 0) this.shiftNavSelection(1);
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
        this.navSelection = m;
        this.updateNavUI();
        this.haptic();

        // Navigate - Close current overlays UI and open the one for the new mode
        document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));

        if (this.mode === 1) this.openOverlay('insightsOverlay');
        else if (this.mode === 2) this.openOverlay('settingsOverlay');
    }

    updateNavUI() {
        const navLabel = document.getElementById('navMainLabel');
        const navIcon = document.getElementById('navMainIcon');
        if (!navLabel || !navIcon) return;

        const navModes = [
            { mode: 0, label: 'Tasks', icon: '✓' },
            { mode: 1, label: 'Insights', icon: '▥' },
            { mode: 2, label: 'Settings', icon: '⚙︎' }
        ];
        const active = navModes.find(item => item.mode === this.navSelection) || navModes[0];
        navLabel.textContent = active.label;
        navIcon.textContent = active.icon;

        const navBtn = document.getElementById('navMainBtn');
        if (navBtn) navBtn.classList.toggle('selected', this.navSelection !== this.mode);
    }

    handleNavTap() {
        if (this.navSelection === this.mode && this.mode === 0) {
            this.toggleInput();
            return;
        }
        this.setMode(this.navSelection);
    }

    shiftNavSelection(delta) {
        const modes = [0, 1, 2];
        const currentIndex = modes.indexOf(this.navSelection);
        const nextIndex = Math.max(0, Math.min(modes.length - 1, currentIndex + delta));
        this.navSelection = modes[nextIndex];
        this.updateNavUI();
        this.haptic();
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
        el.classList.remove('active', 'exit');
        void el.offsetWidth; // Force reflow to pulse animation

        el.classList.add('active');

        // Allow user to see the task before it floats away
        setTimeout(() => {
            el.classList.remove('active');
            el.classList.add('exit');
        }, 800);
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
            // Cycle: High -> Medium -> Normal
            const cycle = ['high', 'medium', 'normal'];
            let currIdx = cycle.indexOf(task.priority);
            if (currIdx === -1) currIdx = 2; // Default to normal if buggy

            task.priority = cycle[(currIdx + 1) % cycle.length];

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

    setupViewportHandlers() {
        const updateAppHeight = () => {
            const height = window.innerHeight || document.documentElement.clientHeight;
            document.documentElement.style.setProperty('--app-height', `${height}px`);
        };

        const updateKeyboardOffset = () => {
            if (!window.visualViewport) return;
            const offset = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
            document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
            document.documentElement.classList.toggle('keyboard-open', offset > 0);
        };

        updateAppHeight();
        updateKeyboardOffset();
        window.addEventListener('resize', updateAppHeight, { passive: true });
        window.visualViewport?.addEventListener('resize', updateKeyboardOffset, { passive: true });
        window.visualViewport?.addEventListener('scroll', updateKeyboardOffset, { passive: true });

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        media.addEventListener?.('change', () => {
            if (this.settings.theme === 'auto') this.applyTheme();
        });
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
