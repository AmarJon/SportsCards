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
    <div className="min-h-screen bg-gray-50 fullscreen-app">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sports Cards Collection</h1>
              <p className="text-sm sm:text-base text-gray-600">Welcome, {userName}!</p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button 
                onClick={() => setShowAddCard(!showAddCard)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition duration-200 text-sm sm:text-base ${
                  showAddCard 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {showAddCard ? 'Hide Add Card' : 'Add New Card'}
              </button>
              
              <button 
                onClick={() => setShowViewCards(!showViewCards)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition duration-200 text-sm sm:text-base ${
                  showViewCards 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {showViewCards ? 'Hide Cards' : 'View My Cards'}
              </button>
              
              <button 
                onClick={() => setShowProfileSettings(true)}
                className="w-full sm:w-auto p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200 flex items-center justify-center sm:justify-start"
                title="Settings"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="ml-2 sm:hidden">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 safe-area-bottom">
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
