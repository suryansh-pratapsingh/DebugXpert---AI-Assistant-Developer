import * as vscode from "vscode";
import { errorfix } from "./utils/Errorfix";
import { evaluateCode } from "./utils/evaluateCode";
import { checkVulnerability } from "./utils/Vulnerability";
import { addDocumentation } from "./utils/addDocumentation";
import { fetchAutocompletions } from "./utils/autocomplete";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "nexora" is now active!');

    // Prompt for user inputs
    vscode.window.showInformationMessage("Please provide project details for a personalized experience.");

    getUserInputs().then((personalizationData) => {
        // Register Sidebar View
        const treeDataProvider = new NexoraTreeDataProvider();
        vscode.window.createTreeView("nexoraView", { treeDataProvider });

        // Register Sidebar Commands
        context.subscriptions.push(
            vscode.commands.registerCommand("nexora.fixErrors", () => {
                errorfix(personalizationData);
                vscode.window.showInformationMessage("Fixing Errors...");
            }),
            vscode.commands.registerCommand("nexora.evaluateCode", () => {
                evaluateCode(personalizationData);
                vscode.window.showInformationMessage("Evaluating Code...");
            }),
            vscode.commands.registerCommand("nexora.checkVulnerability", () => {
                checkVulnerability(personalizationData);
                vscode.window.showInformationMessage("Checking Vulnerability...");
            }),
            vscode.commands.registerCommand("nexora.addDocumentation", () => {
                addDocumentation(personalizationData);
                vscode.window.showInformationMessage("Adding Documentation...");
            }),
            vscode.commands.registerCommand("nexora.autoComplete", () => {
                fetchAutocompletions(personalizationData);
                vscode.window.showInformationMessage("Fetching Auto-Completion...");
            })
        );
    });
}

export function deactivate() {
    console.log("VS Code Extension Deactivated");
}

// Function to get user inputs for personalization
async function getUserInputs() {
    const techStack = await vscode.window.showInputBox({ prompt: "Enter the Tech Stack (e.g., MERN, Django, Flask)" });
    const projectName = await vscode.window.showInputBox({ prompt: "Enter the Project Name" });
    const systemUser = await vscode.window.showInputBox({ prompt: "Enter your System (Windows,Linux,Mac)" });

    return {
        techStack: techStack || "Unknown",
        projectName: projectName || "Unknown",
        systemUser: systemUser || "Unknown"
    };
}

// Sidebar TreeDataProvider
class NexoraTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): vscode.TreeItem[] {
        return [
            this.createCommandItem("Fix Errors", "nexora.fixErrors"),
            this.createCommandItem("Evaluate Code", "nexora.evaluateCode"),
            this.createCommandItem("Check Vulnerability", "nexora.checkVulnerability"),
            this.createCommandItem("Add Documentation", "nexora.addDocumentation"),
            this.createCommandItem("Auto Complete", "nexora.autoComplete"),
        ];
    }

    private createCommandItem(label: string, command: string): vscode.TreeItem {
        const item = new vscode.TreeItem(label);
        item.command = { command, title: label };
        return item;
    }
}
