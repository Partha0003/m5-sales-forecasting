#!/bin/bash
# Setup script for Linux/Mac
# This script copies CSV files from the root directory to the public folder

echo "Setting up Retail Sales Analytics Application..."

# Check if CSV files exist in root
csv_files=("item_master.csv" "submission.csv" "calendar.csv" "sales_train_evaluation.csv")
missing_files=()

for file in "${csv_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "Warning: The following files are missing from the root directory:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo "Please ensure all CSV files are in the project root before running this script."
fi

# Ensure public directory exists
if [ ! -d "public" ]; then
    mkdir public
    echo "Created public directory"
fi

# Copy files to public directory
copied_count=0
for file in "${csv_files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "public/$file"
        echo "Copied $file to public/"
        copied_count=$((copied_count + 1))
    fi
done

echo ""
echo "Setup complete! $copied_count files copied to public directory."
echo "You can now run 'npm install' and 'npm run dev' to start the application."

