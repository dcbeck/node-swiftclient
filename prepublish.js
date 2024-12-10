const rimraf = require('rimraf');
const fs = require('fs');
const UglifyJS = require('uglify-js');

function minifyFile(inputPath, outputPath) {
  // Read the input file
  const code = fs.readFileSync(inputPath, 'utf8');

  // Minification options to preserve names
  const options = {
    // Keep function names
    keep_fnames: true,
    keep_fargs: true,
    // Mangle options to preserve class and function names
    mangle: {
      // Preserve function names
      keep_fnames: true,
      // Avoid renaming top-level names
      toplevel: false,
      // Preserve specific names if needed
      reserved: [],
    },

    // Output formatting options
    output: {
      // Preserve comments
      comments: "all",
      // Keep line breaks
      beautify: false,
    },
  };

  // Perform minification
  const result = UglifyJS.minify(code, options);

  // Check for errors
  if (result.error) {
    console.error('Error during minification:', result.error);
    return false;
  }

  // Write minified code to output file
  fs.writeFileSync(outputPath, result.code);

  console.log(`Successfully minified ${inputPath} to ${outputPath}`);
  return true;
}

function replaceTextInFile(filePath, searchValue, replaceValue) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const updatedContent = data
      .replace(new RegExp(searchValue, 'g'), replaceValue)
      .replace(/^\s+|\s+$/g, '')
      .trim();
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`File updated successfully.`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

function run() {
  rimraf.sync('dist/node-swiftclient/src');
  rimraf.sync('dist/node-swiftclient/index.cjs.d.ts');
  rimraf.sync('dist/node-swiftclient/index.esm.d.ts');
  console.log('Removed unpacked type definitions');

  
  minifyFile(
    'dist/node-swiftclient/index.cjs.js',
    'dist/node-swiftclient/index.cjs.js'
  );

  minifyFile(
    'dist/node-swiftclient/index.esm.js',
    'dist/node-swiftclient/index.esm.js'
  );


  replaceTextInFile('dist/node-swiftclient/index.d.ts', 'export { }', '');

  replaceTextInFile(
    'dist/node-swiftclient/package.json',
    'index.cjs.d.ts',
    'index.d.ts'
  );
  replaceTextInFile(
    'dist/node-swiftclient/package.json',
    'index.esm.d.ts',
    'index.d.ts'
  );

  console.log('updated type defs in package.json');
}

run();
