import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Mic, Settings } from 'lucide-react';

export default function MinimalistTodo() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [carouselPosition, setCarouselPosition] = useState(0); // 0 = check button, 1 = settings
  const [recognition, setRecognition] = useState(null);
  const holdTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('minimalist-todos');
    if (stored) {
      setTodos(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('minimalist-todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showInput) {
        setShowInput(false);
        setNewTodo('');
      }
    };

    if (showInput) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showInput]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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
    }
  }, []);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
      setShowInput(false);
    } else {
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
    holdTimeoutRef.current = setTimeout(() => {
      startVoiceRecording();
    }, 500); // Start recording after 500ms hold
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

    // Any swipe with sufficient distance toggles between menus
    if (deltaX > 50) {
      setCarouselPosition(carouselPosition === 0 ? 1 : 0);
    }

    touchStartRef.current = null;
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Poppins']">
      {/* Todo List */}
      <div className="flex-1 px-6 pb-32 max-w-md mx-auto w-full">
        {todos.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/60 text-lg font-light leading-relaxed">
              What are you getting done today?
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-20">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="group flex items-center gap-3 p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    todo.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {todo.completed && <Check size={14} strokeWidth={3} />}
                </button>
                <span
                  className={`flex-1 text-sm font-light transition-all ${
                    todo.completed
                      ? 'line-through text-gray-600'
                      : 'text-gray-200'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button / Input */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ bottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-md mx-auto pointer-events-auto px-6">
          {showInput ? (
            <div className="bg-zinc-900 rounded-2xl p-4 shadow-2xl mb-4 transition-all duration-300 ease-out">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="What needs to get done?"
                className="w-full bg-transparent text-base focus:outline-none text-white placeholder-gray-500"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex justify-center overflow-hidden relative">
              <div
                ref={carouselRef}
                className="relative w-20 h-16 flex items-center justify-center"
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
                    carouselPosition === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[100%]'
                  }`}
                  style={{
                    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                    <Settings size={28} strokeWidth={2} className="text-gray-900" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-zinc-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings size={32} strokeWidth={2} className="text-gray-900" />
              </div>
              <h3 className="text-lg font-light text-white mb-4">Settings</h3>

              {/* Settings options */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <span className="text-sm text-gray-300">Dark Mode</span>
                  <div className="w-10 h-6 bg-gray-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <span className="text-sm text-gray-300">Voice Input</span>
                  <div className="w-10 h-6 bg-red-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <span className="text-sm text-gray-300">Notifications</span>
                  <div className="w-10 h-6 bg-gray-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>

              <button
                onClick={closeSettings}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-full transition-colors font-light"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}