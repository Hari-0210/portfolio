import React, { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaPlay, FaCopy, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import Editor from "@monaco-editor/react";
import { problemsData } from "../utils/problemsData";

function DailyProblem() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [isEditingTestCase, setIsEditingTestCase] = useState(false);
  const [editedTestCase, setEditedTestCase] = useState("");
  const [consoleOutput, setConsoleOutput] = useState([]);

  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const problem = problemsData[formattedDate] || {
    title: "No problem for this date",
    code: "",
    language: "javascript",
  };

  const handlePrevious = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNext = () => {
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    if (currentDate < tomorrow) {
      setCurrentDate((prev) => new Date(prev.setDate(prev.getDate() + 1)));
    }
  };

  const executeCode = () => {
    try {
      const problem = problemsData[formattedDate];
      const codeToExecute = isEditing ? editedCode : problem.code;

      // Reset outputs
      setOutput("");
      setConsoleOutput([]);

      // Create a proxy for console.log
      const logs = [];
      const proxiedConsole = {
        log: (...args) => {
          logs.push(
            args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : arg
              )
              .join(" ")
          );
        },
        error: (...args) => {
          logs.push(
            `Error: ${args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : arg
              )
              .join(" ")}`
          );
        },
        warn: (...args) => {
          logs.push(
            `Warning: ${args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : arg
              )
              .join(" ")}`
          );
        },
      };

      // Create a safe evaluation environment with proxied console
      const safeEval = new Function(
        "console",
        `${codeToExecute}\nreturn ${problem.testCase}`
      );

      const result = safeEval(proxiedConsole);
      setOutput(JSON.stringify(result));
      setConsoleOutput(logs);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(problem.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedCode(problem.code);
  };

  const handleSave = () => {
    if (!editedCode.trim()) {
      setOutput("Error: Code cannot be empty");
      return;
    }

    try {
      // First test if the code executes without errors
      const safeEval = new Function(
        `${editedCode}\nreturn ${problemsData[formattedDate].testCase}`
      );
      safeEval();

      // If execution successful, update the problem data
      problemsData[formattedDate] = {
        ...problemsData[formattedDate],
        code: editedCode,
      };

      // Update state
      setIsEditing(false);
      setOutput("Code saved successfully!");

      // Show success message
      const successToast = document.createElement("div");
      successToast.className =
        "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg";
      successToast.textContent = "Changes saved successfully!";
      document.body.appendChild(successToast);
      setTimeout(() => {
        document.body.removeChild(successToast);
      }, 2000);
    } catch (error) {
      setOutput(`Error saving code: ${error.message}`);
    }
  };

  // Add a keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (isEditing) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, editedCode]);

  // Add this function to handle canceling edits
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCode(problemsData[formattedDate].code);
    setOutput("");
  };

  const handleEditorChange = (value) => {
    setEditedCode(value);
  };

  // Add editor options
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    tabSize: 2,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on",
  };

  const beforeMount = (monaco) => {
    // Configure JavaScript settings
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      typeRoots: ["node_modules/@types"],
    });
  };

  const onMount = (editor, monaco) => {
    // Add custom suggestions
    monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: "cl",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "console.log(${1})",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "Log to console",
          },
          // Add more custom snippets here
        ];
        return { suggestions };
      },
    });
  };

  // Add this function to handle test case editing
  const handleEditTestCase = () => {
    setIsEditingTestCase(true);
    setEditedTestCase(problem.testCase);
  };

  // Add this function to save test case
  const handleSaveTestCase = () => {
    try {
      // Validate the test case by trying to execute it
      const safeEval = new Function(
        `${problem.code}\nreturn ${editedTestCase}`
      );
      safeEval();

      // If execution successful, update the problem data
      problemsData[formattedDate] = {
        ...problemsData[formattedDate],
        testCase: editedTestCase,
      };

      setIsEditingTestCase(false);
      setOutput("Test case updated successfully!");
    } catch (error) {
      setOutput(`Error in test case: ${error.message}`);
    }
  };

  // Add this function to cancel test case editing
  const handleCancelTestCase = () => {
    setIsEditingTestCase(false);
    setEditedTestCase(problem.testCase);
  };

  return (
    <div className="container mt-12 px-4 py-8 ">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Daily Coding Problem
      </h1>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Previous Day
        </button>
        <h2 className="text-2xl font-semibold bg-gray-100 px-6 py-2 rounded-lg">
          {formattedDate}
        </h2>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          disabled={currentDate >= new Date()}
        >
          Next Day
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="text-2xl font-bold text-gray-800">{problem.title}</h3>
        </div>

        <div className="relative">
          <div className="absolute right-4 top-4 flex gap-2 z-50">
            <button
              onClick={handleCopy}
              className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              title="Copy code"
            >
              <FaCopy />
            </button>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                  title="Save code (Ctrl/Cmd + S)"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                  title="Cancel editing"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
                title="Edit code"
              >
                <FaEdit />
              </button>
            )}
            <button
              onClick={executeCode}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
              title="Run code"
            >
              <FaPlay />
            </button>
          </div>

          {isEditing ? (
            <div className="h-[400px] w-full pt-13">
              <Editor
                height="100%"
                defaultLanguage={problem.language}
                value={editedCode}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  ...editorOptions,
                  padding: { top: 20 },
                }}
                className="rounded-lg overflow-hidden"
                beforeMount={beforeMount}
                onMount={onMount}
              />
            </div>
          ) : (
            <SyntaxHighlighter
              language={problem.language}
              style={vscDarkPlus}
              className="rounded-none !m-0"
              customStyle={{ padding: "2rem" }}
            >
              {problem.code}
            </SyntaxHighlighter>
          )}
        </div>

        {problem.testCase && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Test Case:</h4>
              <div className="flex gap-2">
                {isEditingTestCase ? (
                  <>
                    <button
                      onClick={handleSaveTestCase}
                      className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm"
                      title="Save test case"
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={handleCancelTestCase}
                      className="p-1.5 bg-red-600 text-white rounded hover:bg-red-500 transition-colors text-sm"
                      title="Cancel editing"
                    >
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditTestCase}
                    className="p-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors text-sm"
                    title="Edit test case"
                  >
                    <FaEdit />
                  </button>
                )}
              </div>
            </div>
            {isEditingTestCase ? (
              <div className="relative">
                <Editor
                  height="100px"
                  defaultLanguage={problem.language}
                  value={editedTestCase}
                  onChange={(value) => setEditedTestCase(value)}
                  theme="vs-dark"
                  options={{
                    ...editorOptions,
                    minimap: { enabled: false },
                    lineNumbers: "off",
                    folding: false,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                  }}
                  className="rounded-lg overflow-hidden"
                />
              </div>
            ) : (
              <code className="bg-gray-100 px-2 py-1 rounded">
                {problem.testCase}
              </code>
            )}
          </div>
        )}

        {consoleOutput.length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-semibold mb-2">Console Output:</h4>
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono">
              {consoleOutput.map((log, index) => (
                <div
                  key={index}
                  className="border-b border-gray-700 last:border-0 py-1"
                >
                  <span className="text-gray-500 mr-2">{">"}</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {output && (
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-semibold mb-2">Return Value:</h4>
            <div className="bg-gray-100 p-3 rounded">
              <code>{output}</code>
            </div>
          </div>
        )}

        {copied && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
            Code copied!
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyProblem;
