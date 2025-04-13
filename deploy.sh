#!/bin/bash

# Enhanced deployment script for Vercel
# This script performs pre-deployment checks and safely deploys the app to Vercel

# Exit immediately if a command exits with a non-zero status
set -e

# Define colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define log file
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"

# Function to log and print status messages
log_and_print() {
  level=$1
  message=$2
  timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      echo -e "${BLUE}[INFO]${NC} $message"
      echo "[INFO] $timestamp - $message" >> "$LOG_FILE"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} $message"
      echo "[SUCCESS] $timestamp - $message" >> "$LOG_FILE"
      ;;
    "WARNING")
      echo -e "${YELLOW}[WARNING]${NC} $message"
      echo "[WARNING] $timestamp - $message" >> "$LOG_FILE"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} $message"
      echo "[ERROR] $timestamp - $message" >> "$LOG_FILE"
      ;;
  esac
}

# Initialize log file
echo "=== DEPLOYMENT LOG $(date) ===" > "$LOG_FILE"
log_and_print "INFO" "Starting deployment process..."

# Function to check if required environment variables are set
check_env_vars() {
  log_and_print "INFO" "Checking environment variables..."
  
  local required_vars=(
    "DATABASE_URL"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "BLOB_READ_WRITE_TOKEN"
    "OPENAI_API_KEY"
  )
  
  # Load env variables first
  if [ -f .env ]; then
    log_and_print "INFO" "Loading variables from .env file"
    # shellcheck source=/dev/null
    source .env
  fi
  
  local missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    log_and_print "ERROR" "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var" | tee -a "$LOG_FILE"
    done
    echo "" | tee -a "$LOG_FILE"
    log_and_print "ERROR" "Please set these variables in your .env file or Vercel environment."
    exit 1
  fi
  
  log_and_print "SUCCESS" "All required environment variables are set."
}

# Ensure we're on the latest code
log_and_print "INFO" "Updating git repository..."
git pull origin main >> "$LOG_FILE" 2>&1 || {
  log_and_print "WARNING" "Failed to pull latest code, continuing with local version"
}

# Check for environment variables
check_env_vars

# Check for Vercel CLI installation
log_and_print "INFO" "Checking for Vercel CLI installation..."
if ! command -v vercel &> /dev/null; then
  log_and_print "WARNING" "Vercel CLI not found. Installing it now..."
  npm install -g vercel >> "$LOG_FILE" 2>&1
fi

# Check for security vulnerabilities
log_and_print "INFO" "Checking for security vulnerabilities..."
npm run security >> "$LOG_FILE" 2>&1 || {
  log_and_print "WARNING" "Security check found issues. Review the log file for details."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_and_print "ERROR" "Deployment aborted by user due to security concerns."
    exit 1
  fi
}

# Clean the environment
log_and_print "INFO" "Cleaning up the environment..."
npm run clean >> "$LOG_FILE" 2>&1

# Install dependencies with legacy peer deps
log_and_print "INFO" "Installing dependencies with legacy peer deps..."
npm run install-deps >> "$LOG_FILE" 2>&1 || {
  log_and_print "WARNING" "Failed to install dependencies with npm script. Trying direct command..."
  npm install --legacy-peer-deps >> "$LOG_FILE" 2>&1 || {
    log_and_print "ERROR" "Failed to install dependencies. Check the log file for details."
    exit 1
  }
}

# Run linting checks
log_and_print "INFO" "Running linting checks..."
npm run lint-for-build >> "$LOG_FILE" 2>&1
log_and_print "INFO" "Lint check complete (warnings ignored for production)"

# Build the application
log_and_print "INFO" "Building the application..."
npm run build >> "$LOG_FILE" 2>&1 || {
  log_and_print "ERROR" "Build failed. Check the log file for details."
  exit 1
}

# Prepare for Vercel deployment
log_and_print "INFO" "Preparing for Vercel deployment..."
npm run prepare-vercel >> "$LOG_FILE" 2>&1 || {
  log_and_print "WARNING" "Vercel preparation step had issues. Check the log file for details."
}

# Deploy to Vercel
log_and_print "INFO" "Deploying to Vercel production environment..."
vercel --prod >> "$LOG_FILE" 2>&1 || {
  log_and_print "ERROR" "Vercel deployment failed. Check the log file for details."
  exit 1
}

log_and_print "SUCCESS" "Deployment complete!"
log_and_print "INFO" "Verify your deployment at https://vercel.com/dashboard"
log_and_print "INFO" "Deployment log saved to: $LOG_FILE" 