import React, { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FaPlay,
  FaCopy,
  FaEdit,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
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
  const [testResults, setTestResults] = useState({
    status: null, // 'success' | 'error' | null
    expected: null,
    actual: null,
    passed: false,
  });

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
      setTestResults({
        status: null,
        expected: null,
        actual: null,
        passed: false,
      });

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

      const safeEval = new Function(
        "console",
        `${codeToExecute}\nreturn ${problem.testCase}`
      );

      const result = safeEval(proxiedConsole);

      // Standardize the output format
      const actualOutput = JSON.stringify(result);
      const expectedOutput = problem.expectedOutput;

      // Try parsing both outputs to compare their values rather than their string representations
      let parsedActual, parsedExpected;
      try {
        parsedActual = JSON.parse(actualOutput);
        parsedExpected = JSON.parse(expectedOutput);
      } catch (e) {
        // If parsing fails, fall back to string comparison
        parsedActual = actualOutput;
        parsedExpected = expectedOutput;
      }

      // Deep equality comparison
      const isEqual =
        JSON.stringify(parsedActual) === JSON.stringify(parsedExpected);

      setConsoleOutput(logs);
      setOutput(actualOutput);

      // Compare results
      setTestResults({
        status: isEqual ? "success" : "error",
        expected: expectedOutput,
        actual: actualOutput,
        passed: isEqual,
      });
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setTestResults({
        status: "error",
        expected: problem.expectedOutput,
        actual: "Runtime Error",
        passed: false,
      });
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

  const generateHints = (expected, actual) => {
    const hints = [];

    try {
      const parsedExpected = JSON.parse(expected);
      const parsedActual = JSON.parse(actual);

      // Type mismatch check
      if (typeof parsedExpected !== typeof parsedActual) {
        hints.push(
          `Type mismatch: Expected ${typeof parsedExpected} but got ${typeof parsedActual}`
        );
      }

      // Array specific checks
      if (Array.isArray(parsedExpected) && Array.isArray(parsedActual)) {
        if (parsedExpected.length !== parsedActual.length) {
          hints.push(
            `Array length mismatch: Expected length ${parsedExpected.length} but got ${parsedActual.length}`
          );
        }

        // Check for order differences
        const hasOrderDiff = parsedExpected.some(
          (val, idx) => val !== parsedActual[idx]
        );
        if (hasOrderDiff && parsedExpected.length === parsedActual.length) {
          hints.push("Array elements are in different order");
        }

        // Check for missing/extra elements
        const missingElements = parsedExpected.filter(
          (x) => !parsedActual.includes(x)
        );
        const extraElements = parsedActual.filter(
          (x) => !parsedExpected.includes(x)
        );
        if (missingElements.length > 0) {
          hints.push(`Missing elements: ${missingElements.join(", ")}`);
        }
        if (extraElements.length > 0) {
          hints.push(`Extra elements: ${extraElements.join(", ")}`);
        }
      }

      // Object specific checks
      if (
        typeof parsedExpected === "object" &&
        !Array.isArray(parsedExpected)
      ) {
        const expectedKeys = Object.keys(parsedExpected);
        const actualKeys = Object.keys(parsedActual);

        const missingKeys = expectedKeys.filter(
          (key) => !actualKeys.includes(key)
        );
        const extraKeys = actualKeys.filter(
          (key) => !expectedKeys.includes(key)
        );

        if (missingKeys.length > 0) {
          hints.push(`Missing properties: ${missingKeys.join(", ")}`);
        }
        if (extraKeys.length > 0) {
          hints.push(`Extra properties: ${extraKeys.join(", ")}`);
        }
      }

      // Number specific checks
      if (
        typeof parsedExpected === "number" &&
        typeof parsedActual === "number"
      ) {
        if (Math.abs(parsedExpected - parsedActual) < 0.0001) {
          hints.push(
            "Numbers are very close - might be a floating-point precision issue"
          );
        }
      }
    } catch (error) {
      // Handle string comparison if JSON parsing fails
      if (expected.length !== actual.length) {
        hints.push(
          `Length mismatch: Expected length ${expected.length} but got ${actual.length}`
        );
      }

      // Check for whitespace issues
      if (expected.trim() === actual.trim()) {
        hints.push("Check for extra whitespace");
      }

      // Check for case sensitivity
      if (expected.toLowerCase() === actual.toLowerCase()) {
        hints.push("Check letter casing");
      }
    }

    // If no specific hints were generated, add general hints
    if (hints.length === 0) {
      hints.push("Check data types and values carefully");
      hints.push("Ensure your logic handles all test cases");
    }

    return hints;
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

        {testResults.status && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="mb-4">
              <div
                className={`flex items-center gap-2 text-lg font-semibold mb-2 
                ${testResults.passed ? "text-green-600" : "text-red-600"}`}
              >
                {testResults.passed ? (
                  <>
                    <FaCheck className="text-green-600" />
                    Test Case Passed
                  </>
                ) : (
                  <>
                    <FaTimes className="text-red-600" />
                    Test Case Failed
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <span>Expected Output:</span>
                  </div>
                  <div className="font-mono text-green-400 break-all">
                    {testResults.expected}
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <span>Your Output:</span>
                  </div>
                  <div
                    className={`font-mono break-all ${
                      testResults.passed ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {testResults.actual}
                  </div>
                </div>
              </div>
            </div>

            {!testResults.passed && testResults.actual !== "Runtime Error" && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-yellow-400" />
                  <div className="text-yellow-700">
                    <p className="font-semibold">Debugging Hints:</p>
                    <ul className="list-disc ml-8 mt-2">
                      {generateHints(
                        testResults.expected,
                        testResults.actual
                      ).map((hint, index) => (
                        <li key={index}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
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
