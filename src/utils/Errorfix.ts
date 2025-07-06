import * as vscode from 'vscode';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBNP8L1vFKs_zrWQLRL32aoM9TO7GcInlM" });

export async function errorfix(personalizationData: any): Promise<string> {  
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage(" No active text editor found.");
        return "";
    }

    const document = editor.document;
    if (document.languageId === 'plaintext' || document.uri.scheme !== 'file') {
        vscode.window.showErrorMessage(" Please open a valid code file.");
        return "";
    }

    const code = document.getText().trim();
    if (!code) {
        vscode.window.showErrorMessage(" The file is empty.");
        return "";
    }

    try {
        vscode.window.showInformationMessage("🔍 Analyzing code...");

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Fix the following ${document.languageId} code:\n\n${code}\n\n
            Provide only the corrected code **inside triple backticks** (\`\`\`), without any explanation or additional text. 
            No markdown, no extra formatting, just the code output.
            
            Additional Information:
            Tech Stack: ${personalizationData.techStack}
            Project Name: ${personalizationData.projectName}
            System User: ${personalizationData.systemUser}`
        });

        let fixedCode = response?.text?.trim();
        if (!fixedCode) {
            vscode.window.showErrorMessage("❌ No fixed code received from AI.");
            return code;
        }

        // 🔹 Extract only the code part from AI response
        const match = fixedCode.match(/```[\s\S]*?\n([\s\S]*?)```/);
        if (match) {
            fixedCode = match[1].trim(); // Extract code inside triple backticks
        }

        vscode.window.showInformationMessage("✅ Code Fix Complete.");

        await editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(code.length)
            );
            editBuilder.replace(fullRange, fixedCode);
        });

        return fixedCode;
    } catch (error) {
        vscode.window.showErrorMessage("❌ Error fixing code: " + (error instanceof Error ? error.message : "Unknown error"));
        return code;
    }
}
