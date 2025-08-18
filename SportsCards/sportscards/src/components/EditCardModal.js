import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getManufacturersForSport } from '../data/manufacturers';
import { getSetsForManufacturer } from '../data/sets';
import Toast from './Toast';
import { IMGBB_API_KEY, IMGBB_API_URL } from '../config/imgbb';

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
    notes: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
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
        notes: card.notes || '',
        imageUrl: card.imageUrl || ''
      });
      setImagePreview(card.imageUrl || '');
      setImageFile(null); // Reset image file when card changes
      setImageUploadProgress(0); // Reset progress

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

  // Reset uploading state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploading(false);
      setImageUploadProgress(0);
    }
  }, [isOpen]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log('=== IMAGE CHANGE EVENT ===');
    console.log('File input event:', e);
    console.log('Selected file:', file);
    
    if (file) {
      console.log('=== PROCESSING IMAGE FILE ===');
      console.log('Image file selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('Invalid file type:', file.type);
        showToast('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.log('File too large:', file.size);
        showToast('Image size must be less than 5MB', 'error');
        return;
      }
      
      console.log('File validation passed, proceeding with compression...');
      
      // Compress image if it's too large
      const compressImage = (file) => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            console.log('Image loaded for compression:', {
              originalWidth: img.width,
              originalHeight: img.height
            });
            
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
            
            console.log('Compressed dimensions:', { width, height });
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
          console.log('=== IMAGE COMPRESSED ===');
          
          // Create a new file with the original name
          const namedFile = new File([compressedFile], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.log('Named file details:', {
            name: namedFile.name,
            size: namedFile.size,
            type: namedFile.type
          });
          
          setImageFile(namedFile);
          console.log('Image file state set');
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log('=== PREVIEW CREATED ===');
            console.log('Preview data URL length:', e.target.result.length);
            setImagePreview(e.target.result);
            console.log('Image preview state set');
          };
          reader.readAsDataURL(compressedFile);
        }).catch(error => {
          console.error('=== IMAGE COMPRESSION FAILED ===');
          console.error('Compression error:', error);
          showToast('Failed to process image', 'error');
        });
    } else {
      console.log('No file selected');
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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImageUploadProgress(0);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== SUBMIT STARTED ===');
    console.log('Current formData:', formData);
    console.log('Current imageFile:', imageFile);
    console.log('Current imagePreview:', imagePreview);
    
    if (!auth.currentUser) {
      showToast('Please log in to edit a card.', 'error');
      return;
    }

    try {
      setLoading(true);
      
      let imageUrl = formData.imageUrl;
      console.log('Initial imageUrl:', imageUrl);
      
      // If there's a new image file, upload it
      if (imageFile) {
        try {
          console.log('=== UPLOADING NEW IMAGE ===');
          console.log('Image file details:', {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type
          });
          
          setUploading(true);
          imageUrl = await uploadImage(imageFile);
          console.log('Image uploaded successfully, new URL:', imageUrl);
          setUploading(false);
        } catch (uploadError) {
          console.error('=== IMAGE UPLOAD FAILED ===');
          console.error('Upload error details:', uploadError);
          setUploading(false);
          showToast('Failed to upload image: ' + uploadError.message, 'error');
          return; // Don't proceed with the update if image upload fails
        }
      } else {
        console.log('No new image file, keeping existing URL:', imageUrl);
      }
      
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
        imageUrl,
        updatedAt: new Date()
      };

      console.log('=== UPDATING FIRESTORE ===');
      console.log('Card data to update:', cardData);
      console.log('Card ID:', card.id);
      
      // Update the card in Firestore
      await updateDoc(doc(db, 'cards', card.id), cardData);
      console.log('Card updated successfully in Firestore');

      setLoading(false);
      showToast('Card updated successfully!', 'success');
      
      // Pass the updated card data back to parent component
      const updatedCard = {
        id: card.id,
        ...cardData
      };
      console.log('=== CALLING PARENT UPDATE ===');
      console.log('Updated card data:', updatedCard);
      onCardUpdated(updatedCard);
      
      console.log('=== SUBMIT COMPLETED SUCCESSFULLY ===');
      onClose();
    } catch (error) {
      console.error('=== SUBMIT FAILED ===');
      console.error('Error updating card:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setLoading(false);
      setUploading(false);
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
          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  disabled={uploading || loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
              {(imagePreview || imageFile) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-3 py-2 text-red-600 hover:text-red-800 text-sm font-medium"
                  disabled={uploading || loading}
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
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Card preview"
                  className="w-48 h-64 object-cover rounded-lg border border-gray-300 shadow-sm"
                />
              </div>
            ) : (
              <div className="mt-4">
                <div className="w-48 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No Image Available</p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
            disabled={loading || uploading}
          >
            {loading || uploading ? 'Updating...' : 'Update Card'}
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