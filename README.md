# Folder Size Analyzer for VS Code

Analyze the size of your workspace folders directly from VS Code.

## Features

- **Analyze Workspace**: Calculate the size of specific folders (e.g., `node_modules`, `dist`, `build`) in your workspace.
- **Status Bar Integration**: Click the "Folder Size" item in the status bar to start analysis.
- **Configurable**: Customize which folders to analyze via settings.

## Usage

1. Open a workspace.
2. Click "Folder Size" in the status bar OR run the command `Folder Size: Analyze Workspace`.
3. View the results in the Output panel.

## Settings

- `folderSize.targetFolders`: Array of folder names to analyze (default: `["node_modules", "dist", "build", "cache"]`).
