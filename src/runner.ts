"use strict";
import * as os from "os";
import * as vscode from "vscode";

const TmpDir = os.tmpdir();

export class Runner implements vscode.Disposable {
    private _terminal: vscode.Terminal | null;
    private _codeFile!: string;
    private _cwd!: string;
    private _document!: vscode.TextDocument;
    private _workspaceFolder!: string;
    private _config!: vscode.WorkspaceConfiguration;
    private _potigolCommand = 'potigol';

    constructor() {
        this._terminal = null;
    }

    public onDidCloseTerminal(): void {
        this._terminal = null;
    }

    public async run() {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            this._document = editor.document;
        } else {
            vscode.window.showInformationMessage("No code found or selected.");
            return;
        }

        this.initialize();
        this.getCodeFileAndExecute();
    }

    public dispose() {
        // pass
    }

    private initialize(): void {
        this._config = this.getConfiguration("potigol-language");
        this._workspaceFolder = this.getWorkspaceFolder();
        this._cwd = this._workspaceFolder;

        if (this._cwd) {
            return;
        }

        this._cwd = TmpDir;
    }

    private getConfiguration(section?: string): vscode.WorkspaceConfiguration {
        if (this._document) {
            return vscode.workspace.getConfiguration(section, this._document.uri);
        } else {
            return vscode.workspace.getConfiguration(section);
        }
    }

    private getWorkspaceFolder(): string {
        if (vscode.workspace.workspaceFolders) {
            if (this._document) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._document.uri);
                if (workspaceFolder) {
                    return workspaceFolder.uri.fsPath;
                }
            }
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            return '';
        }
    }

    private getCodeFileAndExecute(appendFile: boolean = true): any {
        if (!this._document.isUntitled) {
            this._codeFile = this._document.fileName;

            if (this._config.get<boolean>("saveAllFilesBeforeRun")) {
                return vscode.workspace.saveAll().then(() => {
                    this.executeCommandInTerminal(this._potigolCommand, appendFile);
                });
            }

            if (this._config.get<boolean>("saveFileBeforeRun")) {
                return this._document.save().then(() => {
                    this.executeCommandInTerminal(this._potigolCommand, appendFile);
                });
            }
        }

        this.executeCommandInTerminal(this._potigolCommand, appendFile);
    }

    /**
     * Includes double quotes around a given file name.
     */
    private quoteFileName(fileName: string): string {
        return '\"' + fileName + '\"';
    }

    private async getFinalCommandToRunCodeFile(executor: string, appendFile: boolean = true): Promise<string> {
        return executor + (appendFile ? " " + this.quoteFileName(this._codeFile) : "");
    }

    private async executeCommandInTerminal(executor: string, appendFile: boolean = true) {
        let isNewTerminal = false;
        if (this._terminal === null) {
            this._terminal = vscode.window.createTerminal("Code");
            isNewTerminal = true;
        }
        this._terminal.show(this._config.get<boolean>("preserveFocus"));

        let command = await this.getFinalCommandToRunCodeFile(executor, appendFile);

        if (this._config.get<boolean>("clearPreviousOutput") && !isNewTerminal) {
            await vscode.commands.executeCommand("workbench.action.terminal.clear");
        }
        this._terminal.sendText(command);
    }

}