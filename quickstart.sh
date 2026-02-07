# Copy environment file
cp .env.example .env

# Update the .env file with your settings
# Required: Set a strong JWT_SECRET
# Optional: Customize ORGANIZATION_NAME, database credentials, etc.

# Install dependencies
npm install

# Start PostgreSQL database
docker-compose up -d postgres

# Wait for database to be ready (about 10 seconds)
sleep 10

# Run database migrations
npm run migrate --workspace=backend

# Start development servers
npm run dev

# The application will be available at:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# Health check: http://localhost:3001/health
