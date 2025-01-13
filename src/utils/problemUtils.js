import { format } from "date-fns";

// Use require.context to get all code files
const codeFiles = require.context("!!raw-loader!../code", false, /\.js$/);
console.log("Available files:", codeFiles.keys());

export const extractProblemFromCode = (code) => {
  const lines = code.split("\n");
  let testCase = "";
  let expectedOutput = "";

  // Extract test case and expected output from comments
  lines.forEach((line) => {
    if (line.includes("// testCase:")) {
      testCase = line.split("// testCase:")[1].trim().replace(/['"]/g, "");
    }
    if (line.includes("// expectedOutput:")) {
      expectedOutput = line
        .split("// expectedOutput:")[1]
        .trim()
        .replace(/['"]/g, "");
    }
  });

  return {
    code: code,
    testCase,
    expectedOutput,
    language: "javascript", // You can make this dynamic if needed
  };
};

export const getProblemForDate = async (date) => {
  console.log("Attempting to load problem for date:", date);

  try {
    const fileName = `./${date}.js`;
    console.log("Looking for file:", fileName);

    const availableFiles = codeFiles.keys();
    console.log("Available files:", availableFiles);

    if (!availableFiles.includes(fileName)) {
      console.log("File not found in available files");
      return {
        title: "No problem available for this date",
        code: "// No problem has been added for this date yet.",
        testCase: "",
        expectedOutput: "",
        language: "javascript",
      };
    }

    // Get the raw content and ensure it's a string
    const rawCode = codeFiles(fileName);
    const code =
      typeof rawCode === "string"
        ? rawCode
        : rawCode.default
        ? rawCode.default
        : JSON.stringify(rawCode);

    console.log("Raw code loaded:", code);

    // Extract test case and expected output from comments
    const lines = (typeof code === "string" ? code : "").split("\n");
    let testCase = "";
    let expectedOutput = "";

    lines.forEach((line) => {
      if (line.includes("// testCase:")) {
        testCase = line.split("// testCase:")[1].trim().replace(/['"]/g, "");
      }
      if (line.includes("// expectedOutput:")) {
        expectedOutput = line
          .split("// expectedOutput:")[1]
          .trim()
          .replace(/['"]/g, "");
      }
    });

    return {
      title: `Problem for ${date}`,
      code: code.toString(), // Ensure code is a string
      testCase,
      expectedOutput,
      language: "javascript",
    };
  } catch (error) {
    console.error("Error loading problem:", error);
    return {
      title: "Error Loading Problem",
      code: "// There was an error loading this problem.",
      testCase: "",
      expectedOutput: "",
      language: "javascript",
    };
  }
};
