# SportsCards

A React-based web application for managing and organizing sports card collections. Built with modern web technologies including React, Tailwind CSS, and Firebase.

## Features

- **Card Management**: Add, edit, and view sports cards
- **User Authentication**: Secure login and profile management
- **Card Details**: Comprehensive card information tracking
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Firebase Integration**: Real-time database and hosting

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Build Tool**: Create React App
- **Styling**: PostCSS, Autoprefixer

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/SportsCards.git
   cd SportsCards
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Firebase:

   - Create a Firebase project
   - Enable Authentication and Firestore
   - Copy your Firebase config to `src/firebase.js`

4. Start the development server:

   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
SportsCards/
├── public/          # Static assets
├── src/             # Source code
│   ├── components/  # React components
│   ├── config/      # Configuration files
│   ├── data/        # Static data (sets, manufacturers)
│   ├── utils/       # Utility functions
│   └── firebase.js  # Firebase configuration
├── .gitignore       # Git ignore rules
├── package.json     # Dependencies and scripts
└── tailwind.config.js # Tailwind CSS configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.
