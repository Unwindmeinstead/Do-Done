import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Mic, Settings, BarChart3 } from 'lucide-react';

export default function MinimalistTodo() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [carouselPosition, setCarouselPosition] = useState(0); // 0 = check button, 1 = settings, 2 = insights
  const [recognition, setRecognition] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const holdTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('minimalist-todos');
    if (stored) {
      setTodos(JSON.parse(stored));
    }

    // Load settings
    const storedSettings = localStorage.getItem('minimalist-settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setDarkMode(settings.darkMode ?? true);
      setVoiceInputEnabled(settings.voiceInputEnabled ?? true);
      setNotificationsEnabled(settings.notificationsEnabled ?? false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('minimalist-todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const settings = {
      darkMode,
      voiceInputEnabled,
      notificationsEnabled
    };
    localStorage.setItem('minimalist-settings', JSON.stringify(settings));
  }, [darkMode, voiceInputEnabled, notificationsEnabled]);

  useEffect(() => {
    if (voiceInputEnabled && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      let finalTranscript = '';

      recognitionInstance.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        // Update with final results immediately
        if (finalTranscript) {
          setNewTodo(finalTranscript);
          setShowInput(true);
          setIsRecording(false);
          recognitionInstance.stop();
        }
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      setRecognition(null);
    }
  }, [voiceInputEnabled]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
      setShowInput(false);
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const playSoftSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Soft, soothing tone
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      oscillator.type = 'sine';

      // Gentle fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not available');
    }
  };

  const startVoiceRecording = () => {
    if (recognition && !isRecording) {
      setIsRecording(true);
      playSoftSound();
      recognition.start();
    }
  };

  const stopVoiceRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  const handleButtonPress = () => {
    if (voiceInputEnabled) {
      holdTimeoutRef.current = setTimeout(() => {
        startVoiceRecording();
      }, 500); // Start recording after 500ms hold
    }
  };

  const handleButtonClick = () => {
    // Only show input if not currently recording
    if (!isRecording) {
      setShowInput(true);
    }
  };

  const handleButtonRelease = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
      // Quick release - show input (handled by onClick)
    } else if (isRecording) {
      stopVoiceRecording();
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;

    const touchEnd = e.changedTouches[0].clientX;
    const deltaX = Math.abs(touchEnd - touchStartRef.current);

    // Any swipe with sufficient distance cycles through menus
    if (deltaX > 50) {
      setCarouselPosition((carouselPosition + 1) % 3);
    }

    touchStartRef.current = null;
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const openInsights = () => {
    setShowInsights(true);
  };

  const closeInsights = () => {
    setShowInsights(false);
  };

  return (
    <div className={`h-screen w-screen fixed inset-0 flex flex-col transition-colors duration-300 overflow-hidden ${
      darkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Todo List */}
      <div className="flex-1 px-6 pb-32 max-w-md mx-auto w-full">
        {todos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-sm font-light leading-relaxed">
              What are you getting done today?
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-20">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-center gap-3 p-4 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    todo.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-400'
                        : 'border-gray-400 hover:border-gray-600'
                  }`}
                >
                  {todo.completed && <Check size={14} strokeWidth={3} />}
                </button>
                <span
                  className={`flex-1 text-sm font-light transition-all ${
                    todo.completed
                      ? 'line-through text-gray-600'
                      : darkMode
                        ? 'text-gray-200'
                        : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-all ${
                    darkMode
                      ? 'text-gray-600 hover:text-red-400'
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button / Input */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {showInput ? (
            <div className={`rounded-full p-2 shadow-2xl overflow-hidden ${
              darkMode ? 'bg-zinc-900' : 'bg-white border border-gray-200'
            }`}>
              <div className="flex items-center">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a priority..."
                  className={`flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none min-w-0 ${
                    darkMode
                      ? 'text-white placeholder-gray-600'
                      : 'text-black placeholder-gray-500'
                  }`}
                  autoFocus
                />
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={addTodo}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                  >
                    <Check size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setNewTodo('');
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      darkMode
                        ? 'bg-zinc-800 hover:bg-zinc-700'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center overflow-hidden relative">
              <div
                ref={carouselRef}
                className="relative w-28 h-16 flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Check Button */}
                <button
                  onClick={handleButtonClick}
                  onMouseDown={handleButtonPress}
                  onMouseUp={handleButtonRelease}
                  onTouchStart={(e) => {
                    handleButtonPress();
                    handleTouchStart(e);
                  }}
                  onTouchEnd={(e) => {
                    handleButtonRelease();
                    handleTouchEnd(e);
                  }}
                  className={`absolute w-16 h-16 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
                    isRecording ? 'bg-gray-100' : ''
                  } ${carouselPosition === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[-100%]'}`}
                  style={{
                    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                  {isRecording ? (
                    <Mic size={32} strokeWidth={3} className="text-gray-800" />
                  ) : (
                    <Check size={32} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className="transform rotate-12 text-gray-900" />
                  )}
                </button>

                {/* Settings Button */}
                <button
                  onClick={openSettings}
                  className={`absolute w-16 h-16 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
                    carouselPosition === 1 ? 'opacity-100 translate-x-0' : carouselPosition === 0 ? 'opacity-0 translate-x-[100%]' : 'opacity-0 translate-x-[-100%]'
                  }`}
                  style={{
                    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                  <Settings size={28} strokeWidth={2} className="text-gray-900" />
                </button>

                {/* Insights Button */}
                <button
                  onClick={openInsights}
                  className={`absolute w-16 h-16 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
                    carouselPosition === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[100%]'
                  }`}
                  style={{
                    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                  <BarChart3 size={28} strokeWidth={2} className="text-gray-900" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm ${
          darkMode ? 'bg-black/50' : 'bg-black/30'
        }`}>
          <div className={`rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl ${
            darkMode ? 'bg-white' : 'bg-gray-900'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                darkMode ? 'bg-black' : 'bg-white'
              }`}>
                <Settings size={32} strokeWidth={2} className={darkMode ? 'text-white' : 'text-black'} />
              </div>
              <h3 className={`text-lg font-light mb-4 ${
                darkMode ? 'text-black' : 'text-white'
              }`}>Settings</h3>

              {/* Settings options */}
              <div className="space-y-6 mb-6">
                {/* Appearance Section */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Appearance</h4>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                    }`}
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    <span className={`text-sm font-light ${
                      darkMode ? 'text-black' : 'text-white'
                    }`}>Dark Mode</span>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${
                      darkMode ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute transition-all duration-200 ${
                        darkMode ? 'right-0.5' : 'left-0.5'
                      } top-0.5`}></div>
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Features</h4>
                  <div className="space-y-2">
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                      }`}
                      onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
                    >
                      <span className={`text-sm font-light ${
                        darkMode ? 'text-black' : 'text-white'
                      }`}>Voice Input</span>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${
                        voiceInputEnabled ? 'bg-red-500' : 'bg-gray-400'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute transition-all duration-200 ${
                          voiceInputEnabled ? 'left-0.5' : 'right-0.5'
                        } top-0.5`}></div>
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                      }`}
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    >
                      <span className={`text-sm font-light ${
                        darkMode ? 'text-black' : 'text-white'
                      }`}>Notifications</span>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${
                        notificationsEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute transition-all duration-200 ${
                          notificationsEnabled ? 'left-0.5' : 'right-0.5'
                        } top-0.5`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={closeSettings}
                className={`w-full py-3 px-4 rounded-full transition-colors font-light ${
                  darkMode
                    ? 'bg-black hover:bg-gray-800 text-white'
                    : 'bg-white hover:bg-gray-100 text-black border border-gray-300'
                }`}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {showInsights && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm ${
          darkMode ? 'bg-black/50' : 'bg-black/30'
        }`}>
          <div className={`rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl ${
            darkMode ? 'bg-white' : 'bg-gray-900'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                darkMode ? 'bg-black' : 'bg-white'
              }`}>
                <BarChart3 size={32} strokeWidth={2} className={darkMode ? 'text-white' : 'text-black'} />
              </div>
              <h3 className={`text-lg font-light mb-4 ${
                darkMode ? 'text-black' : 'text-white'
              }`}>Insights</h3>

              {/* Insights content */}
              <div className="space-y-6 mb-6">
                {/* Today's Progress Section */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Today's Progress</h4>
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                  }`}>
                    <div className={`text-sm font-light mb-1 ${
                      darkMode ? 'text-black' : 'text-white'
                    }`}>Tasks Completed Today</div>
                    <div className={`text-3xl font-light ${
                      darkMode ? 'text-black' : 'text-white'
                    }`}>{todos.filter(t => t.completed).length}</div>
                  </div>
                </div>

                {/* Overall Stats Section */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Overall Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                    }`}>
                      <div className={`text-xs font-light mb-1 ${
                        darkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}>Total Tasks</div>
                      <div className={`text-xl font-light ${
                        darkMode ? 'text-black' : 'text-white'
                      }`}>{todos.length}</div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                    }`}>
                      <div className={`text-xs font-light mb-1 ${
                        darkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}>Completion Rate</div>
                      <div className={`text-xl font-light ${
                        darkMode ? 'text-black' : 'text-white'
                      }`}>
                        {todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streaks Section */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Streaks</h4>
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
                  }`}>
                    <div className={`text-sm font-light mb-1 ${
                      darkMode ? 'text-black' : 'text-white'
                    }`}>Productivity Streak</div>
                    <div className={`text-2xl font-light ${
                      darkMode ? 'text-black' : 'text-white'
                    }`}>🔥 3 days</div>
                  </div>
                </div>
              </div>

              <button
                onClick={closeInsights}
                className={`w-full py-3 px-4 rounded-full transition-colors font-light ${
                  darkMode
                    ? 'bg-black hover:bg-gray-800 text-white'
                    : 'bg-white hover:bg-gray-100 text-black border border-gray-300'
                }`}
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}