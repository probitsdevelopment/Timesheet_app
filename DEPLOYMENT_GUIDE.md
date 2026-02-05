# Deployment Guide for Render

## Prerequisites
- GitHub account with your repository pushed
- Render account (https://render.com)
- PostgreSQL database on Render or external host

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin features/timeapplication
```

## Step 2: Set Up PostgreSQL on Render

1. Go to https://render.com and login
2. Click "New" → "PostgreSQL"
3. Fill in:
   - **Name**: timesheet-db
   - **Database**: timesheet_db
   - **Username**: postgres
   - **Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create Database"
5. Copy the **External Database URL** (you'll need it)

## Step 3: Create Backend Web Service

1. Click "New" → "Web Service"
2. Select your GitHub repository
3. Fill in:
   - **Name**: timesheet-backend
   - **Branch**: features/timeapplication
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Scroll down to "Environment" and add these variables:
   ```
   DB_HOST=<your-render-db-host>
   DB_PORT=5432
   DB_NAME=timesheet_db
   DB_USER=postgres
   DB_PASSWORD=<your-db-password>
   JWT_SECRET=<generate-strong-random-secret>
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```
5. Select plan (Free or Paid)
6. Click "Create Web Service"
7. Wait for deployment and copy the backend URL (e.g., https://timesheet-backend.onrender.com)

## Step 4: Run Database Migrations on Render

After backend deployment:

1. Go to your backend service
2. Click "Shell" tab
3. Run migration commands:
   ```bash
   npm install pg
   node runMigrationHolidays.js
   ```

Or alternatively, connect to the database and run SQL migrations:
```bash
psql <your-external-db-url> -f migration_add_leave_allocation.sql
```

## Step 5: Create Frontend Web Service

1. Click "New" → "Static Site" (OR "Web Service" for better control)
2. Select your GitHub repository
3. Fill in:
   - **Name**: timesheet-frontend
   - **Branch**: features/timeapplication
   - **Build Command**: `cd Timesheetapp/frontend && npm run build`
   - **Publish Directory**: `Timesheetapp/frontend/dist`
4. Add Environment Variable:
   ```
   VITE_API_BASE_URL=https://timesheet-backend.onrender.com
   ```
5. Click "Create Static Site"
6. Copy the frontend URL (e.g., https://timesheet-frontend.onrender.com)

## Step 6: Update Backend CORS

Update your backend environment variable:
```
ALLOWED_ORIGINS=https://timesheet-frontend.onrender.com
```

## Step 7: Update Frontend API URL

Update the frontend .env file:
```
VITE_API_BASE_URL=https://timesheet-backend.onrender.com
```

Then rebuild the frontend service.

## Important Notes

- **Free tier** services spin down after 15 minutes of inactivity
- **Paid tier** provides always-on service
- Keep `DB_PASSWORD` and `JWT_SECRET` secure
- Monitor logs for any deployment issues
- Database backups are recommended for production

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Ensure all environment variables are set
- Verify PostgreSQL connection string

### Frontend shows "Cannot connect to API"
- Check `VITE_API_BASE_URL` environment variable
- Ensure backend CORS allows frontend URL
- Check browser console for CORS errors

### Database connection fails
- Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Ensure database exists and migrations are run
- Check if IP whitelist is configured (if applicable)

## Local Testing with Production URLs

Before deploying to production, test locally:

```bash
# Update .env files with production URLs
# Backend .env
DB_HOST=your-render-db-host
# Frontend .env
VITE_API_BASE_URL=http://localhost:3001

# Then start services
cd backend && npm start
cd frontend && npm run dev
```
