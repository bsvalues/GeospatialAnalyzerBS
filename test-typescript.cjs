// Basic TypeScript test executor

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary TypeScript file
const tempTsFile = path.join(__dirname, 'temp-test.ts');
const tsContent = `
// Simple TypeScript tests
interface TestObject {
  name: string;
  value: number;
}

// Test 1: Object with types
const obj: TestObject = { name: 'test', value: 42 };
console.log('Test 1:', obj.name === 'test' && obj.value === 42 ? 'PASS' : 'FAIL');

// Test 2: Typed array
const arr: number[] = [1, 2, 3];
console.log('Test 2:', arr.length === 3 && arr[0] === 1 ? 'PASS' : 'FAIL');

// Test 3: String template literals
const greeting: string = 'Hello';
const subject: string = 'World';
const message: string = \`\${greeting}, \${subject}!\`;
console.log('Test 3:', message === 'Hello, World!' ? 'PASS' : 'FAIL');
`;

// Write the test file
fs.writeFileSync(tempTsFile, tsContent);

console.log('Running TypeScript compilation test...');

// Execute the TypeScript compiler
exec('npx tsc temp-test.ts --outDir .', (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript compilation failed:', error);
    console.error(stderr);
    cleanUp();
    process.exit(1);
  }

  console.log('TypeScript compilation successful!');
  console.log('Running compiled JavaScript...');
  
  // Execute the compiled JavaScript
  exec('node temp-test.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Execution failed:', error);
      console.error(stderr);
      cleanUp();
      process.exit(1);
    }

    console.log('Test execution successful!');
    console.log(stdout);
    cleanUp();
    process.exit(0);
  });
});

function cleanUp() {
  try {
    // Clean up temporary files
    if (fs.existsSync(tempTsFile)) fs.unlinkSync(tempTsFile);
    if (fs.existsSync('temp-test.js')) fs.unlinkSync('temp-test.js');
    console.log('Temporary test files cleaned up.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}