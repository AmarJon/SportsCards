import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getManufacturersForSport } from '../data/manufacturers';
import { getSetsForManufacturer } from '../data/sets';
import Toast from './Toast';
import eventBus from '../utils/eventBus';
import { IMGBB_API_KEY, IMGBB_API_URL } from '../config/imgbb';

function AddCard() {
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
    notes: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [availableManufacturers, setAvailableManufacturers] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }
      
      // Compress image if it's too large
      const compressImage = (file) => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            const maxWidth = 800;
            const maxHeight = 1000;
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
          };
          
          img.src = URL.createObjectURL(file);
        });
      };
      
      // Compress and set image
      compressImage(file).then(compressedFile => {
        setImageFile(compressedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(compressedFile);
      });
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    try {
      console.log('Starting ImgBB upload...', file.name);
      setImageUploadProgress(25);
      
      // Create FormData for ImgBB API
      const formData = new FormData();
      formData.append('image', file);
      
      // Use ImgBB API configuration
      const url = `${IMGBB_API_URL}?key=${IMGBB_API_KEY}`;
      
      setImageUploadProgress(50);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setImageUploadProgress(75);
      
      const data = await response.json();
      console.log('ImgBB response:', data);
      
      if (data.success) {
        setImageUploadProgress(100);
        const imageUrl = data.data.url;
        console.log('Image uploaded successfully, URL:', imageUrl);
        return imageUrl;
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploading) return;
    
    try {
      setUploading(true);
      const user = auth.currentUser;
      
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      const cardData = {
        ...formData,
        imageUrl,
        userId: user.uid,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'cards'), cardData);
      
      showToast('Card added successfully!', 'success');
      
      // Emit event to notify other components that a new card was added
      eventBus.emit('cardAdded', cardData);

      // Reset form
      setFormData({
        sport: '',
        manufacturer: '',
        set: '',
        year: '',
        player: '',
        cardNumber: '',
        graded: 'No',
        gradingCompany: '',
        gradeNumber: '',
        notes: '',
        imageUrl: ''
      });
      setImageFile(null);
      setImagePreview('');
      setImageUploadProgress(0);
      
    } catch (error) {
      showToast('Error adding card: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Add New Card</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3 sm:space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Image (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setImageUploadProgress(0);
                  }}
                  className="w-full sm:w-auto px-3 py-2 text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50"
                  disabled={uploading}
                >
                  Remove
                </button>
              )}
            </div>
            
            {/* Upload Progress */}
            {uploading && imageUploadProgress > 0 && imageUploadProgress < 100 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${imageUploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">Uploading image... {imageUploadProgress}%</p>
              </div>
            )}
            
            {/* Image Preview */}
            {imagePreview ? (
              <div className="mt-4 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Card preview"
                  className="w-32 h-40 sm:w-48 sm:h-64 object-cover rounded-lg border border-gray-300 shadow-sm"
                />
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <div className="w-32 h-40 sm:w-48 sm:h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs sm:text-sm">No Image Selected</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select 
                name="sport" 
                value={formData.sport} 
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                required
              >
                <option value="">Select Sport</option>
                <option value="Baseball">Baseball</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="WNBA">WNBA</option>
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
              />
            </div>

            {/* Graded Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is this card graded?
              </label>
              <select
                value={formData.graded}
                onChange={(e) => setFormData({...formData, graded: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
                    value={formData.gradingCompany}
                    onChange={(e) => setFormData({...formData, gradingCompany: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
                    value={formData.gradeNumber}
                    onChange={(e) => setFormData({...formData, gradeNumber: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 h-24 sm:h-32 resize-none text-sm"
              placeholder="Any additional notes about the card..."
            />
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 text-sm sm:text-base"
          >
            {uploading ? 'Adding Card...' : 'Add Card'}
          </button>
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

export default AddCard;
