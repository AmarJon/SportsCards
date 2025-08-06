import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getManufacturersForSport } from '../data/manufacturers';
import { getSetsForManufacturer } from '../data/sets';
import CardDetailModal from './CardDetailModal';
import EditCardModal from './EditCardModal';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

function ViewCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [availableManufacturers, setAvailableManufacturers] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [sortBy, setSortBy] = useState('player');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'compact', 'list'
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Fetch cards from Firestore
  const fetchCards = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      // Query cards for the current user
      const q = query(
        collection(db, 'cards'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const cardsData = [];
      
      querySnapshot.forEach((doc) => {
        cardsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setCards(cardsData);
      setLoading(false);
    } catch (error) {
      setError('Error fetching cards: ' + error.message);
      setLoading(false);
    }
  };

  // Delete a card
  const deleteCard = async (cardId) => {
    setCardToDelete(cardId);
    setShowConfirmModal(true);
  };

  // Handle actual deletion after confirmation
  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'cards', cardToDelete));
      showToast('Card deleted successfully!', 'success');
      fetchCards(); // Refresh the cards list
    } catch (error) {
      showToast('Error deleting card: ' + error.message, 'error');
    }
  };

  // Handle card click for modal
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  // Handle edit card
  const handleEditCard = (card) => {
    setSelectedCard(card);
    setShowEditModal(true);
  };

  // Handle delete from modal
  const handleDeleteFromModal = async (cardId) => {
    setCardToDelete(cardId);
    setShowModal(false);
    setSelectedCard(null);
    setShowConfirmModal(true);
  };

  // Filter and search cards
  const filteredCards = cards.filter(card => {
    const matchesSearch = searchTerm === '' || 
      card.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.year.toString().includes(searchTerm) ||
      card.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.set && card.set.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSport = filterSport === '' || card.sport === filterSport;
    const matchesYear = filterYear === '' || card.year.toString() === filterYear;
    const matchesManufacturer = filterManufacturer === '' || card.manufacturer === filterManufacturer;
    const matchesSet = filterSet === '' || card.set === filterSet;
    
    return matchesSearch && matchesSport && matchesYear && matchesManufacturer && matchesSet;
  });

  // Sort the filtered cards
  const sortedCards = filteredCards.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'player':
        aValue = a.player.toLowerCase();
        bValue = b.player.toLowerCase();
        break;
      case 'year':
        aValue = parseInt(a.year);
        bValue = parseInt(b.year);
        break;
      case 'manufacturer':
        aValue = a.manufacturer.toLowerCase();
        bValue = b.manufacturer.toLowerCase();
        break;
      case 'set':
        aValue = (a.set || '').toLowerCase();
        bValue = (b.set || '').toLowerCase();
        break;
      case 'sport':
        aValue = a.sport.toLowerCase();
        bValue = b.sport.toLowerCase();
        break;
      default:
        aValue = a.player.toLowerCase();
        bValue = b.player.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Update available manufacturers when sport filter changes
  useEffect(() => {
    if (filterSport) {
      const manufacturers = getManufacturersForSport(filterSport);
      setAvailableManufacturers(manufacturers);
      // Reset manufacturer filter if it's not available for the selected sport
      if (!manufacturers.includes(filterManufacturer)) {
        setFilterManufacturer('');
        setFilterSet('');
      }
    } else {
      setAvailableManufacturers([]);
      setFilterManufacturer('');
      setFilterSet('');
    }
  }, [filterSport, filterManufacturer]);

  // Update available sets when manufacturer filter changes
  useEffect(() => {
    if (filterManufacturer) {
      const sets = getSetsForManufacturer(filterManufacturer, filterSport);
      setAvailableSets(sets);
      // Reset set filter if it's not available for the selected manufacturer
      if (!sets.includes(filterSet)) {
        setFilterSet('');
      }
    } else {
      setAvailableSets([]);
      setFilterSet('');
    }
  }, [filterManufacturer, filterSport, filterSet]);

  // Fetch cards when component mounts
  useEffect(() => {
    fetchCards();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Your Sports Cards ({sortedCards.length} cards)
        </h2>
        
        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search by player, year, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select 
              value={filterSport} 
              onChange={(e) => setFilterSport(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">All Sports</option>
              <option value="Baseball">Baseball</option>
              <option value="Football">Football</option>
              <option value="Basketball">Basketball</option>
              <option value="Hockey">Hockey</option>
              <option value="Soccer">Soccer</option>
              <option value="Other">Other</option>
            </select>
            
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">All Years</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
            </select>
            
            <select 
              value={filterManufacturer} 
              onChange={(e) => setFilterManufacturer(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              disabled={!filterSport}
            >
              <option value="">
                {filterSport ? 'All Manufacturers' : 'Select Sport First'}
              </option>
              {availableManufacturers.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
            
            <select 
              value={filterSet} 
              onChange={(e) => setFilterSet(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              disabled={!filterManufacturer}
            >
              <option value="">
                {filterManufacturer ? 'All Sets' : 'Select Manufacturer First'}
              </option>
              {availableSets.map((set) => (
                <option key={set} value={set}>
                  {set}
                </option>
              ))}
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="player">Sort by Player</option>
              <option value="year">Sort by Year</option>
              <option value="manufacturer">Sort by Manufacturer</option>
              <option value="set">Sort by Set</option>
              <option value="sport">Sort by Sport</option>
            </select>
            
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="asc">A-Z / Oldest First</option>
              <option value="desc">Z-A / Newest First</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                viewMode === 'compact' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Compact View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List View
            </button>
          </div>
        </div>
        
        {/* Cards Display */}
        {sortedCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg">No cards found. Add your first card!</p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : ''}
            ${viewMode === 'compact' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3' : ''}
            ${viewMode === 'list' ? 'space-y-2' : ''}
          `}>
            {sortedCards.map((card) => (
              <div 
                key={card.id} 
                className={`
                  ${viewMode === 'grid' ? 'bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-200 p-6' : ''}
                  ${viewMode === 'compact' ? 'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-200 p-3 cursor-pointer' : ''}
                  ${viewMode === 'list' ? 'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-200 p-4 flex justify-between items-center cursor-pointer' : ''}
                `}
                onClick={viewMode !== 'grid' ? () => handleCardClick(card) : undefined}
              >
                {viewMode === 'grid' && (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {card.player}
                      </h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditCard(card)}
                          className="text-blue-500 hover:text-blue-700 transition duration-200"
                          title="Edit card"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteCard(card.id)}
                          className="text-red-500 hover:text-red-700 transition duration-200"
                          title="Delete card"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                                             <p><span className="font-medium">Year:</span> {card.year}</p>
                       <p><span className="font-medium">Manufacturer:</span> {card.manufacturer}</p>
                       <p><span className="font-medium">Sport:</span> {card.sport}</p>
                       {card.set && (
                         <p><span className="font-medium">Set:</span> {card.set}</p>
                       )}
                       {card.cardNumber && (
                         <p><span className="font-medium">Card #:</span> {card.cardNumber}</p>
                       )}
                      {card.graded === 'Yes' && card.grade && (
                        <p><span className="font-medium">Grade:</span> {card.grade}</p>
                      )}
                      {card.graded === 'Yes' && card.gradingCompany && card.gradeNumber && (
                        <p><span className="font-medium">Graded:</span> {card.gradingCompany} {card.gradeNumber}</p>
                      )}
                      {card.graded === 'No' && (
                        <p><span className="font-medium">Graded:</span> No</p>
                      )}
                      {card.notes && (
                        <p><span className="font-medium">Notes:</span> {card.notes}</p>
                      )}
                    </div>
                  </>
                )}

                {viewMode === 'compact' && (
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                      {card.player}
                    </h4>
                    <p className="text-xs text-gray-600 mb-1">{card.year}</p>
                    <p className="text-xs text-gray-500">{card.manufacturer}</p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCard(card);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition duration-200"
                        title="Edit card"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCard(card.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition duration-200"
                        title="Delete card"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {viewMode === 'list' && (
                  <>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{card.player}</h4>
                      <p className="text-sm text-gray-600">{card.year} {card.manufacturer} - {card.sport}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCard(card);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition duration-200"
                        title="Edit card"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCard(card.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition duration-200"
                        title="Delete card"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        onDelete={handleDeleteFromModal}
        onEdit={handleEditCard}
      />

      {/* Edit Card Modal */}
      <EditCardModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        onCardUpdated={fetchCards}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setCardToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmText="Delete Card"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  );
}

export default ViewCards;