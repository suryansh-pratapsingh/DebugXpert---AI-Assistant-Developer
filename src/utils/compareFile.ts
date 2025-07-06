import * as vscode from 'vscode';
import { openFile } from './fileNavigation';

export function openAndCompareFile(originalText: string, fixedText: string, title: string) {
    if (originalText === fixedText) {
        vscode.window.showInformationMessage("No changes detected. The file is already up to date.");
        return;
    }

    createVirtualFile(fixedText).then(virtualUri => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        vscode.commands.executeCommand('vscode.diff', activeEditor.document.uri, virtualUri, title);

        // Ask the user if they want to apply the changes
        vscode.window.showInformationMessage("Do you want to apply the suggested changes?", "Yes", "No")
            .then(selection => {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');

                if (selection === "Yes") {
                    applyChanges(activeEditor.document, fixedText);
                }
            });
    }).catch(err => {
        vscode.window.showErrorMessage(`Error creating virtual file: ${err}`);
    });
}

// Create a virtual document for comparison
async function createVirtualFile(content: string): Promise<vscode.Uri> {
    const fixedUri = vscode.Uri.parse('untitled:FixedVersion');
    const fixedDoc = await vscode.workspace.openTextDocument(fixedUri);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(fixedUri, new vscode.Position(0, 0), content);
    await vscode.workspace.applyEdit(edit);
    return fixedUri;
}

// Apply changes to the real file
function applyChanges(document: vscode.TextDocument, newText: string) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
    
    edit.replace(document.uri, fullRange, newText);
    
    vscode.workspace.applyEdit(edit).then(success => {
        if (success) {
            document.save();
            vscode.window.showInformationMessage("Changes applied successfully.");
        } else {
            vscode.window.showErrorMessage("Failed to apply changes.");
        }
    });
}