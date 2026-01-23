import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Settings,
  BarChart3,
  Trash2,
  Download,
  Mic,
  X,
  ChevronRight,
} from 'lucide-react';

const DoneApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentBottomMenu, setCurrentBottomMenu] = useState(0); // 0=Add, 1=Settings, 2=Stats

  const [selectedMood, setSelectedMood] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);

  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const touchStartX = useRef(null);

  const moods = ['😈 Naughty', '🥵 Horny', '😏 Tease', '🔥 Passion', '😌 Chill', '💦 Wet', '😴 Sleepy', '🎯 Focused'];
  const labels = ['Work', 'Self', 'Play', 'Body', 'Mind', 'Date', 'Kink', 'Goals'];

  // ─── Load / Save ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const tasksData = localStorage.getItem('done-tasks');
      if (tasksData) setTasks(JSON.parse(tasksData));

      const voiceData = localStorage.getItem('done-voice');
      if (voiceData !== null) setVoiceEnabled(JSON.parse(voiceData));
    } catch (e) {
      console.warn('Error loading data:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('done-tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Error saving tasks:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('done-voice', JSON.stringify(voiceEnabled));
    } catch (e) {
      console.warn('Error saving voice setting:', e);
    }
  }, [voiceEnabled]);

  // ─── Voice Recognition ─────────────────────────────────────────
  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

    setIsRecording(true);
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Speech();
    recognitionRef.current = rec;

    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.trim();
      if (text) {
        setNewTask(text);
        setShowTaskInput(true);
      }
    };

    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);

    rec.start();
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  // ─── Touch swipe for bottom carousel ───────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const min = 50;

    if (diff > min && currentBottomMenu < 2) {
      setCurrentBottomMenu((p) => p + 1);
    } else if (diff < -min && currentBottomMenu > 0) {
      setCurrentBottomMenu((p) => p - 1);
    }
    touchStartX.current = null;
  };

  // ─── Long-press → voice, tap → input ───────────────────────────
  const handleCheckTouchStart = () => {
    if (!voiceEnabled || currentBottomMenu !== 0) return;
    const timer = setTimeout(() => {
      startVoice();
    }, 420);
    return () => clearTimeout(timer);
  };

  const handleCheckTouchEnd = () => {
    if (isRecording) {
      stopVoice();
    } else if (currentBottomMenu === 0) {
      setShowTaskInput(true);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const addTask = () => {
    const trimmed = newTask.trim();
    if (!trimmed) return;

    const task = {
      id: Date.now(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      mood: selectedMood,
      labels: selectedLabels,
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask('');
    setSelectedMood('');
    setSelectedLabels([]);
    setShowTaskInput(false);
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null,
            }
          : t
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleLabel = (label) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  // ─── Export (txt for simplicity – can later do real PDF) ───────
  const exportTasks = () => {
    const lines = [
      '🔥 DONE — Sexy Task Export',
      `Generated: ${new Date().toLocaleString()}\n`,
      ...tasks.map(
        (t, i) => `${i + 1}. ${t.completed ? '✓' : '○'} ${t.text}
   ${t.mood ? `Mood: ${t.mood}` : ''}
   ${t.labels.length ? `Tags: ${t.labels.join(', ')}` : ''}
   Created: ${new Date(t.createdAt).toLocaleString()}
   ${t.completedAt ? `Done: ${new Date(t.completedAt).toLocaleString()}` : ''}`
      ),
      '\n📊 STATS',
      `Total: ${tasks.length}`,
      `Completed: ${tasks.filter((t) => t.completed).length}`,
      `Pending: ${tasks.filter((t) => !t.completed).length}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `done-sexy-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completed = tasks.filter((t) => t.completed).length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const topMood = (() => {
    const counts = {};
    tasks.forEach((t) => t.mood && (counts[t.mood] = (counts[t.mood] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  })();

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black via-zinc-950 to-black text-white font-['Poppins'] overflow-hidden select-none">
      {/* Status bar spacer */}
      <div className="h-[env(safe-area-inset-top)]" />

      {/* Main scrollable content */}
      <div className="absolute inset-0 overflow-y-auto px-5 pt-4 pb-44">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
            <p className="text-xl font-light">Nothing yet...</p>
            <p className="text-sm mt-3 opacity-60">Tap the glowing button below</p>
          </div>
        ) : (
          <div className="space-y-3.5 pb-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="group relative bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white/8 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-1 w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      task.completed
                        ? 'bg-gradient-to-br from-pink-500 to-rose-600 border-transparent scale-110'
                        : 'border-zinc-500 group-hover:border-zinc-300'
                    }`}
                  >
                    {task.completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-base leading-snug transition-all ${
                        task.completed ? 'line-through text-zinc-500' : 'text-white'
                      }`}
                    >
                      {task.text}
                    </p>

                    {(task.mood || task.labels.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {task.mood && (
                          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-full border border-purple-500/30">
                            {task.mood}
                          </span>
                        )}
                        {task.labels.map((lbl) => (
                          <span
                            key={lbl}
                            className="text-xs px-2.5 py-1 bg-zinc-800/70 rounded-full border border-zinc-700"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-zinc-500 mt-2.5">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-40 hover:opacity-100 text-rose-400 transition-opacity p-1 -mr-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Floating Input Modal ────────────────────────────────────── */}
      {showTaskInput && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-end">
          <div className="w-full bg-gradient-to-b from-zinc-900 to-black border-t border-zinc-700/50 rounded-t-3xl p-6 pb-10 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-medium bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                New Desire
              </h2>
              <button onClick={() => setShowTaskInput(false)} className="p-2 -mr-2">
                <X size={24} />
              </button>
            </div>

            <input
              ref={inputRef}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="What's burning in your mind...?"
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-5 py-4 text-lg placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-all"
              autoFocus
            />

            {/* Mood pills */}
            <div className="mt-6">
              <p className="text-sm text-zinc-400 mb-2.5">Vibe</p>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood((p) => (p === m ? '' : m))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedMood === m
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-900/40 scale-105'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Labels */}
            <div className="mt-6">
              <p className="text-sm text-zinc-400 mb-2.5">Tags</p>
              <div className="flex flex-wrap gap-2">
                {labels.map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => toggleLabel(lbl)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedLabels.includes(lbl)
                        ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md shadow-purple-900/30'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={addTask}
              className="mt-8 w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium py-4 rounded-2xl transition-all shadow-xl shadow-rose-900/40 active:scale-[0.98]"
            >
              Add to List
            </button>
          </div>
        </div>
      )}

      {/* ─── Sexy bottom carousel ────────────────────────────────────── */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/70">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentBottomMenu * 100}%)` }}
          >
            {/* ADD BUTTON PANEL */}
            <div className="w-full flex-shrink-0 py-7 px-8 flex flex-col items-center">
              <button
                onTouchStart={handleCheckTouchStart}
                onTouchEnd={handleCheckTouchEnd}
                onMouseDown={handleCheckTouchStart}
                onMouseUp={handleCheckTouchEnd}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isRecording
                    ? 'bg-rose-600 animate-pulse scale-110 shadow-rose-900/60'
                    : 'bg-gradient-to-br from-white via-zinc-100 to-white hover:scale-110 active:scale-95 shadow-zinc-950/70'
                }`}
              >
                {isRecording ? (
                  <Mic className="w-9 h-9 text-white" strokeWidth={2.5} />
                ) : (
                  <Check className="w-9 h-9 text-black" strokeWidth={3} />
                )}
              </button>

              {voiceEnabled && !isRecording && (
                <p className="text-xs text-zinc-400 mt-3 opacity-80">
                  tap • hold to speak
                </p>
              )}

              <div className="flex gap-2 mt-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-400 ${
                      currentBottomMenu === i ? 'w-8 bg-gradient-to-r from-pink-400 to-rose-500' : 'w-2 bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* SETTINGS */}
            <div className="w-full flex-shrink-0 py-7 px-8">
              <div className="flex flex-col items-center gap-5">
                <Settings className="w-8 h-8 text-zinc-300" />

                <div className="w-full bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-pink-400" />
                      <div>
                        <p className="font-medium">Voice Input</p>
                        <p className="text-xs text-zinc-500">hold check button</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setVoiceEnabled((v) => !v)}
                      className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                        voiceEnabled ? 'bg-gradient-to-r from-pink-600 to-rose-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                          voiceEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={exportTasks}
                  className="w-full bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between hover:bg-zinc-800/70 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                    <div className="text-left">
                      <p className="font-medium">Export List</p>
                      <p className="text-xs text-zinc-500">save your desires</p>
                    </div>
                  </div>
                  <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </button>

                <div className="flex gap-2 mt-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all duration-400 ${
                        currentBottomMenu === i ? 'w-8 bg-gradient-to-r from-pink-400 to-rose-500' : 'w-2 bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="w-full flex-shrink-0 py-7 px-8">
              <div className="flex flex-col items-center gap-5">
                <BarChart3 className="w-8 h-8 text-zinc-300" />

                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 text-center">
                    <p className="text-2xl font-bold">{tasks.length}</p>
                    <p className="text-xs text-zinc-500 mt-1">Total</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 text-center">
                    <p className="text-2xl font-bold text-rose-400">{completed}</p>
                    <p className="text-xs text-zinc-500 mt-1">Done</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 text-center">
                    <p className="text-2xl font-bold">{tasks.length - completed}</p>
                    <p className="text-xs text-zinc-500 mt-1">Left</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 text-center">
                    <p className="text-2xl font-bold text-purple-400">{completionRate}%</p>
                    <p className="text-xs text-zinc-500 mt-1">Rate</p>
                  </div>
                </div>

                {topMood !== '—' && (
                  <p className="text-sm text-zinc-400 mt-2">
                    Current vibe: <span className="text-pink-400 font-medium">{topMood}</span>
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all duration-400 ${
                        currentBottomMenu === i ? 'w-8 bg-gradient-to-r from-pink-400 to-rose-500' : 'w-2 bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DoneApp;