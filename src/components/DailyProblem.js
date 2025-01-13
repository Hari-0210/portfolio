import React, { useState } from "react";
import { format, subDays } from "date-fns";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaPlay, FaCopy, FaEdit, FaCheck } from "react-icons/fa";

// This would come from your database/API
const problemsData = {
  "2025-01-13": {
    title: "Two Sum",
    code: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    language: "javascript",
    testCase: "twoSum([2, 7, 11, 15], 9)",
    expectedOutput: "[0, 1]",
  },
  // Add more daily problems here
};

function DailyProblem() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState("");

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
      // Use the edited code if in edit mode
      const codeToExecute = isEditing ? editedCode : problem.code;
      // Create a safe evaluation environment
      const safeEval = new Function(
        `${codeToExecute}\nreturn ${problem.testCase}`
      );
      const result = safeEval();
      setOutput(JSON.stringify(result));
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
    setIsEditing(false);
    // In a real app, you'd save this to your backend
    problemsData[formattedDate] = {
      ...problem,
      code: editedCode,
    };
  };

  return (
    <div className="container mt-12 px-4 py-8 max-w-4xl">
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
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              title="Copy code"
            >
              <FaCopy />
            </button>
            {isEditing ? (
              <button
                onClick={handleSave}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                title="Save code"
              >
                <FaCheck />
              </button>
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
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="w-full h-[400px] font-mono p-8 bg-gray-900 text-gray-100 focus:outline-none"
              spellCheck="false"
            />
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
            <h4 className="font-semibold mb-2">Test Case:</h4>
            <code className="bg-gray-100 px-2 py-1 rounded">
              {problem.testCase}
            </code>
          </div>
        )}

        {output && (
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-semibold mb-2">Output:</h4>
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
