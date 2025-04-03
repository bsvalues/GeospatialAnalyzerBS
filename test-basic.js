// Very basic test without Jest
console.log("Running basic test...");

// Test simple assertions
const testTrue = true === true;
const testAdd = 1 + 1 === 2;
const testString = 'hello' + ' world' === 'hello world';

// Report results
console.log("Test results:");
console.log("- true === true:", testTrue ? "PASS" : "FAIL");
console.log("- 1 + 1 === 2:", testAdd ? "PASS" : "FAIL");
console.log("- 'hello' + ' world' === 'hello world':", testString ? "PASS" : "FAIL");

// Overall result
if (testTrue && testAdd && testString) {
  console.log("All tests passed!");
  process.exit(0);
} else {
  console.log("Some tests failed!");
  process.exit(1);
}