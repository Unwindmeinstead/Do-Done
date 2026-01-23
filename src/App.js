import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Mic, Settings, BarChart3, Plus, Moon, Sun } from 'lucide-react';

export default function DoneApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentView, setCurrentView] = useState('todos');
  const [recognition, setRecognition] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const inputRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    const storedTodos = localStorage.getItem('done-todos');
    const storedSettings = localStorage.getItem('done-settings');

    if (storedTodos) setTodos(JSON.parse(storedTodos));
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setDarkMode(settings.darkMode ?? true);
      setVoiceInputEnabled(settings.voiceInputEnabled ?? true);
    }
  }, []);

  // Save todos
  useEffect(() => {
    localStorage.setItem('done-todos', JSON.stringify(todos));
  }, [todos]);

  // Save settings
  useEffect(() => {
    const settings = { darkMode, voiceInputEnabled };
    localStorage.setItem('done-settings', JSON.stringify(settings));
  }, [darkMode, voiceInputEnabled]);

  // Initialize voice recognition
  useEffect(() => {
    if (voiceInputEnabled && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewTodo(transcript);
          setShowInput(true);
          setIsRecording(false);
        }
      };

      recognitionInstance.onend = () => setIsRecording(false);
      recognitionInstance.onerror = () => setIsRecording(false);

      setRecognition(recognitionInstance);
    }
  }, [voiceInputEnabled]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo.trim(), completed: false }]);
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

  const startVoiceRecording = () => {
    if (recognition && !isRecording) {
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleAddClick = () => {
    if (voiceInputEnabled) {
      startVoiceRecording();
    } else {
      setShowInput(true);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    addTodo();
  };

  return (
    <div
      className={`w-full h-full flex flex-col ${
        darkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-xl font-light">Done</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView(currentView === 'settings' ? 'todos' : 'settings')}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {currentView === 'todos' && (
          <div className="p-4">
            {todos.length === 0 ? (
              <div className="text-center py-20">
                <p className={`text-sm font-light ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  What are you getting done today?
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      darkMode ? 'bg-gray-900' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-green-500 border-green-500'
                          : darkMode
                            ? 'border-gray-600 hover:border-gray-400'
                            : 'border-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {todo.completed && <Check size={16} strokeWidth={3} />}
                    </button>
                    <span
                      className={`flex-1 text-base transition-all ${
                        todo.completed
                          ? 'line-through text-gray-500'
                          : darkMode
                            ? 'text-white'
                            : 'text-gray-900'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className={`p-1 rounded-full transition-colors ${
                        darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'settings' && (
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-light">Settings</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Voice Input
                  </span>
                  <button
                    onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      voiceInputEnabled ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        voiceInputEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="p-4 border-t border-gray-800">
        {!showInput ? (
          <button
            onClick={handleAddClick}
            className={`w-full h-14 rounded-xl flex items-center justify-center gap-3 font-medium transition-all ${
              darkMode
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
            } ${isRecording ? 'animate-pulse' : ''}`}
          >
            {isRecording ? (
              <>
                <Mic size={20} />
                Listening...
              </>
            ) : (
              <>
                <Plus size={20} />
                Add Task
              </>
            )}
          </button>
        ) : (
          <form onSubmit={handleInputSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className={`w-full h-14 px-4 rounded-xl text-base transition-colors ${
                darkMode
                  ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className={`flex-1 h-12 rounded-xl font-medium transition-colors ${
                  darkMode
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInput(false);
                  setNewTodo('');
                }}
                className={`px-6 h-12 rounded-xl font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-20">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-center gap-3 p-3 sm:p-4 rounded-lg transition-colors ${
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
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 pb-safe-bottom sm:pb-8 pointer-events-none">
        <div className="max-w-sm sm:max-w-md mx-auto pointer-events-auto">
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
                className="relative w-32 sm:w-28 h-20 sm:h-16 flex items-center justify-center"
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
                  className={`absolute w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
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
                  className={`absolute w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
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
                  className={`absolute w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm ${
          darkMode ? 'bg-black/50' : 'bg-black/30'
        }`}>
          <div className={`rounded-2xl p-4 sm:p-6 max-w-sm w-full mx-4 shadow-2xl ${
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm ${
          darkMode ? 'bg-black/50' : 'bg-black/30'
        }`}>
          <div className={`rounded-2xl p-4 sm:p-6 max-w-sm w-full mx-4 shadow-2xl ${
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