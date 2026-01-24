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
            <div class="insights-content">
                <div class="stats-grid">
                    <div class="stat-card"><span class="stat-value" id="completedTasks">0</span><span class="stat-label">Done</span></div>
                    <div class="stat-card"><span class="stat-value" id="streakCount">0</span><span class="stat-label">Streak</span></div>
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
            </div>
        `;

        // Settings Page
        document.getElementById('settingsPage').innerHTML = `
            <div class="settings-content">
                <div class="setting-group">
                    <div class="setting-item">
                        <span class="setting-title">Voice Input</span>
                        <label class="toggle"><input type="checkbox" id="voiceToggle" checked><span class="toggle-slider"></span></label>
                    </div>
                    <div class="setting-item">
                        <span class="setting-title">Haptic</span>
                        <label class="toggle"><input type="checkbox" id="hapticToggle" checked><span class="toggle-slider"></span></label>
                    </div>
                    <div class="setting-item clickable" id="exportPDF">
                        <span class="setting-title">Export PDF</span>
                    </div>
                    <div class="setting-item clickable danger" id="clearData">
                        <span class="setting-title">Clear Data</span>
                    </div>
                </div>
            </div>
        `;

        // Minimal Input Modal
        document.getElementById('modalContent').innerHTML = `
            <div class="minimal-input-container">
                <input type="text" id="taskInput" placeholder="Type a task..." autocomplete="off">
                <button class="priority-wheel" id="priorityWheel" data-priority="normal">
                    <div class="priority-dot"></div>
                </button>
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
        actionBtn.addEventListener('click', () => this.handleActionClick());
        // Long press for voice
        actionBtn.addEventListener('touchstart', e => this.handleActionButtonDown(e), { passive: true });
        actionBtn.addEventListener('touchend', e => this.handleActionButtonUp(e), { passive: true });
        actionBtn.addEventListener('mousedown', e => this.handleActionButtonDown(e));
        actionBtn.addEventListener('mouseup', e => this.handleActionButtonUp(e));

        // Modal (Close on backdrop click)
        document.getElementById('modalBackdrop').addEventListener('click', () => this.closeModal());

        // Minimal Input
        const taskInput = document.getElementById('taskInput');
        taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') this.addTask(); });

        // Priority Wheel
        document.getElementById('priorityWheel').addEventListener('click', (e) => this.togglePriority(e));

        // Event Delegation for Task List (Fast & Responsive)
        document.getElementById('tasksList').addEventListener('click', (e) => this.handleTaskListClick(e));

        // Settings
        document.getElementById('voiceToggle').addEventListener('change', e => {
            this.settings.voiceEnabled = e.target.checked;
            this.saveData();
        });
        document.getElementById('hapticToggle').addEventListener('change', e => {
            this.settings.hapticEnabled = e.target.checked;
            this.saveData();
        });
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());
    }

    handleTaskListClick(e) {
        // Check for checkbox click
        const checkbox = e.target.closest('.task-checkbox');
        if (checkbox) {
            const id = parseInt(checkbox.dataset.id);
            this.toggleTask(id);
            return;
        }

        // Check for delete click
        const delBtn = e.target.closest('.task-delete');
        if (delBtn) {
            const id = parseInt(delBtn.dataset.id);
            this.deleteTask(id);
            return;
        }
    }

    // Dynamic Action Button
    updateActionButton() {
        const btn = document.getElementById('actionButton');
        const iconCheck = btn.querySelector('.icon-check');
        const iconMic = btn.querySelector('.icon-mic');

        // Reset state
        btn.innerHTML = '';
        btn.className = 'action-button';

        if (this.currentPage === 0) { // Tasks
            // Show Checkmark (or Mic if recording, handled separately)
            btn.innerHTML = `
                <svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>
                <div class="mic-pulse"></div>
            `;
        } else if (this.currentPage === 1) { // Insights
            // Show Chart Icon
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            `;
        } else if (this.currentPage === 2) { // Settings
            // Show Gear Icon
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            `;
        }
    }

    handleActionClick() {
        if (this.currentPage === 0) {
            this.openModal();
        } else {
            // In other pages, clicking might cycle view or do nothing? 
            // For now, let's make it always go back to tasks if clicked in other views?
            // "Check mark where we click to enter our tasks" - user said. 
            // So if I'm in settings, and I see a Gear, clicking it could Open Settings? 
            // Or maybe it acts as a "Home" button?
            // User: "when i swipe right over the check button, i dont see it swap to another menu icon... i want that"
            // Let's assume the button is purely an indicator + action trigger for that page.
            // But 'enter our tasks' implies Task Entry.
            // Let's keep it simple: Click always adds task for now, but UI shows where you are.
            // Actually, if I'm on Settings, I probably shouldn't be adding a task.
            // Let's make it: Page 0 -> Add Task. Page 1/2 -> Do nothing (just indicator) or Go back?
            // "Check mark where we click to enter our tasks." implies only Checkmark does that.

            // Let's enable "Go to Tasks" if not on Tasks page.
            this.goToPage(0);
        }
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
        this.updateActionButton(); // Update icon
    }

    // ... Voice handling remains similar ... 
    handleActionButtonDown(e) {
        if (!this.settings.voiceEnabled || this.currentPage !== 0) return;
        this.holdTimer = setTimeout(() => {
            this.startVoiceRecording();
        }, 500);
    }
    // ...

    // Modal
    openModal() {
        document.getElementById('taskModal').classList.add('active');
        setTimeout(() => document.getElementById('taskInput').focus(), 100);
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        const input = document.getElementById('taskInput');
        input.value = '';
        input.blur();
        this.selectedPriority = 'normal';
        this.updatePriorityDisplay();
    }

    togglePriority(e) {
        e.preventDefault();
        this.selectedPriority = this.selectedPriority === 'normal' ? 'high' : 'normal';
        this.updatePriorityDisplay();
        this.haptic();
    }

    updatePriorityDisplay() {
        const wheel = document.getElementById('priorityWheel');
        wheel.setAttribute('data-priority', this.selectedPriority);
    }

    // Task Logic - Simplified & Fast
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text,
            priority: this.selectedPriority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveData();
        this.closeModal(); // Close immediately
        this.renderTasks(); // Fast re-render
        // No toast
        this.haptic();
    }

    toggleTask(id) {
        // Fast toggle finding
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveData();
            // Optimistic UI update could go here, but renderTasks is fast enough for now
            this.renderTasks();
            this.haptic();
        }
    }

    deleteTask(id) {
        if (confirm('Delete?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveData();
            this.renderTasks();
            this.haptic();
        }
    }

    renderTasks() {
        const list = document.getElementById('tasksList');
        // Only show pending at top? Or sorted? User kept it simple "task shows up".
        // Let's separate completed to bottom.

        if (this.tasks.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="empty-prompt">what are you getting done today?</span></div>`;
            return;
        }

        // Sort: High priority first, then normal. Completed last.
        const sorted = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
            return b.id - a.id; // Newest first
        });

        list.innerHTML = sorted.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12l5 5L20 7"/></svg>
                </div>
                <div class="task-content">
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    ${task.priority === 'high' && !task.completed ? '<div class="priority-dot-indicator"></div>' : ''}
                </div>
                <button class="task-delete" data-id="${task.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
