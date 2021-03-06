// The module 'vscode' contains the VS Code extensibility API
// Import the necessary extensibility types to use in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: vscode.ExtensionContext) {
  // create a new word counter
  let wordCounter = new WordCounter();
  let controller = new WordCounterController(wordCounter);

  // Add to a list of disposables which are disposed when this extension is deactivated.
  context.subscriptions.push(controller);
  context.subscriptions.push(wordCounter);
}

export class WordCounter {

  private _statusBarItem: vscode.StatusBarItem;

  public updateWordCount() {

    // Create as needed
    if (!this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }

    // Get the current text editor
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      this._statusBarItem.hide();
      return;
    }

    let doc = editor.document;

    let count = this._getWordCount(doc);

    // Update the status bar
    this._statusBarItem.text = `$(pencil) ${count[0]} Lines, ${count[1]} Words`;
    this._statusBarItem.show();
  }

  public _getWordCount(doc: vscode.TextDocument): object {

    let docContent = doc.getText();
    let wordCount = 0;

    const regular = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\s\/{2,}.*?(\r|\n))|(\s\/\*(\n|.)*?\*\/)/g;

    docContent = docContent.replace(/http:\/\/[\w|\.|-]+/g, 'http ');

    docContent = docContent.replace(regular, (word) => {
      return /^\s\/{2,}/.test(word) || /^\s\/\*/.test(word) ? "" : word;
    });

    let eng_str = docContent.match(/[a-z]+/ig);
    let chi_str = docContent.match(/[\u4e00-\u9fa5]/g);
    let num_str = docContent.match(/[0-9]+/g);
    let eng_len = eng_str !== null ? eng_str.length : 0;
    let chi_len = chi_str !== null ? chi_str.length : 0;
    let num_len = num_str !== null ? num_str.length : 0;

    wordCount = eng_len + chi_len + num_len;

    return [doc.lineCount, wordCount];
  }

  public dispose() {
    this._statusBarItem.dispose();
  }
}

class WordCounterController {

  private _wordCounter: WordCounter;
  private _disposable: vscode.Disposable;

  constructor(wordCounter: WordCounter) {
    this._wordCounter = wordCounter;
    this._wordCounter.updateWordCount();

    // subscribe to selection change and editor activation events
    let subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
    vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

    // create a combined disposable from both event subscriptions
    this._disposable = vscode.Disposable.from(...subscriptions);
  }

  private _onEvent() {
    this._wordCounter.updateWordCount();
  }

  public dispose() {
    this._disposable.dispose();
  }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
