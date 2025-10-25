#!/bin/bash

# Secret Generator Utility
# Generates secure secrets for various purposes

echo "🔐 Secret Generator Utility"
echo "=========================="
echo ""

# Function to generate a secret
generate_secret() {
    local length=$1
    local format=$2
    
    case $format in
        "base64")
            node -e "console.log(require('crypto').randomBytes($length).toString('base64'))"
            ;;
        "hex")
            node -e "console.log(require('crypto').randomBytes($length).toString('hex'))"
            ;;
        "alphanumeric")
            node -e "
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < $length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            console.log(result);
            "
            ;;
        *)
            echo "Unknown format: $format"
            ;;
    esac
}

echo "Choose what to generate:"
echo "1) NextAuth Secret (32 bytes, base64)"
echo "2) JWT Secret (64 bytes, base64)"
echo "3) API Key (32 chars, alphanumeric)"
echo "4) Database Password (16 chars, alphanumeric)"
echo "5) Custom secret"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔑 NextAuth Secret:"
        echo "NEXTAUTH_SECRET=$(generate_secret 32 base64)"
        ;;
    2)
        echo ""
        echo "🔑 JWT Secret:"
        echo "JWT_SECRET=$(generate_secret 64 base64)"
        ;;
    3)
        echo ""
        echo "🔑 API Key:"
        echo "API_KEY=$(generate_secret 32 alphanumeric)"
        ;;
    4)
        echo ""
        echo "🔑 Database Password:"
        echo "DB_PASSWORD=$(generate_secret 16 alphanumeric)"
        ;;
    5)
        echo ""
        read -p "Enter length (bytes/chars): " length
        echo "Choose format:"
        echo "1) Base64"
        echo "2) Hex"
        echo "3) Alphanumeric"
        read -p "Format choice (1-3): " format_choice
        
        case $format_choice in
            1) format="base64" ;;
            2) format="hex" ;;
            3) format="alphanumeric" ;;
            *) echo "Invalid format"; exit 1 ;;
        esac
        
        echo ""
        echo "🔑 Custom Secret:"
        echo "SECRET=$(generate_secret $length $format)"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "⚠️  Important Security Notes:"
echo "• Never commit secrets to version control"
echo "• Use different secrets for different environments"
echo "• Store secrets securely (Railway dashboard, .env files)"
echo "• Rotate secrets regularly for production systems"