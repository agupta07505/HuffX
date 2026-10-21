# HuffX — Windows Setup & Launcher

This directory contains the Windows batch setup script for HuffX.

### Features
1. **Checks Python** (verifies Python 3 is installed and in PATH).
2. **Checks Node.js & npm** (verifies Node 18+ and npm are available).
3. **Smart Dependency Check**:
   - If `node_modules` is **missing**, it automatically runs `npm install`.
   - If `node_modules` is **already present**, it skips installation for instant startup.
4. **Verifies the Huffman Engine** (`huffman.py selftest`).
5. **Starts the local development server** on `http://localhost:5000` and automatically opens it in your default browser.

---

### How to Run:

- **Option 1 (Double-Click)**:
  Double-click `run.bat` (or `setup.bat`) directly from File Explorer.

- **Option 2 (Command Prompt / PowerShell)**:
  ```cmd
  SetUp\run.bat
  ```
