# Streaks Tracker

A daily study/work tracker with streak functionality to help you maintain consistent learning habits. Track your daily progress, maintain streaks, and achieve your study goals.

## Features

- 📅 **Daily Tracking**: Log study sessions with duration, description, and category
- 🔥 **Streak System**: Track consecutive days of meeting your goals
- 📊 **Statistics**: View detailed analytics and progress reports
- 📧 **Email Notifications**: Get reminders and streak updates
- 🎯 **Goal Setting**: Set custom daily and weekly study goals
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Date-fns for date manipulation
- Lucide React for icons

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Nodemailer for email notifications
- Bcrypt for password hashing

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Email service (Gmail, SendGrid, etc.)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streaks
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb streaks_db
   
   # Run the schema
   psql -d streaks_db -f server/database/schema.sql
   ```

4. **Configure environment variables**
   
   **Server (.env)**
   ```bash
   cp server/env.example server/.env
   ```
   
   Edit `server/.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/streaks_db
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # Email (for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   
   # Client URL
   CLIENT_URL=http://localhost:5173
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```
   
   **Client (.env)**
   ```bash
   cp client/env.example client/.env
   ```
   
   Edit `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```

3. **Or run both simultaneously**
   ```bash
   # From the root directory
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd server
   npm start
   ```

## Usage

1. **Register**: Create a new account with your email and set your study goals
2. **Log Sessions**: Add study sessions with duration, description, and category
3. **Track Progress**: View your daily and weekly progress on the dashboard
4. **Maintain Streaks**: Keep your streak alive by meeting your daily goals
5. **View Calendar**: See your study history in a calendar view
6. **Adjust Settings**: Modify your goals and notification preferences

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/settings` - Update user settings

### Sessions
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/date/:date` - Get session for specific date
- `POST /api/sessions` - Create/update session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Streaks
- `GET /api/streaks` - Get streak information
- `GET /api/streaks/daily-goals` - Get daily goals
- `GET /api/streaks/weekly-goals` - Get weekly goals
- `GET /api/streaks/stats` - Get statistics
- `GET /api/streaks/calendar` - Get calendar data

### Notifications
- `POST /api/notifications/send-reminder` - Send reminder email
- `POST /api/notifications/send-streak-update` - Send streak update
- `GET /api/notifications/history` - Get notification history
- `POST /api/notifications/test` - Send test email

## Deployment

### Railway Deployment

1. **Prepare for deployment**
   ```bash
   # Build the frontend
   cd client
   npm run build
   
   # Copy build files to server
   cp -r dist/* ../server/public/
   ```

2. **Deploy to Railway**
   - Connect your GitHub repository to Railway
   - Set environment variables in Railway dashboard
   - Deploy the `server` directory as the root

### Environment Variables for Production

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email
CLIENT_URL=https://your-domain.com
PORT=5000
NODE_ENV=production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
