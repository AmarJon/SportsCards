import React, { useState } from 'react';    
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function AddCard() {
    const [formData, setFormData] = useState({
        sport: '',
        manufacturer: '',
        year: '',
        player: '',
        cardNumber: '',
        condition: '',
        notes: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try{
            const user = auth.currentUser;

            const docRef = await addDoc(collection(db, 'cards'), {
                ...formData,
                userId: user.uid,
                createdAt: new Date(),
        });

        alert('Card added successfully');

        setFormData({
            sport: '',
            manufacturer: '',
            year: '',
            player: '',
            cardNumber: '',
            condition: '',
            notes: '',
        });
    
    } catch (error) {
        alert("error adding card: " + error.message);
        }
    };   
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
          <h2>Add New Card</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label>Sport:</label>
              <select 
                name="sport" 
                value={formData.sport} 
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
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

            <div style={{ marginBottom: '15px' }}>
              <label>Manufacturer:</label>
              <select 
                name="manufacturer" 
                value={formData.manufacturer} 
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
                required
              >
                <option value="">Select Manufacturer</option>
                <option value="Topps">Topps</option>
                <option value="Bowman">Bowman</option>
                <option value="Panini">Panini</option>
                <option value="Upper Deck">Upper Deck</option>
                <option value="Donruss">Donruss</option>
                <option value="Fleer">Fleer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Year:</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
                min="1900"
                max="2030"
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Player Name:</label>
              <input
                type="text"
                name="player"
                value={formData.player}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Card Number:</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Condition:</label>
              <select 
                name="condition" 
                value={formData.condition} 
                onChange={handleChange}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Select Condition</option>
                <option value="Mint">Mint</option>
                <option value="Near Mint">Near Mint</option>
                <option value="Excellent">Excellent</option>
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Notes:</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', height: '100px' }}
                placeholder="Any additional notes about the card..."
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '10px' }}>
              Add Card
            </button>
          </form>
        </div>
    );
}

export default AddCard;
