import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

export default function MinimalistTodo() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('minimalist-todos');
    if (stored) {
      setTodos(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('minimalist-todos', JSON.stringify(todos));
  }, [todos]);

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

  const activeTodos = todos.filter(t => !t.completed);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-6 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-light tracking-wide mb-2">Do.Done</h1>
          <p className="text-gray-500 text-sm font-light">
            {activeTodos.length === 0
              ? "All done. Add a new priority."
              : `${activeTodos.length} ${activeTodos.length === 1 ? 'priority' : 'priorities'} remaining`}
          </p>
        </div>
      </div>

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
          <div className="space-y-2">
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
            <div className="bg-zinc-900 rounded-full p-2 flex items-center gap-2 shadow-2xl">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add a priority..."
                className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-white placeholder-gray-600"
                autoFocus
              />
              <button
                onClick={addTodo}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
              >
                <Check size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setNewTodo('');
                }}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setShowInput(true)}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}