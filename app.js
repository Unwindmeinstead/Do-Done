/* Done - Core Logic v2.0.0 */

class TaskApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('done_tasks')) || [];
        this.settings = JSON.parse(localStorage.getItem('done_settings')) || {
            haptics: true,
            theme: 'dark',
            autoSort: true
        };
        this.mode = 0; // 0: Tasks, 1: Insights, 2: Settings
        this.inputActive = false;

        this.init();
    }

    init() {
        this.renderTasks();
        this.applyTheme();
        this.setupInteractions();
        this.renderOverlays();
        this.updateNavUI();
    }

    // --- Data Persistence ---
    saveTasks() { localStorage.setItem('done_tasks', JSON.stringify(this.tasks)); }
    saveSettings() { localStorage.setItem('done_settings', JSON.stringify(this.settings)); }

    // --- UI Rendering ---
    renderTasks() {
        const list = document.getElementById('tasksList');
        if (!list) return;

        if (this.tasks.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding-top:100px; opacity:0.3;">
                <p style="font-size:20px; font-weight:600;">All Clear.</p>
                <p style="font-size:14px; margin-top:8px;">Ready for what's next?</p>
            </div>`;
            return;
        }

        // High > Mid > Normal > Completed
        const sorted = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const weight = { high: 2, medium: 1, normal: 0 };
            const wa = weight[a.priority] || 0;
            const wb = weight[b.priority] || 0;
            if (wa !== wb) return wb - wa;
            return b.id - a.id;
        });

        list.innerHTML = sorted.map(t => {
            const dateStr = new Date(t.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return `
            <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}" onclick="app.toggleTask(${t.id})">
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
        `;
        }).join('');
    }

    renderOverlays() {
        // Stats
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.completed).length;
        const rate = total ? Math.round((done / total) * 100) : 0;
        const streak = 3; // Placeholder

        document.getElementById('insightsOverlay').innerHTML = `
            <button class="close-overlay" onclick="app.closeOverlays()">✕</button>
            <h2>Insights</h2>
            <div class="stats-grid">
                <div class="stat-card"><span class="stat-value">${rate}%</span><span class="stat-label">Efficiency</span></div>
                <div class="stat-card"><span class="stat-value">${streak}</span><span class="stat-label">Streak</span></div>
                <div class="stat-card"><span class="stat-value">${done}</span><span class="stat-label">Finished</span></div>
                <div class="stat-card"><span class="stat-value">${this.tasks.filter(t => t.priority === 'high').length}</span><span class="stat-label">Priority Hits</span></div>
            </div>
            <div style="margin-top:40px; opacity:0.3; text-align:center; font-weight:600;">Weekly chart coming soon</div>
        `;

        document.getElementById('settingsOverlay').innerHTML = `
            <button class="close-overlay" onclick="app.closeOverlays()">✕</button>
            <h2>Settings</h2>
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
                    <div class="setting-label"><span class="setting-name">Appearance</span><span class="setting-desc">${this.settings.theme} mode</span></div>
                    <div style="font-size:20px;">${this.settings.theme === 'dark' ? '🌙' : '☀️'}</div>
                </div>
            </div>
            <div class="settings-group">
                <div class="setting-item" onclick="app.clearData()">
                    <div class="setting-label"><span class="setting-name" style="color:var(--danger)">Wipe Everything</span><span class="setting-desc">Reset all data</span></div>
                </div>
            </div>
            <div style="text-align:center; opacity:0.2; font-size:12px; margin-top:40px;">DONE v2.0.0 • Focused Design</div>
        `;
    }

    // --- Interactions v2.0 ---
    setupInteractions() {
        const nav = document.getElementById('bottomNav');
        const track = document.getElementById('navTrack');
        const inputDiv = document.getElementById('taskInput');

        let startX = 0;
        let isDragging = false;
        let lastShift = 0;
        const itemWidth = 86;
        const order = [1, 0, 2]; // Insights, Tasks, Settings

        nav.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            isDragging = false;
            track.style.transition = 'none';
            const index = order.indexOf(this.mode);
            lastShift = index * -itemWidth;
        }, { passive: true });

        nav.addEventListener('touchmove', e => {
            const moveX = e.touches[0].clientX - startX;
            if (Math.abs(moveX) > 5) isDragging = true;
            const shift = lastShift + moveX;
            const bounded = Math.max(-(itemWidth * 2), Math.min(0, shift));
            track.style.transform = `translateX(${bounded}px)`;
        }, { passive: true });

        nav.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].clientX - startX;
            track.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            const index = order.indexOf(this.mode);
            if (isDragging && Math.abs(diff) > 25) {
                if (diff > 0 && index > 0) this.selectMode(order[index - 1]);
                else if (diff < 0 && index < 2) this.selectMode(order[index + 1]);
                else this.updateNavUI();
            } else {
                this.updateNavUI();
            }
            if (isDragging) setTimeout(() => isDragging = false, 100);
        }, { passive: true });

        nav.addEventListener('click', (e) => {
            if (isDragging) return;
            this.activatePage();
            this.haptic();
        });

        inputDiv.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); this.addTask(); }
        });

        document.getElementById('submitBtn').addEventListener('click', () => this.addTask());

        document.addEventListener('click', (e) => {
            if (!this.inputActive) return;
            const container = document.getElementById('inputContainer');
            if (!container.contains(e.target) && !nav.contains(e.target)) this.toggleInput();
        });
    }

    selectMode(m) {
        if (this.mode === m) return;
        this.mode = m;
        this.updateNavUI();
        this.haptic();
    }

    activatePage() {
        if (this.mode === 0) { this.toggleInput(); return; }
        const id = this.mode === 1 ? 'insightsOverlay' : 'settingsOverlay';
        document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        this.haptic();
    }

    updateNavUI() {
        const order = [1, 0, 2];
        const index = order.indexOf(this.mode);
        document.getElementById('navTrack').style.transform = `translateX(${index * -86}px)`;
        document.querySelectorAll('.nav-item').forEach((el, i) => {
            el.classList.toggle('active-preview', i === index);
        });
    }

    toggleInput() {
        const bar = document.getElementById('inputContainer');
        if (this.inputActive) {
            bar.classList.remove('active');
            document.getElementById('taskInput').blur();
            this.inputActive = false;
        } else {
            document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));
            bar.classList.add('active');
            setTimeout(() => document.getElementById('taskInput').focus(), 200);
            this.inputActive = true;
        }
    }

    openOverlay(id) { document.getElementById(id).classList.add('active'); }
    closeOverlays() {
        document.querySelectorAll('.overlay-page').forEach(el => el.classList.remove('active'));
        this.mode = 0;
        this.updateNavUI();
    }

    // --- Core Actions ---
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.innerText.trim();
        if (!text) return;
        input.innerText = '';
        this.showSplash(text);
        this.haptic();
        setTimeout(() => {
            this.tasks.unshift({ id: Date.now(), text, priority: 'normal', completed: false });
            this.saveTasks(); this.renderTasks();
            input.focus();
        }, 300);
    }

    showSplash(text) {
        let el = document.getElementById('taskSplash');
        if (!el) {
            el = document.createElement('div'); el.id = 'taskSplash'; el.className = 'task-splash';
            document.body.appendChild(el);
        }
        el.innerText = text;
        el.classList.remove('active', 'exit');
        void el.offsetWidth;
        el.classList.add('active');
        setTimeout(() => { el.classList.remove('active'); el.classList.add('exit'); }, 800);
    }

    toggleTask(id) {
        const t = this.tasks.find(x => x.id === id);
        if (t) { t.completed = !t.completed; this.saveTasks(); this.renderTasks(); this.haptic(); }
    }

    togglePriority(id) {
        const t = this.tasks.find(x => x.id === id);
        if (t) {
            const c = ['normal', 'medium', 'high'];
            t.priority = c[(c.indexOf(t.priority) + 1) % 3];
            this.saveTasks(); this.renderTasks(); this.haptic();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks(); this.renderTasks(); this.haptic();
    }

    cycleTheme() {
        this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(); this.saveSettings(); this.renderOverlays(); this.haptic();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    toggleSetting(k) { this.settings[k] = !this.settings[k]; this.saveSettings(); }
    haptic() { if (this.settings.haptics && window.navigator.vibrate) window.navigator.vibrate(10); }
    escape(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
}

const app = new TaskApp();
window.app = app;
