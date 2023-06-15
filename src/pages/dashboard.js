import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { ref, push, set, update, remove, onValue, off } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import Header from '@/components/header';

const Dashboard = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) {
      return;
    }
    const todosRef = ref(db, `users/${user.uid}/todos`);
    const todosListener = onValue(todosRef, (snapshot) => {
      const todoList = snapshot.val();
      if (todoList) {
        const todoItems = Object.entries(todoList).map(([id, todo]) => ({
          id,
          ...todo,
        }));
        setTodos(todoItems);
      } else {
        setTodos([]);
      }
    });

    return () => {
      off(todosRef, 'value', todosListener);
    };
  }, [user]);

  const addTodo = (event) => {
    event.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      // User not authenticated
      return;
    }

    const todoItem = {
      title: newTodo,
      checked: false,
    };

    const todosRef = ref(db, `users/${currentUser.uid}/todos`);
    const newTodoRef = push(todosRef);

    set(newTodoRef, todoItem).then(() => {
      setNewTodo('');
    }).catch((error) => {
      console.log('Error adding todo:', error);
    });
  };

  const toggleTodo = (todoId, checked) => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const todoRef = ref(db, `users/${userId}/todos/${todoId}`);
      update(todoRef, { checked }).catch((error) => {
        console.log('Error updating todo:', error);
      });
    }
  };

  const deleteTodo = (todoId) => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const todoRef = ref(db, `users/${userId}/todos/${todoId}`);
      remove(todoRef).catch((error) => {
        console.log('Error deleting todo:', error);
      });
    }
  };

  if (!auth.currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Todo List</h1>
        <div className="flex mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 mr-2 text-black"
          />
          <button
            onClick={addTodo}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <ul>
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={todo.checked}
                onChange={(e) => toggleTodo(todo.id, e.target.checked)}
                className="mr-2"
              />
              <span>{todo.title}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="ml-auto bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Dashboard;
