#!/bin/bash

# Build script for Netlify Functions
echo "Building MDM Backend for Netlify..."

# Install dependencies
npm install

# Create the service account key file from environment variable
if [ ! -z "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
    echo "Creating service account key file..."
    echo "$GOOGLE_SERVICE_ACCOUNT_KEY" > mdm_server_key.json
    echo "Service account key file created"
else
    echo "Warning: GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set"
fi

echo "Build completed successfully!"
