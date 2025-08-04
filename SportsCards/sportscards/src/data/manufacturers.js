// Manufacturer data organized by sport
export const manufacturersBySport = {
  Baseball: [
    'Topps',
    'Bowman',
    'Donruss',
    'Fleer',
    'Upper Deck',
    'Panini',
    'Leaf',
    'Score',
    'Pinnacle',
    'O-Pee-Chee',
    'Other'
  ],
  
  Football: [
    'Topps',
    'Panini',
    'Donruss',
    'Fleer',
    'Upper Deck',
    'Score',
    'Pinnacle',
    'Playoff',
    'Leaf',
    'Other'
  ],
  
  Basketball: [
    'Topps',
    'Panini',
    'Upper Deck',
    'Fleer',
    'Donruss',
    'Hoops',
    'Other'
  ],
  
  Hockey: [
    'Upper Deck',
    'Topps',
    'Panini',
    'O-Pee-Chee',
    'Donruss',
    'Fleer',
    'Score',
    'Pinnacle',
    'Other'
  ],
  
  Soccer: [
    'Panini',
    'Topps',
    'Upper Deck',
    'Donruss',
    'Fleer',
    'Score',
    'Pinnacle',
    'Other'
  ],
  
  Other: [
    'Topps',
    'Panini',
    'Upper Deck',
    'Donruss',
    'Fleer',
    'Score',
    'Pinnacle',
    'Other'
  ]
};

// Get manufacturers for a specific sport
export const getManufacturersForSport = (sport) => {
  return manufacturersBySport[sport] || manufacturersBySport['Other'];
};

// Get all unique manufacturers across all sports
export const getAllManufacturers = () => {
  const allManufacturers = new Set();
  Object.values(manufacturersBySport).forEach(manufacturers => {
    manufacturers.forEach(manufacturer => allManufacturers.add(manufacturer));
  });
  return Array.from(allManufacturers).sort();
}; 