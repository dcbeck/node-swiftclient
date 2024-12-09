const rimraf = require('rimraf');
const fs = require('fs');

function replaceTextInFile(filePath, searchValue, replaceValue) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const updatedContent = data.replace(
      new RegExp(searchValue, 'g'),
      replaceValue
    ).replace(/^\s+|\s+$/g, '').trim();
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
