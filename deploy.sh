#!/bin/bash

echo "🚀 Preparing Streaks Tracker for deployment..."

# Build the frontend
echo "📦 Building frontend..."
cd client
npm run build
cd ..

# Create public directory in server if it doesn't exist
mkdir -p server/public

# Copy built files to server
echo "📋 Copying frontend files to server..."
cp -r client/dist/* server/public/

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --production
cd ..

echo "✅ Deployment preparation complete!"
echo "📝 Next steps:"
echo "1. Set up your PostgreSQL database on Railway or another provider"
echo "2. Configure environment variables in Railway dashboard"
echo "3. Deploy the server directory to Railway"
echo ""
echo "🔧 Required environment variables:"
echo "- DATABASE_URL"
echo "- JWT_SECRET"
echo "- EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM"
echo "- CLIENT_URL (your Railway app URL)"
echo "- NODE_ENV=production"
