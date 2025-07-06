import * as vscode from 'vscode';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { openAndCompareFile } from './compareFile';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: "AIzaSyBNP8L1vFKs_zrWQLRL32aoM9TO7GcInlM" });

/**
 * Fetches the current open file's code as context.
 * @returns The full text of the open document.
 */
export function getCodeContext(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return "";
    }
    return editor.document.getText();
}

/**
 * Calls the Gemini AI API for intelligent autocompletion based on comments.
 */
export async function fetchAutocompletions(personalizationData: any): Promise<string> {
    const codeContext = getCodeContext();
    if (!codeContext) {
        return "";
    }

    const prompt = `
You are an AI-based code assistant. The user has written some comments indicating code that needs to be completed.
Your task is to intelligently generate the missing code while keeping the overall coding style and context.

### User's Code:
\`\`\`
${codeContext}
\`\`\`

### Response Format:
Return a **valid JSON object** with the key "updated_code".

Additional Information :-
- Tech Stack: ${personalizationData.techStack}
- Project Name: ${personalizationData.projectName}

- System Username: ${personalizationData.systemUser}
`;

    try {
        vscode.window.showInformationMessage(`Fetching AI code completion...`);

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const rawResponse = response.text?.trim();
        if (!rawResponse) {
            vscode.window.showInformationMessage("No code updates suggested.");
            return "";
        }

        // Extract JSON safely using regex
        const jsonMatch = rawResponse.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            vscode.window.showErrorMessage("Error: AI response is not valid JSON.");
            return "";
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        if (!parsedData.updated_code) {
            vscode.window.showInformationMessage("No code updates needed.");
            return "";
        }

        const updatedCode = parsedData.updated_code;
        

        openAndCompareFile(codeContext, updatedCode, "Code Comparison");

        return updatedCode;
    } catch (error) {
        vscode.window.showErrorMessage("Error fetching code updates: " + (error instanceof Error ? error.message : "Unknown error"));
        return "";
    }
}

/**
 * Replaces the current document's code with the updated code.
 * @param updatedCode The new code snippet to be applied.
 */
function applyCodeUpdate(updatedCode: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
    }

    const document = editor.document;
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
    );

    editor.edit(editBuilder => {
        editBuilder.replace(fullRange, updatedCode);
    });

    vscode.window.showInformationMessage("Code updated successfully.");
}

/**
 * Adds documentation for the currently open function.
 */
export function addDocumentation() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found!");
        return;
    }

    const position = editor.selection.start;

    const docTemplate = `/**
 * @function functionName
 * @description Description of the function
 * @param {type} param - Description
 * @returns {type} Description
 */\n`;

    editor.edit(editBuilder => {
        editBuilder.insert(position, docTemplate);
    });

    vscode.window.showInformationMessage("Documentation added.");
}