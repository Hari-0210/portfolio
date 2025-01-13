export const problemsData = {
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
};
