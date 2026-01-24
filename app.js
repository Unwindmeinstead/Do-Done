// Done - Minimal To-Do App
// Main Application Script

class DoneApp {
    constructor() {
        this.tasks = [];
        this.settings = {
            voiceEnabled: true,
            hapticEnabled: true,
            compactMode: false,
            dailyReminder: false
        };
        this.currentPage = 0;
        this.currentFilter = 'all';
        this.selectedLabel = 'none';
        this.selectedPriority = 'normal';
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isRecording = false;
        this.recognition = null;
        this.holdTimer = null;
        this.deferredPrompt = null;

        this.init();
    }

    init() {
        this.loadData();
        this.renderPages();
        this.applySettings();
        this.setupEventListeners();
        this.setupSpeechRecognition();
        this.setupPWA();
        this.updateUI();
        this.updateDate();
    }

    // Data Management
    loadData() {
        const savedTasks = localStorage.getItem('done_tasks');
        const savedSettings = localStorage.getItem('done_settings');

        if (savedTasks) this.tasks = JSON.parse(savedTasks);
        if (savedSettings) this.settings = { ...this.settings, ...JSON.parse(savedSettings) };

        // Apply compact mode immediately
        if (this.settings.compactMode) document.body.classList.add('compact');
    }

    applySettings() {
        // Apply settings to UI elements after pages are rendered
        const savedMood = localStorage.getItem('done_mood_' + this.getTodayKey());
        if (savedMood) {
            const moodBtn = document.querySelector(`.mood-btn[data-mood="${savedMood}"]`);
            if (moodBtn) moodBtn.classList.add('active');
        }

        const voiceToggle = document.getElementById('voiceToggle');
        const hapticToggle = document.getElementById('hapticToggle');
        const compactToggle = document.getElementById('compactToggle');
        const reminderToggle = document.getElementById('reminderToggle');

        if (voiceToggle) voiceToggle.checked = this.settings.voiceEnabled;
        if (hapticToggle) hapticToggle.checked = this.settings.hapticEnabled;
        if (compactToggle) compactToggle.checked = this.settings.compactMode;
        if (reminderToggle) reminderToggle.checked = this.settings.dailyReminder;
    }

