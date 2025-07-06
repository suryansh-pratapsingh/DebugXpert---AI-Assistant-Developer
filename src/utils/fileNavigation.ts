import * as vscode from 'vscode';

export function openFile(): Promise<vscode.TextDocument> {
    return new Promise((resolve, reject) => {
        const filePath = vscode.Uri.file('/home/ayush/Desktop/test1.py'); // Change this to the actual file path

        vscode.workspace.openTextDocument(filePath).then(document => {
            vscode.window.showTextDocument(document);
            resolve(document); // Return the opened document
        }, err => {
            vscode.window.showErrorMessage(`Failed to open file: ${err}`);
            reject(err);
        });
    });
}
