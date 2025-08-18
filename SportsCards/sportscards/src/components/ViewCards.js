import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getManufacturersForSport } from '../data/manufacturers';
import { getSetsForManufacturer } from '../data/sets';
import CardDetailModal from './CardDetailModal';
import EditCardModal from './EditCardModal';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import eventBus from '../utils/eventBus';

// Add custom styles for range sliders
const rangeSliderStyles = `
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  input[type="range"]::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  input[type="range"]::-ms-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

// Placeholder component for cards without images
const CardImagePlaceholder = ({ className, children }) => (
  <div className={`${className} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400`}>
    {children}
  </div>
);

function ViewCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterYearStart, setFilterYearStart] = useState('');
  const [filterYearEnd, setFilterYearEnd] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [filterGradingCompanies, setFilterGradingCompanies] = useState([]);
  const [filterGradeRange, setFilterGradeRange] = useState('');
  const [filterHasImage, setFilterHasImage] = useState('');
  const [availableManufacturers, setAvailableManufacturers] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
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

  // Handle card update
  const handleCardUpdated = (updatedCard) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === updatedCard.id ? updatedCard : card
      )
    );
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
      (card.set && card.set.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.notes && card.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSport = filterSport === '' || card.sport === filterSport;
         const matchesYear = (filterYearStart === '' && filterYearEnd === '') || 
       (filterYearStart === '' && parseInt(card.year) <= parseInt(filterYearEnd || 2024)) ||
       (filterYearEnd === '' && parseInt(card.year) >= parseInt(filterYearStart || 1900)) ||
       (parseInt(card.year) >= parseInt(filterYearStart || 1900) && parseInt(card.year) <= parseInt(filterYearEnd || 2024));
    const matchesManufacturer = filterManufacturer === '' || card.manufacturer === filterManufacturer;
    const matchesSet = filterSet === '' || card.set === filterSet;
         const matchesGradingCompanies = filterGradingCompanies.length === 0 || 
       (card.graded === 'Yes' && card.gradingCompany && filterGradingCompanies.includes(card.gradingCompany));
         const matchesGradeRange = filterGradeRange === '' || (card.graded === 'Yes' && card.gradeNumber && 
       (filterGradeRange === '10' ? card.gradeNumber === '10' :
        filterGradeRange === '9-10' ? parseInt(card.gradeNumber) >= 9 :
        filterGradeRange === '8-9' ? parseInt(card.gradeNumber) >= 8 && parseInt(card.gradeNumber) <= 9 :
        filterGradeRange === '6-8' ? parseInt(card.gradeNumber) >= 6 && parseInt(card.gradeNumber) <= 8 :
        filterGradeRange === '1-6' ? parseInt(card.gradeNumber) >= 1 && parseInt(card.gradeNumber) <= 6 : true));
    const matchesHasImage = filterHasImage === '' || 
      (filterHasImage === 'with' && card.imageUrl) || 
      (filterHasImage === 'without' && !card.imageUrl);
    
         return matchesSearch && matchesSport && matchesYear && matchesManufacturer && matchesSet && matchesGradingCompanies && matchesGradeRange && matchesHasImage;
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
             case 'gradeNumber':
         aValue = a.gradeNumber ? parseInt(a.gradeNumber.toString().split(' ')[0]) : 0;
         bValue = b.gradeNumber ? parseInt(b.gradeNumber.toString().split(' ')[0]) : 0;
         break;
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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



  // Listen for new card additions
  useEffect(() => {
    const handleCardAdded = () => {
      fetchCards();
    };

    eventBus.on('cardAdded', handleCardAdded);

    return () => {
      eventBus.off('cardAdded', handleCardAdded);
    };
  }, []);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterSport('');
    setFilterYearStart('');
    setFilterYearEnd('');
    setFilterManufacturer('');
    setFilterSet('');
    setFilterGradingCompanies([]);
    setFilterGradeRange('');
    setFilterHasImage('');
  };

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
     <div className="max-w-7xl mx-auto p-6">
       <style>{rangeSliderStyles}</style>
       <div className="bg-white rounded-lg shadow-lg p-8">
         <div className="mb-6">
           <h2 className="text-3xl font-bold text-gray-900">
             Your Sports Cards ({sortedCards.length} cards)
           </h2>
         </div>
         
         {/* Search Bar */}
         <div className="mb-6">
           <div className="relative max-w-2xl mx-auto">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
             </div>
             <input
               type="text"
               placeholder="Search by player, year, manufacturer, set, or notes..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
             />
           </div>
         </div>
         
         {/* Active Filter Indicators */}
                   {(searchTerm || filterSport || filterYearStart || filterYearEnd || filterManufacturer || filterSet || filterGradingCompanies.length > 0 || filterGradeRange || filterHasImage) && (
           <div className="mb-6">
             <div className="flex flex-wrap gap-2 justify-center">
               {searchTerm && (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                   Search: "{searchTerm}"
                   <button
                     onClick={() => setSearchTerm('')}
                     className="ml-2 text-blue-600 hover:text-blue-800"
                   >
                     ×
                   </button>
                 </span>
               )}
               {filterSport && (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                   Sport: {filterSport}
                   <button
                     onClick={() => setFilterSport('')}
                     className="ml-2 text-green-600 hover:text-green-800"
                   >
                     ×
                   </button>
                 </span>
               )}
                               {(filterYearStart || filterYearEnd) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Year: {filterYearStart && filterYearEnd ? `${filterYearStart}-${filterYearEnd}` : 
                           filterYearStart ? `${filterYearStart}+` : 
                           filterYearEnd ? `-${filterYearEnd}` : ''}
                    <button
                      onClick={() => {
                        setFilterYearStart('');
                        setFilterYearEnd('');
                      }}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
               {filterManufacturer && (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                   Manufacturer: {filterManufacturer}
                   <button
                     onClick={() => setFilterManufacturer('')}
                     className="ml-2 text-orange-600 hover:text-orange-800"
                   >
                     ×
                   </button>
                 </span>
               )}
               {filterSet && (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                   Set: {filterSet}
                   <button
                     onClick={() => setFilterSet('')}
                     className="ml-2 text-indigo-600 hover:text-indigo-800"
                   >
                     ×
                   </button>
                 </span>
               )}
                               {filterGradingCompanies.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Companies: {filterGradingCompanies.join(', ')}
                    <button
                      onClick={() => setFilterGradingCompanies([])}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                )}
               {filterGradeRange && (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                   Grade: {filterGradeRange}
                   <button
                     onClick={() => setFilterGradeRange('')}
                     className="ml-2 text-red-600 hover:text-red-800"
                   >
                     ×
                   </button>
                 </span>
               )}
               {filterHasImage && (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                   {filterHasImage === 'with' ? 'With Images' : 'Without Images'}
                   <button
                     onClick={() => setFilterHasImage('')}
                     className="ml-2 text-teal-600 hover:text-teal-800"
                   >
                     ×
                   </button>
                 </span>
               )}
             </div>
           </div>
         )}
         
         {/* Main Layout with Sidebar */}
         <div className="flex gap-6">
           {/* Sidebar Filters */}
           <div className="w-80 flex-shrink-0">
             <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                 <button
                                       onClick={clearAllFilters}
                   className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                 >
                   Clear All
                 </button>
               </div>
               
               <div className="space-y-4">
                           {/* Sport Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                   <select 
                     value={filterSport} 
                     onChange={(e) => setFilterSport(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                   >
                     <option value="">All Sports</option>
                     <option value="Baseball">Baseball</option>
                     <option value="Football">Football</option>
                                           <option value="Basketball">Basketball</option>
                      <option value="WNBA">WNBA</option>
                      <option value="Hockey">Hockey</option>
                      <option value="Soccer">Soccer</option>
                      <option value="Other">Other</option>
                   </select>
                 </div>
                 
                                                                                         {/* Year Range Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Year Range</label>
                     <div className="space-y-3">
                       {/* Year Input Boxes */}
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="block text-xs text-gray-600 mb-1">From Year</label>
                                                         <input
                                type="number"
                                min="1900"
                                max="2025"
                                placeholder="1900"
                                value={filterYearStart}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const endValue = filterYearEnd;
                                  if (!endValue || parseInt(value) <= parseInt(endValue)) {
                                    setFilterYearStart(value);
                                  }
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">To Year</label>
                              <input
                                type="number"
                                min="1900"
                                max="2025"
                                placeholder="2025"
                             value={filterYearEnd}
                             onChange={(e) => {
                               const value = e.target.value;
                               const startValue = filterYearStart;
                               if (!startValue || parseInt(value) >= parseInt(startValue)) {
                                 setFilterYearEnd(value);
                               }
                             }}
                             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                           />
                         </div>
                       </div>
                       
                       {/* Quick Presets */}
                       <div className="flex flex-wrap gap-1">
                                                   <button
                            onClick={() => {
                              setFilterYearStart('2020');
                              setFilterYearEnd('2025');
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Recent
                          </button>
                         <button
                           onClick={() => {
                             setFilterYearStart('2010');
                             setFilterYearEnd('2019');
                           }}
                           className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                         >
                           2010s
                         </button>
                         <button
                           onClick={() => {
                             setFilterYearStart('2000');
                             setFilterYearEnd('2009');
                           }}
                           className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                         >
                           2000s
                         </button>
                         <button
                           onClick={() => {
                             setFilterYearStart('');
                             setFilterYearEnd('');
                           }}
                           className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                         >
                           Clear
                         </button>
                       </div>
                     </div>
                   </div>
                 
                 {/* Manufacturer Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                   <select 
                     value={filterManufacturer} 
                     onChange={(e) => setFilterManufacturer(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                 </div>
                 
                 {/* Set Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Set</label>
                   <select 
                     value={filterSet} 
                     onChange={(e) => setFilterSet(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                 </div>
                 
                                   {/* Grading Companies Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grading Companies</label>
                    <div className="space-y-2">
                                             {['PSA', 'BGS', 'SGC', 'CSG', 'HGA', 'CGC', 'Flawless'].map((company) => (
                        <label key={company} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filterGradingCompanies.includes(company)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterGradingCompanies([...filterGradingCompanies, company]);
                              } else {
                                setFilterGradingCompanies(filterGradingCompanies.filter(c => c !== company));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{company}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                 
                 {/* Grade Range Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Grade Range</label>
                   <select 
                     value={filterGradeRange} 
                     onChange={(e) => setFilterGradeRange(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                   >
                     <option value="">All Grades</option>
                     <option value="10">Perfect 10</option>
                     <option value="9-10">9-10 (Mint)</option>
                     <option value="8-9">8-9 (Near Mint)</option>
                     <option value="6-8">6-8 (Excellent)</option>
                     <option value="1-6">1-6 (Poor to Very Good)</option>
                   </select>
                 </div>

                 {/* Image Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Image Status</label>
                   <select 
                     value={filterHasImage} 
                     onChange={(e) => setFilterHasImage(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                   >
                     <option value="">All Cards</option>
                     <option value="with">With Images</option>
                     <option value="without">Without Images</option>
                   </select>
                 </div>
               </div>
             </div>
           </div>
           
           {/* Main Content Area */}
           <div className="flex-1">
             {/* Sort and View Controls */}
             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
               {/* Sort Controls */}
               <div className="flex items-center space-x-4">
                 <label className="text-sm font-medium text-gray-700">Sort by:</label>
                 <select 
                   value={sortBy} 
                   onChange={(e) => setSortBy(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                 >
                   <option value="player">Player Name</option>
                   <option value="year">Year</option>
                   <option value="manufacturer">Manufacturer</option>
                   <option value="set">Set</option>
                   <option value="sport">Sport</option>
                   <option value="gradeNumber">Grade</option>
                   <option value="createdAt">Date Added</option>
                 </select>
                 
                 <select 
                   value={sortOrder} 
                   onChange={(e) => setSortOrder(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                 >
                   <option value="asc">Ascending</option>
                   <option value="desc">Descending</option>
                 </select>
               </div>
               
               {/* View Mode Toggle */}
               <div className="flex items-center space-x-2">
                 <span className="text-sm font-medium text-gray-700">View:</span>
                 <button
                   onClick={() => setViewMode('grid')}
                   className={`px-3 py-2 rounded-lg font-medium transition duration-200 ${
                     viewMode === 'grid' 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                   }`}
                 >
                   Grid
                 </button>
                 <button
                   onClick={() => setViewMode('compact')}
                   className={`px-3 py-2 rounded-lg font-medium transition duration-200 ${
                     viewMode === 'compact' 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                   }`}
                 >
                   Compact
                 </button>
                 <button
                   onClick={() => setViewMode('list')}
                   className={`px-3 py-2 rounded-lg font-medium transition duration-200 ${
                     viewMode === 'list' 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                   }`}
                 >
                   List
                 </button>
               </div>
             </div>
             
                           {/* Results Summary */}
              <div className="text-center text-sm text-gray-600 mb-6">
                Showing {sortedCards.length} of {cards.length} cards
                                 {(searchTerm || filterSport || filterYearStart || filterYearEnd || filterManufacturer || filterSet || filterGradingCompanies.length > 0 || filterGradeRange || filterHasImage) && (
                  <span className="ml-2 text-blue-600">(filtered)</span>
                )}
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
                          {/* Card Image */}
                          <div className="mb-4 flex justify-center">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={`${card.player} card`}
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {!card.imageUrl && (
                              <CardImagePlaceholder className="w-full h-48 rounded-lg">
                                <div className="text-center">
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm">No Image</p>
                                </div>
                              </CardImagePlaceholder>
                            )}
                          </div>
                          
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
                          {/* Card Image */}
                          <div className="mb-2">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={`${card.player} card`}
                                className="w-full h-24 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {!card.imageUrl && (
                              <CardImagePlaceholder className="w-full h-24 rounded">
                                <div className="text-center">
                                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </CardImagePlaceholder>
                            )}
                          </div>
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
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Card Image */}
                            <div className="flex-shrink-0">
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={`${card.player} card`}
                                  className="w-16 h-20 object-cover rounded border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              {!card.imageUrl && (
                                <CardImagePlaceholder className="w-16 h-20 rounded">
                                  <div className="text-center">
                                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </CardImagePlaceholder>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{card.player}</h4>
                              <p className="text-sm text-gray-600">{card.year} {card.manufacturer} - {card.sport}</p>
                            </div>
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
          </div>
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
        onCardUpdated={handleCardUpdated}
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