    saveData() {
        localStorage.setItem('done_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('done_settings', JSON.stringify(this.settings));
    }

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    // Render dynamic page content
    renderPages() {
        // Tasks Page
        document.getElementById('tasksPage').innerHTML = `
            <div class="tasks-list" id="tasksList">
                <div class="empty-state" id="emptyState">
                    <span class="empty-prompt">what are you getting done today?</span>
                </div>
            </div>
        `;

        // Insights Page
        document.getElementById('insightsPage').innerHTML = `
            <div class="page-header"><h2>Insights</h2></div>
            <div class="insights-content">
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-value" id="totalTasks">0</span><span class="stat-label">Total Tasks</span></div>
                    <div class="stat-card"><span class="stat-value" id="completedTasks">0</span><span class="stat-label">Completed</span></div>
                    <div class="stat-card"><span class="stat-value" id="completionRate">0%</span><span class="stat-label">Completion Rate</span></div>
                    <div class="stat-card"><span class="stat-value" id="streakCount">0</span><span class="stat-label">Day Streak</span></div>
                </div>
                <div class="insight-section">
                    <h3>Today's Mood</h3>
                    <div class="mood-selector">
                        <button class="mood-btn" data-mood="great" title="Great">😊</button>
                        <button class="mood-btn" data-mood="good" title="Good">🙂</button>
                        <button class="mood-btn" data-mood="okay" title="Okay">😐</button>
                        <button class="mood-btn" data-mood="low" title="Low">😔</button>
                        <button class="mood-btn" data-mood="stressed" title="Stressed">😫</button>
                    </div>
                </div>
                <div class="insight-section">
                    <h3>Labels</h3>
                    <div class="labels-container" id="labelsContainer">
                        <div class="label-item"><span class="label-dot" style="background:#FF6B6B"></span><span>Work</span><span class="label-count" id="workCount">0</span></div>
                        <div class="label-item"><span class="label-dot" style="background:#4ECDC4"></span><span>Personal</span><span class="label-count" id="personalCount">0</span></div>
                        <div class="label-item"><span class="label-dot" style="background:#95E1D3"></span><span>Health</span><span class="label-count" id="healthCount">0</span></div>
                        <div class="label-item"><span class="label-dot" style="background:#F8B500"></span><span>Ideas</span><span class="label-count" id="ideasCount">0</span></div>
                        <div class="label-item"><span class="label-dot" style="background:#FF4757"></span><span>Urgent</span><span class="label-count" id="urgentCount">0</span></div>
                    </div>
                </div>
                <div class="insight-section">
                    <h3>This Week</h3>
                    <div class="weekly-chart" id="weeklyChart">
                        <div class="chart-bar" data-day="Mon"><div class="bar-fill"></div><span>M</span></div>
                        <div class="chart-bar" data-day="Tue"><div class="bar-fill"></div><span>T</span></div>
                        <div class="chart-bar" data-day="Wed"><div class="bar-fill"></div><span>W</span></div>
                        <div class="chart-bar" data-day="Thu"><div class="bar-fill"></div><span>T</span></div>
                        <div class="chart-bar" data-day="Fri"><div class="bar-fill"></div><span>F</span></div>
                        <div class="chart-bar" data-day="Sat"><div class="bar-fill"></div><span>S</span></div>
                        <div class="chart-bar" data-day="Sun"><div class="bar-fill"></div><span>S</span></div>
                    </div>
                </div>
                <div class="insight-section">
                    <h3>Recent Activity</h3>
                    <div class="activity-list" id="activityList"><p class="no-activity">Complete tasks to see your activity</p></div>
                </div>
            </div>
        `;

        // Settings Page
        document.getElementById('settingsPage').innerHTML = `
            <div class="page-header"><h2>Settings</h2></div>
            <div class="settings-content">
                <div class="setting-group">
                    <h3>Input</h3>
                    <div class="setting-item">
                        <div class="setting-info"><span class="setting-title">Voice Input</span><span class="setting-desc">Hold the button to speak your task</span></div>
                        <label class="toggle"><input type="checkbox" id="voiceToggle" checked><span class="toggle-slider"></span></label>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info"><span class="setting-title">Haptic Feedback</span><span class="setting-desc">Vibrate on actions</span></div>
                        <label class="toggle"><input type="checkbox" id="hapticToggle" checked><span class="toggle-slider"></span></label>
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <div class="setting-info"><span class="setting-title">Theme</span><span class="setting-desc">Pitch dark & white</span></div>
                        <span class="setting-value">Default</span>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info"><span class="setting-title">Compact Mode</span><span class="setting-desc">Show more tasks on screen</span></div>
                        <label class="toggle"><input type="checkbox" id="compactToggle"><span class="toggle-slider"></span></label>
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Notifications</h3>
                    <div class="setting-item">
                        <div class="setting-info"><span class="setting-title">Daily Reminder</span><span class="setting-desc">Get reminded of pending tasks</span></div>
                        <label class="toggle"><input type="checkbox" id="reminderToggle"><span class="toggle-slider"></span></label>
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Data</h3>
                    <div class="setting-item clickable" id="exportPDF">
                        <div class="setting-info"><span class="setting-title">Export to PDF</span><span class="setting-desc">Download all tasks as PDF</span></div>
                        <svg class="setting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </div>
                    <div class="setting-item clickable" id="exportJSON">
                        <div class="setting-info"><span class="setting-title">Backup Data</span><span class="setting-desc">Export as JSON file</span></div>
                        <svg class="setting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </div>
                    <div class="setting-item clickable" id="importData">
                        <div class="setting-info"><span class="setting-title">Import Data</span><span class="setting-desc">Restore from backup</span></div>
                        <svg class="setting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    </div>
                    <div class="setting-item clickable danger" id="clearData">
                        <div class="setting-info"><span class="setting-title">Clear All Data</span><span class="setting-desc">Delete all tasks permanently</span></div>
                        <svg class="setting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </div>
                </div>
                <div class="setting-group">
                    <h3>About</h3>
                    <div class="setting-item">
                        <div class="setting-info"><span class="setting-title">Version</span></div>
                        <span class="setting-value">1.0.0</span>
                    </div>
                    <div class="setting-item clickable" id="installPWA" style="display: none;">
                        <div class="setting-info"><span class="setting-title">Install App</span><span class="setting-desc">Add to home screen</span></div>
                        <svg class="setting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                </div>
            </div>
        `;

        // Modal Content
        document.getElementById('modalContent').innerHTML = `
            <div class="modal-header">
                <h3>New Task</h3>
                <button class="modal-close" id="modalClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <input type="text" id="taskInput" placeholder="What needs to be done?" autocomplete="off" maxlength="200">
                    <span class="char-count"><span id="charCount">0</span>/200</span>
                </div>
                <div class="label-selection">
                    <span class="label-title">Label</span>
                    <div class="label-options">
                        <button class="label-option active" data-label="none"><span class="label-dot" style="background:#666"></span><span>None</span></button>
                        <button class="label-option" data-label="work"><span class="label-dot" style="background:#FF6B6B"></span><span>Work</span></button>
                        <button class="label-option" data-label="personal"><span class="label-dot" style="background:#4ECDC4"></span><span>Personal</span></button>
                        <button class="label-option" data-label="health"><span class="label-dot" style="background:#95E1D3"></span><span>Health</span></button>
                        <button class="label-option" data-label="ideas"><span class="label-dot" style="background:#F8B500"></span><span>Ideas</span></button>
                        <button class="label-option" data-label="urgent"><span class="label-dot" style="background:#FF4757"></span><span>Urgent</span></button>
                    </div>
                </div>
                <div class="priority-selection">
                    <span class="label-title">Priority</span>
                    <div class="priority-options">
                        <button class="priority-option active" data-priority="normal">Normal</button>
                        <button class="priority-option" data-priority="high">High</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" id="btnCancel">Cancel</button>
                <button class="btn-add" id="btnAdd" disabled>Add Task</button>
            </div>
        `;
    }

    setupEventListeners() {
        // Swipe navigation
        const menuContainer = document.getElementById('menuContainer');
        menuContainer.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: true });
        menuContainer.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: true });

        // Action button
        const actionBtn = document.getElementById('actionButton');
        actionBtn.addEventListener('click', () => this.openModal());
        actionBtn.addEventListener('touchstart', e => this.handleActionButtonDown(e), { passive: true });
        actionBtn.addEventListener('touchend', e => this.handleActionButtonUp(e), { passive: true });
        actionBtn.addEventListener('mousedown', e => this.handleActionButtonDown(e));
        actionBtn.addEventListener('mouseup', e => this.handleActionButtonUp(e));
        actionBtn.addEventListener('mouseleave', e => this.handleActionButtonUp(e));

        // Modal
        document.getElementById('modalBackdrop').addEventListener('click', () => this.closeModal());
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('btnAdd').addEventListener('click', () => this.addTask());

        // Task input
        const taskInput = document.getElementById('taskInput');
        taskInput.addEventListener('input', () => this.handleInputChange());
        taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') this.addTask(); });

        // Label selection
        document.querySelectorAll('.label-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.label-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedLabel = opt.dataset.label;
            });
        });

        // Priority selection
        document.querySelectorAll('.priority-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.priority-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedPriority = opt.dataset.priority;
            });
        });


        // Settings toggles
        document.getElementById('voiceToggle').addEventListener('change', e => {
            this.settings.voiceEnabled = e.target.checked;
            this.saveData();
        });
        document.getElementById('hapticToggle').addEventListener('change', e => {
            this.settings.hapticEnabled = e.target.checked;
            this.saveData();
        });
        document.getElementById('compactToggle').addEventListener('change', e => {
            this.settings.compactMode = e.target.checked;
            document.body.classList.toggle('compact', e.target.checked);
            this.saveData();
        });
        document.getElementById('reminderToggle').addEventListener('change', e => {
            this.settings.dailyReminder = e.target.checked;
            if (e.target.checked) this.requestNotificationPermission();
            this.saveData();
        });

        // Export/Import
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
        document.getElementById('exportJSON').addEventListener('click', () => this.exportToJSON());
        document.getElementById('importData').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', e => this.importData(e));
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        // Mood selector
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                localStorage.setItem('done_mood_' + this.getTodayKey(), btn.dataset.mood);
                this.haptic();
            });
        });

        // Install PWA button
        document.getElementById('installPWA')?.addEventListener('click', () => this.installPWA());
    }

    // Touch handling for swipe
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && this.currentPage < 2) {
                this.goToPage(this.currentPage + 1);
            } else if (diff < 0 && this.currentPage > 0) {
                this.goToPage(this.currentPage - 1);
            }
        }
    }

    goToPage(page) {
        this.currentPage = page;
        const track = document.getElementById('menuTrack');
        track.style.transform = `translateX(-${page * 100}%)`;
        this.haptic();
    }

    // Action button hold for voice
    handleActionButtonDown(e) {
        if (!this.settings.voiceEnabled) return;
        this.holdTimer = setTimeout(() => {
            this.startVoiceRecording();
        }, 500);
    }

    handleActionButtonUp(e) {
        if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
        if (this.isRecording) {
            this.stopVoiceRecording();
        }
    }

    // Speech Recognition
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('taskInput').value = transcript;
                this.handleInputChange();
                this.openModal();
            };

            this.recognition.onerror = () => {
                this.stopVoiceRecording();
                this.showToast('Voice recognition failed', 'error');
            };

            this.recognition.onend = () => {
                this.stopVoiceRecording();
            };
        }
    }

    startVoiceRecording() {
        if (!this.recognition) {
            this.showToast('Voice input not supported', 'error');
            return;
        }
        this.isRecording = true;
        document.getElementById('actionButton').classList.add('recording');
        document.getElementById('voiceIndicator').classList.add('active');
        this.recognition.start();
        this.haptic();
    }

    stopVoiceRecording() {
        this.isRecording = false;
        document.getElementById('actionButton').classList.remove('recording');
        document.getElementById('voiceIndicator').classList.remove('active');
        if (this.recognition) this.recognition.stop();
    }

    // Modal handling
    openModal() {
        document.getElementById('taskModal').classList.add('active');
        setTimeout(() => document.getElementById('taskInput').focus(), 300);
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskInput').value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('btnAdd').disabled = true;
        this.selectedLabel = 'none';
        this.selectedPriority = 'normal';
        document.querySelectorAll('.label-option').forEach((o, i) => o.classList.toggle('active', i === 0));
        document.querySelectorAll('.priority-option').forEach((o, i) => o.classList.toggle('active', i === 0));
    }

    handleInputChange() {
        const input = document.getElementById('taskInput');
        const count = input.value.length;
        document.getElementById('charCount').textContent = count;
        document.getElementById('btnAdd').disabled = count === 0;
    }

    // Task operations
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text,
            label: this.selectedLabel,
            priority: this.selectedPriority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveData();
        this.closeModal();
        this.renderTasks();
        this.updateStats();
        this.showToast('Task added', 'success');
        this.haptic();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveData();
            this.renderTasks();
            this.updateStats();
            this.haptic();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveData();
        this.renderTasks();
        this.updateStats();
        this.showToast('Task deleted', 'success');
        this.haptic();
    }

    renderTasks() {
        const list = document.getElementById('tasksList');
        const empty = document.getElementById('emptyState');

        let filtered = this.tasks;
        if (this.currentFilter === 'pending') filtered = this.tasks.filter(t => !t.completed);
        if (this.currentFilter === 'completed') filtered = this.tasks.filter(t => t.completed);

        if (filtered.length === 0) {
            empty.classList.remove('hidden');
            list.innerHTML = '';
            list.appendChild(empty);
            return;
        }

        empty.classList.add('hidden');
        const labelColors = {
            work: '#FF6B6B', personal: '#4ECDC4', health: '#95E1D3',
            ideas: '#F8B500', urgent: '#FF4757', none: '#666'
        };

        list.innerHTML = filtered.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <button class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask(${task.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12l5 5L20 7"/></svg>
                </button>
                <div class="task-content">
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        ${task.label !== 'none' ? `<span class="task-label"><span class="label-dot" style="background:${labelColors[task.label]}"></span>${task.label}</span>` : ''}
                        ${task.priority === 'high' ? '<span class="task-priority">High</span>' : ''}
                        <span class="task-time">${this.formatTime(task.createdAt)}</span>
                    </div>
                </div>
                <button class="task-delete" onclick="app.deleteTask(${task.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(iso) {
        const date = new Date(iso);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Stats and Insights
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('completionRate').textContent = rate + '%';

        // Label counts
        ['work', 'personal', 'health', 'ideas', 'urgent'].forEach(label => {
            const count = this.tasks.filter(t => t.label === label).length;
            const el = document.getElementById(label + 'Count');
            if (el) el.textContent = count;
        });

        // Streak calculation
        const streak = this.calculateStreak();
        document.getElementById('streakCount').textContent = streak;

        // Weekly chart
        this.updateWeeklyChart();

        // Recent activity
        this.updateRecentActivity();
    }

    calculateStreak() {
        const completedDates = [...new Set(
            this.tasks
                .filter(t => t.completed && t.completedAt)
                .map(t => new Date(t.completedAt).toDateString())
        )].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const dateStr of completedDates) {
            const date = new Date(dateStr);
            const diff = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
            if (diff === streak) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    updateWeeklyChart() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const weekData = Array(7).fill(0);

        this.tasks.filter(t => t.completed && t.completedAt).forEach(task => {
            const date = new Date(task.completedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (date >= weekAgo) {
                weekData[date.getDay()]++;
            }
        });

        const max = Math.max(...weekData, 1);
        document.querySelectorAll('.chart-bar').forEach((bar, i) => {
            const dayIndex = (today - 6 + i + 7) % 7;
            const fill = bar.querySelector('.bar-fill');
            fill.style.setProperty('--fill', `${(weekData[dayIndex] / max) * 100}%`);
            bar.classList.toggle('today', i === 6);
        });
    }

    updateRecentActivity() {
        const recent = this.tasks
            .filter(t => t.completed && t.completedAt)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 5);

        const list = document.getElementById('activityList');
        if (recent.length === 0) {
            list.innerHTML = '<p class="no-activity">Complete tasks to see your activity</p>';
            return;
        }

        list.innerHTML = recent.map(task => `
            <div class="activity-item">
                <div class="activity-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12l5 5L20 7"/></svg>
                </div>
                <span class="activity-text">${this.escapeHtml(task.text)}</span>
                <span class="activity-time">${this.formatTime(task.completedAt)}</span>
            </div>
        `).join('');
    }

    // Export to PDF
    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('Done - Task Export', 20, 25);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
        doc.text(`Total Tasks: ${this.tasks.length}`, 20, 42);

        let y = 55;
        doc.setFontSize(12);

        this.tasks.forEach((task, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const status = task.completed ? '✓' : '○';
            const label = task.label !== 'none' ? ` [${task.label}]` : '';
            const priority = task.priority === 'high' ? ' ⚡' : '';

            doc.text(`${status} ${task.text}${label}${priority}`, 20, y);
            y += 6;

            doc.setFontSize(9);
            doc.setTextColor(128);
            doc.text(`Created: ${new Date(task.createdAt).toLocaleString()}${task.completedAt ? ` | Completed: ${new Date(task.completedAt).toLocaleString()}` : ''}`, 25, y);
            doc.setTextColor(0);
            doc.setFontSize(12);
            y += 10;
        });

        doc.save('done-tasks.pdf');
        this.showToast('PDF exported', 'success');
    }

    // Export to JSON
    exportToJSON() {
        const data = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            tasks: this.tasks,
            settings: this.settings
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'done-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Backup exported', 'success');
    }

    // Import data
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.tasks) {
                    this.tasks = data.tasks;
                    if (data.settings) this.settings = { ...this.settings, ...data.settings };
                    this.saveData();
                    this.renderTasks();
                    this.updateStats();
                    this.showToast('Data imported successfully', 'success');
                }
            } catch (err) {
                this.showToast('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to delete all tasks? This cannot be undone.')) {
            this.tasks = [];
            this.saveData();
            this.renderTasks();
            this.updateStats();
            this.showToast('All data cleared', 'success');
        }
    }

    // Notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    // PWA Setup
    setupPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => { });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            const installBtn = document.getElementById('installPWA');
            if (installBtn) installBtn.style.display = 'flex';
        });
    }

    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then(() => {
                this.deferredPrompt = null;
                document.getElementById('installPWA').style.display = 'none';
            });
        }
    }

    // Utilities
    updateDate() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
    }

    updateUI() {
        this.renderTasks();
        this.updateStats();
        this.goToPage(0);
    }

    haptic() {
        if (this.settings.hapticEnabled && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize app
const app = new DoneApp();
