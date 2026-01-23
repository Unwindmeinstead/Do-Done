import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Mic, Settings, Plus, Moon, Sun } from 'lucide-react';

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
