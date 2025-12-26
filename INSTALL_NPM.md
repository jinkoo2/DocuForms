# Installing Node.js and npm

## Option 1: Using NodeSource Repository (Recommended for Ubuntu)

This installs Node.js 20.x (Current LTS) which is recommended for this project.

```bash
# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Option 2: Using nvm (Node Version Manager) - No sudo required

This is useful if you don't have sudo access or want to manage multiple Node.js versions.

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.bashrc

# Install Node.js 20 (Current LTS)
nvm install 20

# Use Node.js 20
nvm use 20

# Set as default
nvm alias default 20

# Verify installation
node --version
npm --version
```

## Option 3: Using Ubuntu Default Repository

```bash
# Install Node.js and npm from Ubuntu repository
sudo apt update
sudo apt install -y nodejs npm

# Verify installation
node --version
npm --version
```

**Note:** This may install an older version. If you get Node.js < 18, use Option 1 or 2 instead.

## Verify Installation

After installation, verify both are working:

```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

## Next Steps

Once npm is installed, you can proceed with frontend setup:

```bash
cd frontend
npm install
npm start
```

