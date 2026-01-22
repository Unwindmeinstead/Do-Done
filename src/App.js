import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Mic } from 'lucide-react';

export default function MinimalistTodo() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const holdTimeoutRef = useRef(null);

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
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setNewTodo(transcript);
        setShowInput(true);
        setIsRecording(false);
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


  return (
    <>
      <style>{`
        @keyframes wave-flow {
          0% { transform: translateX(-100%) rotate(45deg); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateX(100%) rotate(45deg); opacity: 0; }
        }
        .wave-animation {
          animation: wave-flow 3s ease-in-out infinite;
        }
        .artistic-check {
          filter: drop-shadow(0 0 2px rgba(255,255,255,0.3));
        }
      `}</style>
      <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Todo List */}
      <div className="flex-1 px-6 pb-32 max-w-md mx-auto w-full">
        {todos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-sm font-light leading-relaxed">
              Focus on what's essential.<br />
              Limit your priorities to three<br />
              to achieve more.
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
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {showInput ? (
            <div className="bg-zinc-900 rounded-full p-2 shadow-2xl overflow-hidden">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a priority..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-white placeholder-gray-600 min-w-0"
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
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleButtonClick}
                onMouseDown={handleButtonPress}
                onMouseUp={handleButtonRelease}
                onTouchStart={handleButtonPress}
                onTouchEnd={handleButtonRelease}
                className={`w-16 h-16 rounded-full bg-red-900 hover:bg-red-800 flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 relative overflow-hidden ${
                  isRecording ? 'bg-red-800' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-700 to-transparent wave-animation"></div>
                {isRecording ? (
                  <Mic size={32} strokeWidth={3} className="relative z-10" />
                ) : (
                  <Check size={32} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className="relative z-10 artistic-check transform rotate-12" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
  );
}