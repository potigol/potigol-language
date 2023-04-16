// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Runner } from './runner';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const runner = new Runner();

  vscode.window.onDidCloseTerminal(() => {
    runner.onDidCloseTerminal();
  });

  const run = vscode.commands.registerCommand("potigol-language.run", (fileUri: vscode.Uri) => {
    runner.run();
  });

  context.subscriptions.push(run);
  context.subscriptions.push(runner);
}

// This method is called when your extension is deactivated
export function deactivate() { }
