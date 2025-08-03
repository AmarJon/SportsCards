import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';
import AddCard from './components/AddCard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sports Cards Collection</h1>
        <p>Welcome, {user.email}!</p>
        <div>
          <button 
            onClick={() => setShowAddCard(!showAddCard)}
            style={{ marginRight: '10px' }}
          >
            {showAddCard ? 'Hide Add Card' : 'Add New Card'}
          </button>
          <button onClick={() => auth.signOut()}>Logout</button>
        </div>
      </header>
      
      {showAddCard && <AddCard />}
    </div>
  );
}

export default App;
