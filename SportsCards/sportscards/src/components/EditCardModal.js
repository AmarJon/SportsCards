import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getManufacturersForSport } from '../data/manufacturers';
import { getSetsForManufacturer } from '../data/sets';
import Toast from './Toast';

function EditCardModal({ isOpen, onClose, card, onCardUpdated }) {
  const [formData, setFormData] = useState({
    player: '',
    year: '',
    manufacturer: '',
    sport: '',
    set: '',
    cardNumber: '',
    graded: 'No',
    gradingCompany: '',
    gradeNumber: '',
    notes: ''
  });
  const [availableManufacturers, setAvailableManufacturers] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Initialize form data when card changes
  useEffect(() => {
    if (card) {
      setFormData({
        player: card.player || '',
        year: card.year || '',
        manufacturer: card.manufacturer || '',
        sport: card.sport || '',
        set: card.set || '',
        cardNumber: card.cardNumber || '',
        graded: card.graded || 'No',
        gradingCompany: card.gradingCompany || '',
        gradeNumber: card.gradeNumber || '',
        notes: card.notes || ''
      });

      // Set up available manufacturers and sets
      if (card.sport) {
        const manufacturers = getManufacturersForSport(card.sport);
        setAvailableManufacturers(manufacturers);
      }
      if (card.manufacturer && card.sport) {
        const sets = getSetsForManufacturer(card.manufacturer, card.sport);
        setAvailableSets(sets);
      }
    }
  }, [card]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If sport changes, update manufacturer list and reset manufacturer selection
    if (name === 'sport') {
      const manufacturers = getManufacturersForSport(value);
      setAvailableManufacturers(manufacturers);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        manufacturer: '', // Reset manufacturer when sport changes
        set: '' // Reset set when sport changes
      }));
    }
    
    // If manufacturer changes, update set list and reset set selection
    if (name === 'manufacturer') {
      const sets = getSetsForManufacturer(value, formData.sport);
      setAvailableSets(sets);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        set: '' // Reset set when manufacturer changes
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      showToast('Please log in to edit a card.', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const cardData = {
        player: formData.player,
        year: formData.year,
        manufacturer: formData.manufacturer,
        sport: formData.sport,
        set: formData.set || '',
        cardNumber: formData.cardNumber || '',
        graded: formData.graded,
        gradingCompany: formData.gradingCompany || '',
        gradeNumber: formData.gradeNumber || '',
        notes: formData.notes || '',
        updatedAt: new Date()
      };

      // Update the card in Firestore
      await updateDoc(doc(db, 'cards', card.id), cardData);

      setLoading(false);
      showToast('Card updated successfully!', 'success');
      onCardUpdated(); // Refresh the cards list
      onClose();
    } catch (error) {
      console.error('Error updating card: ', error);
      setLoading(false);
      showToast('Error updating card: ' + error.message, 'error');
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Card</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select 
                name="sport" 
                value={formData.sport} 
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
              >
                <option value="">Select Sport</option>
                <option value="Baseball">Baseball</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Hockey">Hockey</option>
                <option value="Soccer">Soccer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
              <select 
                name="manufacturer" 
                value={formData.manufacturer} 
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
                disabled={!formData.sport}
              >
                <option value="">
                  {formData.sport ? 'Select Manufacturer' : 'Select Sport First'}
                </option>
                {availableManufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Set</label>
              <select 
                name="set" 
                value={formData.set} 
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
                disabled={!formData.manufacturer}
              >
                <option value="">
                  {formData.manufacturer ? 'Select Set' : 'Select Manufacturer First'}
                </option>
                {availableSets.map((set) => (
                  <option key={set} value={set}>
                    {set}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                min="1900"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Player Name</label>
              <input
                type="text"
                name="player"
                value={formData.player}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div>

            {/* Graded Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is this card graded?
              </label>
              <select
                name="graded"
                value={formData.graded}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Grade Company and Number Fields - Only show when graded is "Yes" */}
            {formData.graded === 'Yes' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grading Company
                  </label>
                  <select
                    name="gradingCompany"
                    value={formData.gradingCompany}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    required={formData.graded === 'Yes'}
                  >
                    <option value="">Select Grading Company</option>
                    <option value="PSA">PSA</option>
                    <option value="BGS">BGS (Beckett)</option>
                    <option value="SGC">SGC</option>
                    <option value="CGC">CGC</option>
                    <option value="HGA">HGA</option>
                    <option value="CSG">CSG</option>
                    <option value="GMA">GMA</option>
                    <option value="Flawless">Flawless</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Number
                  </label>
                  <select
                    name="gradeNumber"
                    value={formData.gradeNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    required={formData.graded === 'Yes'}
                  >
                    <option value="">Select Grade</option>
                    <option value="10">10</option>
                    <option value="9">9</option>
                    <option value="8">8</option>
                    <option value="7">7</option>
                    <option value="6">6</option>
                    <option value="5">5</option>
                    <option value="4">4</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 h-32 resize-none"
              placeholder="Any additional notes about the card..."
            />
          </div>

          <div className="flex space-x-4">
            <button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Card'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

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

export default EditCardModal; 