// Linear Search
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

// testCase: linearSearch([1, 3, 5, 7, 9], 5)
// expectedOutput: 2
