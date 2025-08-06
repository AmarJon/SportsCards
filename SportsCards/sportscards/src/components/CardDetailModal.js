import React from 'react';

function CardDetailModal({ isOpen, onClose, card, onDelete, onEdit }) {
  if (!isOpen || !card) return null;

  const handleDelete = () => {
    onDelete(card.id);
    onClose();
  };

  const handleEdit = () => {
    onClose();
    // Use setTimeout to ensure the detail modal closes before opening the edit modal
    setTimeout(() => {
      onEdit(card);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Card Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{card.player}</h3>
            <p className="text-lg text-gray-600">{card.year} {card.manufacturer}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Sport:</span>
              <p className="text-gray-600">{card.sport}</p>
            </div>
            
            {card.set && (
              <div>
                <span className="font-medium text-gray-700">Set:</span>
                <p className="text-gray-600">{card.set}</p>
              </div>
            )}
            
            {card.cardNumber && (
              <div>
                <span className="font-medium text-gray-700">Card Number:</span>
                <p className="text-gray-600">{card.cardNumber}</p>
              </div>
            )}
            
            {card.graded === 'Yes' && card.grade && (
              <div>
                <span className="font-medium text-gray-700">Grade:</span>
                <p className="text-gray-600">{card.grade}</p>
              </div>
            )}
            {card.graded === 'Yes' && card.gradingCompany && card.gradeNumber && (
              <div>
                <span className="font-medium text-gray-700">Graded:</span>
                <p className="text-gray-600">{card.gradingCompany} {card.gradeNumber}</p>
              </div>
            )}
            {card.graded === 'No' && (
              <div>
                <span className="font-medium text-gray-700">Graded:</span>
                <p className="text-gray-600">No</p>
              </div>
            )}
          </div>

          {card.notes && (
            <div>
              <span className="font-medium text-gray-700">Notes:</span>
              <p className="text-gray-600 mt-1">{card.notes}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={handleEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Edit Card
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Delete Card
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardDetailModal; 