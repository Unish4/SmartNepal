# SmartNepal 📍

A civic issue reporting platform for Nepal that empowers citizens to report local problems directly to their municipality. Built with modern web technologies to bridge the gap between citizens and local government.

## 🌟 Features

### For Citizens
- **Issue Reporting**: Report civic issues like road damage, garbage, water problems, street light issues, and more
- **Location-Based**: Precise location tracking with OpenStreetMap integration
- **Real-Time Updates**: Track the status of your reported issues (Open → Verified → In Progress → Resolved)
- **Photo Evidence**: Upload images to support your reports
- **AI-Powered**: Get intelligent suggestions for issue titles and detect duplicate reports
- **Profile Management**: Manage your personal information and notification preferences
- **Email Notifications**: Stay informed about status changes via email

### For Administrators
- **Dashboard**: Comprehensive overview of reported issues with statistics
- **Issue Management**: View, filter, and manage all reported issues
- **Status Updates**: Update issue status and provide rejection reasons
- **User Management**: View and manage registered users
- **Priority Handling**: Categorize issues by priority (Low, Medium, High, Critical)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Zustand** - State management
- **React Hook Form** - Form handling
- **TailwindCSS** - Styling
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Leaflet** - Interactive maps
- **React Leaflet** - React wrapper for Leaflet

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Image storage
- **Nodemailer** - Email notifications
- **Google Gemini AI** - AI-powered features
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting

## 📁 Project Structure

```
SmartNepal/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (env, db)
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware (auth, error handling)
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions (email, validators)
│   ├── .env                 # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── issues/      # Issue-related components
│   │   │   ├── layout/      # Layout components (Navbar, etc.)
│   │   │   ├── map/         # Map components
│   │   │   └── ui/          # UI components
│   │   ├── constants/       # Constants (Nepal locations, issue categories)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── auth/        # Authentication pages
│   │   │   └── issues/      # Issue-related pages
│   │   ├── services/        # API service functions
│   │   ├── store/           # Zustand stores
│   │   └── utils/           # Utility functions
│   ├── index.html
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Gmail account with App Password for email notifications
- Cloudinary account for image storage
- Google Gemini API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartNepal
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartnepal_db
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=your_jwt_secret_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   ```

4. **Run the application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health Check: http://localhost:3000/api/health

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PATCH /api/auth/preferences` - Update notification preferences
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/avatar` - Upload user avatar

### Issues
- `POST /api/issues` - Create a new issue
- `GET /api/issues` - Get all issues (with filters)
- `GET /api/issues/:id` - Get issue by ID
- `PATCH /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue
- `POST /api/issues/:id/upvote` - Upvote an issue

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/issues` - Get all issues (admin view)
- `PATCH /api/admin/issues/:id/status` - Update issue status
- `GET /api/admin/users` - Get all users

### AI Features
- `POST /api/ai/suggest` - Get AI suggestions for issue
- `POST /api/ai/title` - Generate issue title from description
- `POST /api/ai/duplicate` - Check for duplicate issues

## 🎨 Features in Detail

### Location-Based Reporting
- Integrated with OpenStreetMap for precise location tracking
- Supports all 7 provinces of Nepal with district and municipality data
- Reverse geocoding to convert coordinates to readable addresses

### AI-Powered Features
- **Smart Suggestions**: Get intelligent suggestions for issue details
- **Title Generation**: Auto-generate descriptive titles from descriptions
- **Duplicate Detection**: Identify potential duplicate reports to avoid redundancy

### Email Notifications
- Automated email notifications for status changes
- HTML email templates with professional design
- Configurable notification preferences per user

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation with express-validator
- Protected routes for authenticated users

## 🌍 Nepal Location Data

The application includes comprehensive location data for Nepal:
- 7 Provinces
- 77 Districts
- 753 Municipalities/Rural Municipalities

## 📱 Responsive Design

- Mobile-first approach
- Fully responsive layout
- Optimized for all screen sizes
- Touch-friendly interface

## 🧪 Testing

The application is designed for manual testing. Key areas to test:
- User registration and login
- Issue creation with location and images
- Issue status updates by admin
- Email notifications
- AI-powered features
- Profile management

## 🚀 Deployment

### Backend Deployment (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy with build command: `npm install`
5. Start command: `node src/server.js`

### Frontend Deployment (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy automatically on push

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- SmartNepal Development Team

## 🙏 Acknowledgments

- OpenStreetMap for map data
- Cloudinary for image storage
- Google Gemini AI for AI features
- The open-source community for the amazing tools and libraries

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Made with ❤️ for Nepal 🇳🇵
