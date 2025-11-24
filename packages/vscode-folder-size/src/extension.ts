import * as vscode from "vscode";
import { analyzeFolders, formatBytes } from "./core";
import * as path from "path";
import * as fs from "fs/promises";
import { minimatch } from "minimatch";

let outputChannel: vscode.OutputChannel;
let folderSizeCache = new Map<string, { size: number; formattedSize: string }>();
let sizeComputationCache = new Map<string, Promise<number>>();
let decorationEventEmitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
let effectiveIgnorePatterns: string[] = [];

class FolderSizeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public size: number | undefined,
    public formattedSize: string,
    public readonly itemPath: string,
    public readonly isDirectory: boolean
  ) {
    super(
      label,
      isDirectory
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    this.updateDescription();
    this.iconPath = isDirectory ? new vscode.ThemeIcon("folder") : vscode.ThemeIcon.File;
    this.contextValue = isDirectory ? "folder" : "file";
    this.resourceUri = vscode.Uri.file(itemPath);
  }

  updateDescription() {
    if (this.size === undefined) {
      this.description = this.isDirectory ? "…" : "0 Bytes";
      this.tooltip = `${this.label}: calculating…`;
    } else {
      this.description = this.formattedSize;
      this.tooltip = `${this.label}: ${this.formattedSize}`;
    }
  }
}

