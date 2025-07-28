# Calibre Setup Guide for EPUB Generation

## Overview
Calibre is the industry-standard tool for e-book conversion. It provides the most reliable way to generate EPUB files that work perfectly on Kindle devices.

## Installation

### macOS
```bash
# Using Homebrew (recommended)
brew install --cask calibre

# Or download from https://calibre-ebook.com/download_osx
```

### Linux (Ubuntu/Debian)
```bash
# Install Calibre
sudo apt-get update
sudo apt-get install calibre

# Or download from https://calibre-ebook.com/download_linux
```

### Windows
1. Download Calibre from https://calibre-ebook.com/download_windows
2. Run the installer
3. Add Calibre to your PATH environment variable

## Verification
After installation, verify that the CLI is available:
```bash
ebook-convert --version
```

You should see output like:
```
ebook-convert (calibre 7.0.0)
Created by: Kovid Goyal <kovid@kovidgoyal.net>
```

## How It Works
1. **HTML Input**: Your web app generates optimized HTML
2. **Calibre Conversion**: `ebook-convert` converts HTML to EPUB
3. **EPUB Output**: Perfect Kindle-compatible EPUB files

## Benefits
- ✅ **Industry Standard**: Used by millions of users
- ✅ **Kindle Compatible**: Creates files that work perfectly on Kindle
- ✅ **Metadata Support**: Full title, author, publisher support
- ✅ **Reliable**: Proven technology with excellent error handling
- ✅ **Fallback**: If Calibre isn't installed, falls back to HTML

## Integration
The `EpubGenerator` class automatically:
1. Checks if Calibre is installed
2. Uses Calibre for EPUB generation if available
3. Falls back to HTML generation if not available
4. Provides detailed error messages

## Testing
Test the conversion:
```bash
# Create a test HTML file
echo '<html><body><h1>Test</h1><p>Content</p></body></html>' > test.html

# Convert to EPUB
ebook-convert test.html test.epub --title "Test Book" --authors "Test Author"
```

## Troubleshooting
- **Command not found**: Ensure Calibre is in your PATH
- **Permission denied**: Check file permissions
- **Conversion fails**: Check HTML validity and encoding 