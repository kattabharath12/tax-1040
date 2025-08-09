
# Tax Filing Application - Railway Deployment Guide

This guide will walk you through deploying the comprehensive tax filing application on Railway.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Railway Account
- Sign up at [railway.app](https://railway.app) if you haven't already
- Install Railway CLI: `npm install -g @railway/cli`
- Login: `railway login`

### 2. Database Setup
1. Create a new Railway project: `railway new`
2. Add PostgreSQL database: `railway add postgresql`
3. Note down the database connection string from Railway dashboard

### 3. Environment Variables Setup
Copy the `.env.example` file and configure these required variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication (Required)
NEXTAUTH_URL="https://your-app-name.railway.app"
NEXTAUTH_SECRET="your-secure-random-string-here"

# Abacus AI Integration (Required)
ABACUSAI_API_KEY="your_abacusai_api_key_here"

# Google Document AI (Optional - fallback to LLM processing if not provided)
GOOGLE_CLOUD_PROJECT_ID="your-google-cloud-project-id"
GOOGLE_CLOUD_LOCATION="us"
GOOGLE_CLOUD_W2_PROCESSOR_ID="your-w2-processor-id"
GOOGLE_CLOUD_1099_PROCESSOR_ID="your-1099-processor-id"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

### 4. Deploy the Application
```bash
# Navigate to your project directory
cd your-tax-app-directory

# Deploy to Railway
railway up

# Set environment variables (replace with your actual values)
railway variables set NEXTAUTH_SECRET=your-secure-random-string
railway variables set NEXTAUTH_URL=https://your-app-name.railway.app
railway variables set ABACUSAI_API_KEY=your-abacus-ai-key

# Database URL will be automatically set by Railway
```

### 5. Database Migration
After deployment, run the database migrations:
```bash
# Connect to your Railway project
railway shell

# Run Prisma migrations
npx prisma db push
```

## 🔧 Detailed Configuration

### Required Environment Variables

#### Database Configuration
- **DATABASE_URL**: PostgreSQL connection string (automatically provided by Railway)

#### Authentication Setup
- **NEXTAUTH_URL**: Your Railway app URL (format: `https://your-app-name.railway.app`)
- **NEXTAUTH_SECRET**: Generate using: `openssl rand -base64 32`

#### Abacus AI Integration
- **ABACUSAI_API_KEY**: Your Abacus AI API key for document processing
- Visit [Abacus AI](https://abacus.ai) to get your API key

#### Google Document AI (Optional)
If you want to use Google's Document AI for enhanced document processing:
- **GOOGLE_CLOUD_PROJECT_ID**: Your Google Cloud Project ID
- **GOOGLE_CLOUD_LOCATION**: Processing location (default: "us")
- **GOOGLE_CLOUD_W2_PROCESSOR_ID**: W-2 form processor ID
- **GOOGLE_CLOUD_1099_PROCESSOR_ID**: 1099 form processor ID
- **GOOGLE_APPLICATION_CREDENTIALS**: Path to service account JSON file

### Railway Configuration (railway.json)
The application includes a pre-configured `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 📊 Application Features

This tax filing application includes:
- **7-step tax workflow** with guided user experience
- **Form 1040 generation** with PDF export capability
- **Document processing** via Abacus AI and Google Document AI
- **W-2 and 1099 form processing** with data extraction
- **Tax calculations and optimization** suggestions
- **Secure authentication** with NextAuth
- **Professional UI** built with shadcn/ui components
- **Database persistence** with Prisma and PostgreSQL

## 🛠 Post-Deployment Setup

### 1. Verify Database Connection
Check if the database is properly connected:
```bash
railway shell
npx prisma db pull
```

### 2. Test Application Features
- Navigate to your deployed app
- Test user registration/login
- Try uploading a sample tax document
- Verify form generation works

### 3. Monitor Logs
```bash
railway logs
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
- **Problem**: "Can't reach database server"
- **Solution**: Ensure DATABASE_URL is correctly set and database service is running

#### Build Failures
- **Problem**: "Module not found" errors
- **Solution**: Ensure all dependencies are in package.json, not just devDependencies

#### Prisma Issues
- **Problem**: "Prisma client not generated"
- **Solution**: The `postinstall` script should handle this, but you can manually run:
  ```bash
  railway shell
  npx prisma generate
  ```

#### Authentication Issues
- **Problem**: NextAuth callbacks not working
- **Solution**: Ensure NEXTAUTH_URL matches your Railway domain exactly

#### Document Processing Issues
- **Problem**: Document AI not working
- **Solution**: Verify ABACUSAI_API_KEY is set. Google Document AI is optional and will fallback to LLM processing

### Environment Variable Checklist
- [ ] DATABASE_URL (automatically set by Railway)
- [ ] NEXTAUTH_URL (set to your Railway app URL)
- [ ] NEXTAUTH_SECRET (generate secure random string)
- [ ] ABACUSAI_API_KEY (required for document processing)
- [ ] Google Cloud variables (optional)

### Performance Optimization
- The app is configured for single replica by default
- Monitor resource usage in Railway dashboard
- Consider upgrading plan if you experience slow performance

### Security Considerations
- Never commit actual .env files
- Use strong NEXTAUTH_SECRET
- Keep API keys secure
- Enable Railway's built-in SSL (automatically handled)

## 📞 Support

For technical issues:
1. Check Railway deployment logs: `railway logs`
2. Review error messages in browser console
3. Verify all environment variables are set correctly
4. Test database connectivity

## 🔄 Updates and Maintenance

To update your deployment:
```bash
# Make your changes locally
git add .
git commit -m "Your update message"

# Deploy updates
railway up
```

For database schema changes:
```bash
railway shell
npx prisma db push
```

---

**Note**: This application requires proper API keys for full functionality. The Abacus AI integration is essential for document processing features.
