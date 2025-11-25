# Folder Size Analyzer 📊

![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/vendettaBey.vendetta-folder-file-size-calculator?style=flat-square)
![VS Code Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/vendettaBey.vendetta-folder-file-size-calculator?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)
![VS Code Version](https://img.shields.io/badge/VS%20Code-1.75.0+-blue.svg?style=flat-square)

**Folder Size Analyzer** is a powerful VS Code extension that helps you analyze and visualize folder sizes in your workspace. Quickly identify large directories, manage disk space, and optimize your project structure with an intuitive tree view and interactive charts.

---

## Features

✨ **Real-time Analysis**: Calculate folder and file sizes instantly with optimized performance  
📊 **Interactive Charts**: Visualize size distribution with beautiful, interactive charts  
🌲 **Tree View**: Browse your workspace structure with size information at a glance  
⚙️ **Highly Configurable**: Customize ignore patterns, thresholds, and display options  
🎨 **Visual Indicators**: Color-coded badges show size warnings (yellow/red) in Explorer  
🚀 **Performance Optimized**: Concurrent processing with configurable limits  
📋 **Copy & Share**: Easily copy size information to clipboard  
🔍 **Smart Filtering**: Ignore specific folders or patterns (e.g., `.git`, `node_modules/.cache`)  
🎯 **Context Menu Integration**: Right-click folders in Explorer for quick actions

---

## ⚡ Quick Start

1. **Install the extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vendettaBey.vendetta-folder-file-size-calculator)
2. **Open a workspace** in VS Code
3. **Click the Folder Size icon** in the Activity Bar (left sidebar)
4. **View your folder sizes** in the tree view or click the chart icon for visualization

---

## 🖥️ Platform Support

✅ **Windows** 10/11  
✅ **macOS** 10.15+  
✅ **Linux** (Ubuntu, Fedora, CentOS, etc.)

---

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Press `Ctrl+P` (or `Cmd+P` on macOS)
3. Type: `ext install vendettaBey.vendetta-folder-file-size-calculator`
4. Press Enter

### From VSIX File

```bash
code --install-extension vendetta-folder-file-size-calculator-1.4.0.vsix
```

---

## Usage

### 1. **Activity Bar View**

Click the **Folder Size** icon in the Activity Bar to open the dedicated view:

- Browse folders and files with their sizes
- Click the **refresh** icon to re-analyze
- Click the **chart** icon to visualize size distribution
- Click the **filter** icon to select folders to ignore

### 2. **Command Palette**

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and run:

| Command                                 | Description                             |
| --------------------------------------- | --------------------------------------- |
| `Folder Size: Analyze Workspace`        | Analyze entire workspace                |
| `Folder Size: Refresh`                  | Refresh the current analysis            |
| `Folder Size: Show Chart`               | Display interactive size chart          |
| `Folder Size: Copy Item Size`           | Copy selected item's size to clipboard  |
| `Folder Size: Open In Explorer`         | Open folder in system file explorer     |
| `Folder Size: Re-Analyze Current Node`  | Re-analyze specific folder              |
| `Folder Size: Select Folders to Ignore` | Choose folders to exclude from analysis |

### 3. **Context Menu**

Right-click any folder in the Explorer view:

- **Show Chart**: Visualize folder size distribution
- **Copy Size**: Copy folder size to clipboard

---

## 🛠️ Configuration

### Settings

Configure the extension via `Settings > Extensions > Folder Size`:

```json
{
  // Folders to pre-cache on startup (empty array = all folders)
  "folderSize.targetFolders": [
    "node_modules",
    "dist",
    "build",
    ".next",
    "cache"
  ],

  // Glob patterns to ignore during analysis
  "folderSize.ignorePatterns": [
    "**/.git",
    "**/.vscode",
    "**/node_modules/.cache"
  ],

  // Path to custom ignore file (relative to workspace root)
  "folderSize.ignoreFile": ".folder-size-ignore",

  // Show individual files in tree view
  "folderSize.showFiles": true,

  // Show size badge decorations in Explorer
  "folderSize.showBadges": true,

  // Size thresholds for color coding (in MB)
  "folderSize.thresholds": {
    "warnMB": 50, // Yellow warning
    "dangerMB": 200 // Red danger
  },

  // Maximum concurrent filesystem operations
  "folderSize.concurrencyLimit": 8
}
```

### Custom Ignore File

Create a `.folder-size-ignore` file in your workspace root to exclude specific patterns:

```
# Ignore all log files
**/*.log

# Ignore temporary directories
**/tmp
**/temp

# Ignore build artifacts
**/dist
**/build
```

---

## 📊 Chart Visualization

The interactive chart feature provides:

- **Pie Chart**: Visual breakdown of folder sizes
- **Hover Details**: See exact sizes and percentages
- **Color Coding**: Easily identify large folders
- **Responsive Design**: Works on all screen sizes

To open the chart:

1. Click the chart icon in the Folder Size view title bar
2. Right-click a folder in Explorer → **Show Chart**
3. Run command: `Folder Size: Show Chart`

---

## 🎯 Use Cases

### 1. **Optimize Node.js Projects**

Quickly identify bloated `node_modules` folders and unused dependencies.

### 2. **Clean Build Artifacts**

Find and remove large `dist`, `build`, or `.next` directories.

### 3. **Manage Monorepos**

Analyze individual packages in a monorepo structure.

### 4. **Disk Space Management**

Identify which folders are consuming the most space.

### 5. **CI/CD Optimization**

Reduce build times by identifying unnecessary files.

---

## 🔧 Troubleshooting

### Extension not showing folder sizes?

1. **Refresh the view**: Click the refresh icon in the Folder Size view
2. **Check ignore patterns**: Ensure your folders aren't excluded in settings
3. **Reload VS Code**: Press `Ctrl+Shift+P` → `Developer: Reload Window`

### Performance issues with large workspaces?

1. **Reduce concurrency**: Lower `folderSize.concurrencyLimit` (e.g., to `4`)
2. **Add ignore patterns**: Exclude unnecessary folders
3. **Limit target folders**: Specify only essential folders in `folderSize.targetFolders`

### Chart not displaying?

1. **Check browser compatibility**: Ensure VS Code's webview is working
2. **Reload window**: Press `Ctrl+Shift+P` → `Developer: Reload Window`
3. **Check console**: Open Developer Tools (`Help > Toggle Developer Tools`) for errors

---

## 🚀 Roadmap

- [ ] Export analysis results to JSON/CSV
- [ ] Historical size tracking and trends
- [ ] Compare sizes across branches
- [ ] Integration with `.gitignore` patterns
- [ ] Custom chart types (bar, line, treemap)
- [ ] Multi-workspace support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Support

If you enjoy this extension and want to support its development, you can buy me a coffee! ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/vendettabey)

Your support helps me create more awesome tools and extensions! 🙏

---

## 📧 Contact

- **Author**: Vendetta
- **GitHub**: [@vendettaBey](https://github.com/vendettaBey)
- **Repository**: [folder-file-size-calculator](https://github.com/vendettaBey/folder-file-size-calculator)
- **Issues**: [Report a bug](https://github.com/vendettaBey/folder-file-size-calculator/issues)

---

## ⭐ Show Your Support

If this extension helped you, please consider:

- ⭐ Starring the [GitHub repository](https://github.com/vendettaBey/folder-file-size-calculator)
- ✍️ Writing a [review on the marketplace](https://marketplace.visualstudio.com/items?itemName=vendettaBey.vendetta-folder-file-size-calculator&ssr=false#review-details)
- 🐦 Sharing it with your friends and colleagues

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/vendettaBey">Vendetta</a></sub>
</div>
