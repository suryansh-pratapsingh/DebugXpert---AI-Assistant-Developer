import * as vscode from 'vscode';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { openAndCompareFile } from './compareFile';

dotenv.config();

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
    console.error("GOOGLE_GENAI_API_KEY is not set in the environment variables.");
    vscode.window.showErrorMessage("GOOGLE_GENAI_API_KEY is not set. Please configure your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export function getCodeContext(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return "";
    }
    return editor.document.getText();
}

export async function fetchAutocompletions(): Promise<string> {
    const codeContext = getCodeContext();
    if (!codeContext) {
        return "";
    }

    const prompt = `
You are an AI-based code assistant. The user has written some comments indicating code that needs to be completed.
Your task is to intelligently generate the missing code while keeping the overall coding style and context.

### User's Code:
${codeContext}

Instructions:
Do not add special characters
Do not change the coding style
Do not use markdown syntax like \`\`\`json, \`\`\`python, \`\`\`javascript, \`\`\` etc.
`;

    try {
        vscode.window.showInformationMessage(`Fetching AI code completion...`);
        const model = ai.model("gemini-2.0-flash");
        const result = await model.generateContent(prompt);

        let updatedCode = result.response.text()?.trim() || "";
        if (!updatedCode) {
            vscode.window.showInformationMessage("No code updates suggested.");
            return "";
        }

        updatedCode = updatedCode.replace(/\`\`\`(?:json|python|javascript)?\n?/g, '');

        // Open comparison view
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            openAndCompareFile(editor.document.getText(), updatedCode, "AI-Suggested Changes");
        }

        return updatedCode;
    } catch (error) {
        vscode.window.showErrorMessage("Error fetching code updates: " + (error instanceof Error ? error.message : "Unknown error"));
        return "";
    }
}

export async function addDocumentation(personalizationData: any) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found!");
        return;
    }

    const codeContext = getCodeContext();
    if (!codeContext) {
        return;
    }

    const prompt = `
You are an AI-based documentation assistant. The user has written some code but lacks proper documentation.
Your task is to generate JSDoc-style documentation for all functions in the given code.

### User's Code:
${codeContext}

### Instructions:
- Analyze the provided code and generate JSDoc-style documentation for all functions.
- Ensure the documentation includes function descriptions, parameter types, and return values.
- Maintain proper indentation and formatting.

Additional Information :-
- Tech Stack: ${personalizationData.techStack}
- Project Name: ${personalizationData.projectName}
- System Username: ${personalizationData.systemUser}
`;

    try {
        vscode.window.showInformationMessage(`Fetching AI-generated documentation...`);
        const model = ai.model("gemini-2.0-flash");
        const result = await model.generateContent(prompt);

        let documentedCode = result.response.text()?.trim() || "";

        if (!documentedCode) {
            vscode.window.showInformationMessage("No documentation generated.");
            return;
        }

        documentedCode = documentedCode.replace(/\`\`\`(?:json|python|javascript)?\n?/g, '');

        // Open comparison view
        if (editor) {
            openAndCompareFile(editor.document.getText(), documentedCode, "AI-Generated Documentation");
        }
    } catch (error) {
        vscode.window.showErrorMessage("Error generating documentation: " + (error instanceof Error ? error.message : "Unknown error"));
    }
}
