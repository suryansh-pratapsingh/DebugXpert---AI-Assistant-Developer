import * as vscode from 'vscode';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: "AIzaSyBNP8L1vFKs_zrWQLRL32aoM9TO7GcInlM"});

export async function evaluateCode(personalizationData: any) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage("❌ No active file open. Please open a file to evaluate.");
        return;
    }

    const code = editor.document.getText().trim();

    if (!code) {
        vscode.window.showErrorMessage("⚠️ The file is empty. Please provide code to evaluate.");
        return;
    }

    const prompt = `
You are an expert in software engineering and code quality analysis. Evaluate the following code and generate a structured Markdown report.

### **📌 Evaluation Criteria:**
🔹 **Cyclomatic Complexity**  
🔹 **Maintainability Index**  
🔹 **Lines of Code (LOC)**  
🔹 **Halstead Complexity Measures**  
🔹 **Code Duplication**  
🔹 **Code Coverage**  
🔹 **Error Density**  
🔹 **Documentation & Comments Ratio**  
🔹 **Coupling & Cohesion**  
🔹 **Performance Metrics**  

---

### **📜 Code to Evaluate:**
\`\`\`python
${code}
\`\`\`

---

### **📝 Additional Information:**
- **Tech Stack:** ${personalizationData.techStack}  
- **Project Name:** ${personalizationData.projectName}  
- **System User:** ${personalizationData.systemUser}  

Generate a well-structured Markdown report with clear sections, bold headings, and actionable recommendations.

### **📖 References & Learning Resources**
🔹 Provide **official documentation links** related to the used libraries, frameworks, and best coding practices.  
🔹 Fetch **relevant blogs/articles** explaining the code's key concepts.  
🔹 Find **YouTube video links** explaining similar code implementations or concepts.  

⚡ **Ensure that all references are from trusted sources like:**
- Official Docs (MDN, Python Docs, Java Docs, etc.)
- Stack Overflow
- Blogs from Google Developers, Microsoft, etc.
- YouTube (Only educational & technical videos)

🔹 **Format the response in structured Markdown with clickable links.**  

`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const evaluation = response.text?.trim() || "⚠️ Failed to generate evaluation.";

        // Show analysis result in a well-styled WebView
        const panel = vscode.window.createWebviewPanel(
            'EvaluateCode',
            'Code Evaluate Code',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getStyledHTML(evaluation);
        
        
    } catch (error) {
        vscode.window.showErrorMessage("❌ Error evaluating code: " + (error instanceof Error ? error.message : "Unknown error"));
    }
}


// Function to convert Markdown text to styled HTML for display
function getStyledHTML(markdownText: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Evaluation</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 20px;
                padding: 20px;
                background-color: #1e1e1e;
                color: #ffffff;
            }
            h2 {
                color: #ff9800;
            }
            pre {
                background-color: #2d2d2d;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
            code {
                font-family: "Courier New", monospace;
                color: #ffcc00;
            }
            .container {
                background: #252526;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
            }
            .collapsible {
                background-color: #333;
                color: white;
                cursor: pointer;
                padding: 10px;
                width: 100%;
                border: none;
                text-align: left;
                outline: none;
                font-size: 16px;
                margin-top: 10px;
                border-radius: 5px;
            }
            .active, .collapsible:hover {
                background-color: #444;
            }
            .content {
                padding: 10px;
                display: none;
                overflow: hidden;
                background-color: #252526;
                border-left: 2px solid #ff9800;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔍 Code Evaluation</h2>
            <div id="markdown-content"></div>
        </div>

        <script>
            document.getElementById("markdown-content").innerHTML = marked.parse(\`${markdownText.replace(/`/g, "\\`")}\`);
            
            // Apply PrismJS Syntax Highlighting
            document.querySelectorAll("pre code").forEach((block) => {
                Prism.highlightElement(block);
            });

            // Collapsible Section Script
            document.querySelectorAll(".collapsible").forEach(button => {
                button.addEventListener("click", function() {
                    this.classList.toggle("active");
                    let content = this.nextElementSibling;
                    if (content.style.display === "block") {
                        content.style.display = "none";
                    } else {
                        content.style.display = "block";
                    }
                });
            });
        </script>
    </body>
    </html>`;
}
