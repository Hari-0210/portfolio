// Array Reversal
function reverseArray(arr) {
  let start = 0;
  let end = arr.length - 1;

  while (start < end) {
    // Swap elements
    let temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;

    start++;
    end--;
  }
  return arr;
}

// testCase: reverseArray([1, 2, 3, 4, 5])
// expectedOutput: [5, 4, 3, 2, 1]
