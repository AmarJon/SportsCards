import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import AddCard from './components/AddCard';
import ViewCards from './components/ViewCards';
import ProfileSettings from './components/ProfileSettings';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showViewCards, setShowViewCards] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Fetch user's name from Firestore
  const fetchUserName = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().name);
      } else {
        // Fallback to email if name not found
        setUserName(user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      setUserName(user.email.split('@')[0]);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchUserName(user.uid);
      } else {
        setUserName('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNameUpdate = (newName) => {
    setUserName(newName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sports Cards Collection</h1>
              <p className="text-gray-600">Welcome, {userName}!</p>
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowAddCard(!showAddCard)}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  showAddCard 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {showAddCard ? 'Hide Add Card' : 'Add New Card'}
              </button>
              
              <button 
                onClick={() => setShowViewCards(!showViewCards)}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  showViewCards 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {showViewCards ? 'Hide Cards' : 'View My Cards'}
              </button>
              
              <button 
                onClick={() => setShowProfileSettings(true)}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6">
        {showAddCard && <AddCard />}
        {showViewCards && <ViewCards />}
      </main>

      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        userName={userName}
        onNameUpdate={handleNameUpdate}
      />
    </div>
  );
}

export default App;
