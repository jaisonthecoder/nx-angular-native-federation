#!/bin/sh

# This script runs at container startup to inject environment variables
# into the federation manifest and other config files

# Default values
LPCO_CNCA_URL=${LPCO_CNCA_URL:-"http://localhost:4202"}

# Update federation manifest
FEDERATION_MANIFEST="/usr/share/nginx/html/federation.manifest.json"

if [ -f "$FEDERATION_MANIFEST" ]; then
    echo "Updating federation manifest with runtime URLs..."
    
    # Create temporary file with updated URLs
    cat > "$FEDERATION_MANIFEST.tmp" <<EOF
{
  "lpco-cnca-app": "${LPCO_CNCA_URL}/remoteEntry.json"
}
EOF
    
    # Replace original file
    mv "$FEDERATION_MANIFEST.tmp" "$FEDERATION_MANIFEST"
    
    echo "Federation manifest updated successfully"
    cat "$FEDERATION_MANIFEST"
else
    echo "Warning: Federation manifest not found at $FEDERATION_MANIFEST"
fi

echo "Shell app environment initialized"