class FolderSizeProvider implements vscode.TreeDataProvider<FolderSizeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<FolderSizeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private rootPath: string = "";

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setRootPath(path: string): void {
    this.rootPath = path;
    this.refresh();
  }

  getTreeItem(element: FolderSizeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FolderSizeItem): Promise<FolderSizeItem[]> {
    if (!this.rootPath) return [];
    const config = vscode.workspace.getConfiguration("folderSize");
    const showFiles = config.get<boolean>("showFiles", true);
    const ignorePatterns = effectiveIgnorePatterns.length
      ? effectiveIgnorePatterns
      : config.get<string[]>("ignorePatterns", []);
    const concurrencyLimit = config.get<number>("concurrencyLimit", 8);

    const dirPath = element ? element.itemPath : this.rootPath;
    let dirents: fs.Dirent[] = [] as any;
    try {
      dirents = await fs.readdir(dirPath, { withFileTypes: true }) as any;
    } catch {
      return [];
    }

    const items: FolderSizeItem[] = [];
    for (const d of dirents) {
      if (d.name.startsWith(".")) continue; // skip hidden
      const itemPath = path.join(dirPath, d.name);
      const isDir = d.isDirectory();
      if (!showFiles && !isDir) continue;
      const cached = folderSizeCache.get(itemPath);
      const size = cached?.size;
      const formatted = isIgnored
        ? "(ignored)"
        : (cached?.formattedSize || (size !== undefined ? formatBytes(size) : "0 Bytes"));
      const node = new FolderSizeItem(d.name, size, formatted, itemPath, isDir);
      items.push(node);

      // Lazy compute directory size if missing
      if (isDir && size === undefined && !isIgnored) {
        if (!sizeComputationCache.has(itemPath)) {
          const promise = (async () => {
            try {
              const result = await analyzeFolders([itemPath], {
                ignore: ignorePatterns,
                concurrencyLimit,
                cache: new Map<string, number>()
              });
              const r = result[0];
              if (r && !r.error) {
                folderSizeCache.set(itemPath, { size: r.size, formattedSize: r.formattedSize });
                node.size = r.size;
                node.formattedSize = r.formattedSize;
                node.updateDescription();
                this.refresh();
                decorationEventEmitter.fire(vscode.Uri.file(itemPath));
              }
              return r?.size || 0;
            } catch {
              return 0;
            }
          })();
          sizeComputationCache.set(itemPath, promise);
          promise.finally(() => sizeComputationCache.delete(itemPath));
        }
      }
      // Files: compute size immediately if not cached
      if (!isDir && size === undefined && !isIgnored) {
        try {
          const stat = await fs.stat(itemPath);
          folderSizeCache.set(itemPath, { size: stat.size, formattedSize: formatBytes(stat.size) });
          node.size = stat.size;
          node.formattedSize = formatBytes(stat.size);
          node.updateDescription();
        } catch {
          // ignore
        }
      }
    }

    // Sort: folders first, then by computed size desc; unknown sizes last
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      const aSize = a.size === undefined ? -1 : a.size;
      const bSize = b.size === undefined ? -1 : b.size;
      return bSize - aSize;
    });
    return items;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Folder Size extension activated');
  outputChannel = vscode.window.createOutputChannel("Folder Size");

  // Create tree data provider
  const folderSizeProvider = new FolderSizeProvider();
  vscode.window.registerTreeDataProvider("folderSizeView", folderSizeProvider);

  // Register file decoration provider
  const decorationProvider: vscode.FileDecorationProvider = {
    provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
      const config = vscode.workspace.getConfiguration("folderSize");
      const showBadges = config.get<boolean>("showBadges", true);
      const thresholds = config.get<any>("thresholds", { warnMB: 50, dangerMB: 200 });
      const cached = folderSizeCache.get(uri.fsPath);
      if (!cached || cached.size <= 0) return undefined;
      const sizeMB = cached.size / (1024 * 1024);
      let color: vscode.ThemeColor | undefined;
      if (sizeMB >= thresholds.dangerMB) color = new vscode.ThemeColor("errorForeground");
      else if (sizeMB >= thresholds.warnMB) color = new vscode.ThemeColor("warningForeground");
      return {
        badge: showBadges ? "●" : undefined,
        tooltip: `Size: ${cached.formattedSize}`,
        color,
      };
    },
    onDidChangeFileDecorations: decorationEventEmitter.event,
  };

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  // Auto-analyze on activation
  const autoAnalyze = async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const rootPath = workspaceFolders[0].uri.fsPath;
    folderSizeProvider.setRootPath(rootPath);

    try {
      const config = vscode.workspace.getConfiguration("folderSize");
      const ignorePatterns = effectiveIgnorePatterns.length
        ? effectiveIgnorePatterns
        : config.get<string[]>("ignorePatterns", []);
      const concurrencyLimit = config.get<number>("concurrencyLimit", 8);
      const targetFoldersSetting = config.get<string[]>("targetFolders", []);
      const items = await fs.readdir(rootPath, { withFileTypes: true });
      let folderDirents = items.filter((i: any) => i.isDirectory() && !i.name.startsWith('.'));
      if (targetFoldersSetting.length > 0) {
        folderDirents = folderDirents.filter((d: any) => targetFoldersSetting.includes(d.name));
      }
      const folders = folderDirents.map((d: any) => path.join(rootPath, d.name));
      const results = await analyzeFolders(folders, { ignore: ignorePatterns, concurrencyLimit });
      results.forEach((result) => {
        if (!result.error && result.size > 0) {
          folderSizeCache.set(result.path, {
            size: result.size,
            formattedSize: result.formattedSize,
          });
        }
      });
      
      decorationEventEmitter.fire(results.filter(r => !r.error).map(r => vscode.Uri.file(r.path)));
      folderSizeProvider.refresh();
    } catch (error) {
      // Silent fail for auto-analysis
    }
  };

  // Run auto-analysis after a short delay
  setTimeout(autoAnalyze, 1000);

  let disposable = vscode.commands.registerCommand(
    "folder-size.analyzeWorkspace",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace is open.");
        return;
      }

      const config = vscode.workspace.getConfiguration("folderSize");
      const targetFolders = config.get<string[]>("targetFolders") || [
        "node_modules",
        "dist",
        "build",
        "cache",
      ];

      outputChannel.show();
      outputChannel.appendLine(
        `[FolderSize] Analyzing workspace: ${workspaceFolders[0].name}...`
      );

      const rootPath = workspaceFolders[0].uri.fsPath;
      const foldersToAnalyze = targetFolders.map(
        (folder: string) =>
          vscode.Uri.joinPath(workspaceFolders[0].uri, folder).fsPath
      );

      try {
        const configFull = vscode.workspace.getConfiguration("folderSize");
        const ignorePatterns = configFull.get<string[]>("ignorePatterns", []);
        const concurrencyLimit = configFull.get<number>("concurrencyLimit", 8);
        const results = await analyzeFolders(foldersToAnalyze, { ignore: ignorePatterns, concurrencyLimit });
        let totalSize = 0;

        outputChannel.appendLine("");

        // Clear cache and update with new results
        folderSizeCache.clear();

        const urisToUpdate: vscode.Uri[] = [];

        results.forEach((result) => {
          if (result.error) {
            // Only show error if it's not "Folder not found" to avoid clutter, or show it differently
            if (result.error !== "Folder not found") {
              outputChannel.appendLine(`❌ ${result.path}: ${result.error}`);
            }
          } else {
            const relativePath = result.path.replace(rootPath + "/", "");
            outputChannel.appendLine(
              `📁 ${relativePath.padEnd(30)} → ${result.formattedSize}`
            );
            totalSize += result.size;

            // Cache the folder size for decoration
            folderSizeCache.set(result.path, {
              size: result.size,
              formattedSize: result.formattedSize,
            });

            // Add URI to update list
            urisToUpdate.push(vscode.Uri.file(result.path));
          }
        });

        // Trigger decoration update for all folders
        decorationEventEmitter.fire(urisToUpdate);
        
        // Refresh tree view
        folderSizeProvider.refresh();

        outputChannel.appendLine("");
        outputChannel.appendLine(`Total: ${formatBytes(totalSize)}`);

        vscode.window.showInformationMessage(
          `Folder Size Analysis Complete. Total: ${formatBytes(totalSize)}`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Error analyzing folders: ${error.message}`
        );
        outputChannel.appendLine(`Error: ${error.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand(
    "folder-size.refresh",
    () => {
      autoAnalyze();
    }
  );
  context.subscriptions.push(refreshCommand);

  // Copy size command
  const copySizeCommand = vscode.commands.registerCommand("folder-size.copySize", async (item?: FolderSizeItem) => {
    if (!item) {
      vscode.window.showWarningMessage("No item selected to copy size.");
      return;
    }
    const cached = folderSizeCache.get(item.itemPath);
    if (!cached) {
      vscode.window.showWarningMessage("Size not yet calculated.");
      return;
    }
    await vscode.env.clipboard.writeText(cached.formattedSize);
    vscode.window.showInformationMessage(`Copied size: ${cached.formattedSize}`);
  });
  context.subscriptions.push(copySizeCommand);

  // Open folder/file in explorer
  const openFolderCommand = vscode.commands.registerCommand("folder-size.openFolder", async (item?: FolderSizeItem) => {
    if (!item) return;
    vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(item.itemPath));
  });
  context.subscriptions.push(openFolderCommand);

  // Re-analyze a node
  const reanalyzeCommand = vscode.commands.registerCommand("folder-size.reanalyze", async (item?: FolderSizeItem) => {
    if (!item) return;
    folderSizeCache.delete(item.itemPath);
    sizeComputationCache.delete(item.itemPath);
    decorationEventEmitter.fire(vscode.Uri.file(item.itemPath));
    folderSizeProvider.refresh();
    vscode.window.showInformationMessage(`Re-analyzing: ${item.label}`);
  });
  context.subscriptions.push(reanalyzeCommand);

  // React to config changes
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration("folderSize")) {
      decorationEventEmitter.fire([...folderSizeCache.keys()].map(p => vscode.Uri.file(p)));
      folderSizeProvider.refresh();
    }
  }));

  // Load ignore file and watch for changes
  const loadIgnoreFile = async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;
    const root = workspaceFolders[0].uri.fsPath;
    const config = vscode.workspace.getConfiguration("folderSize");
    const ignoreFile = config.get<string>("ignoreFile", ".folder-size-ignore");
    const filePath = path.join(root, ignoreFile);
    let filePatterns: string[] = [];
    try {
      const content = await fs.readFile(filePath, "utf8");
      filePatterns = content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
    } catch {
      filePatterns = [];
    }
    const settingPatterns = config.get<string[]>("ignorePatterns", []) || [];
    // Merge and unique
    const merged = Array.from(new Set([...settingPatterns, ...filePatterns]));
    effectiveIgnorePatterns = merged;
    folderSizeProvider.refresh();
    decorationEventEmitter.fire([...folderSizeCache.keys()].map(p => vscode.Uri.file(p)));
  };

  loadIgnoreFile();
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders[0]) {
    const pattern = new vscode.RelativePattern(folders[0], "**/*");
    // Specific watcher for ignore file
    const config = vscode.workspace.getConfiguration("folderSize");
    const ignoreFileName = config.get<string>("ignoreFile", ".folder-size-ignore");
    const ignoreWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folders[0], ignoreFileName)
    );
    ignoreWatcher.onDidChange(loadIgnoreFile);
    ignoreWatcher.onDidCreate(loadIgnoreFile);
    ignoreWatcher.onDidDelete(loadIgnoreFile);
    context.subscriptions.push(ignoreWatcher);
  }

  const myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  myStatusBarItem.command = "folder-size.analyzeWorkspace";
  myStatusBarItem.text = "$(folder) Folder Size";
  myStatusBarItem.tooltip = "Click to analyze workspace folder sizes";
  myStatusBarItem.show();
  context.subscriptions.push(myStatusBarItem);
  console.log('Status bar item created and shown');
}

export function deactivate() {
  decorationEventEmitter.dispose();
}
