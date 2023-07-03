const PathResolver = require("../path-utils/pathResolver.js").default;
const path = require('path');
const fs = require('fs');
const getExportsAndImports = require("./getExportsAndImports").default;
const {isUnderAnyMustHaveDirectory} = require("../path-utils/checkDirectory.js");

function traverseDir(dir, pr, allExports,importVariable) {
  fs.readdirSync(dir).forEach((file) => {
    let fullPath = path.join(dir, file);
    if(!isUnderAnyMustHaveDirectory(fullPath)){
      return;
    }
    if (fs.lstatSync(fullPath).isDirectory()) {
      const directories = fs.readdirSync(fullPath);
      const index = directories.findIndex(file => file === "tsconfig.json");
      if(index!=-1){
        const pathToTsConfig = path.join(fullPath,directories[index]);
        //console.log("tsconfig inside :",pathToTsConfig);
        const newpr = new PathResolver(pathToTsConfig);
        traverseDir(fullPath, newpr, allExports, importVariable);
      }
      else {
        traverseDir(fullPath, pr, allExports, importVariable);
      }
    }else {
      function getExtension(filename) {
        return filename.split(".").pop();
      }
      
      function isJSFile(filename) {
        const ext = getExtension(filename);
        return ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx";
      }

      if(!isJSFile(fullPath))return;
      console.log("\nGetting imports and exports from file: ",fullPath,"\n");
      if(pr===undefined){
        console.log("how is it undefined?", fullPath);
        return;
      }
      try {
        const { exportedVariables, importedVariables } = getExportsAndImports(fs.readFileSync(fullPath).toString(),fullPath,pr);
        for (const exportedVariable of exportedVariables){
          allExports.push(exportedVariable);
        }
        for (const importedVariable of importedVariables){
          importVariable.add(
            combine(importedVariable.from, importedVariable.importedName)
          );
        }
      }catch(e){
        console.log("error on file: ",fullPath);
        console.log("error: ",e);
      }
    }
});
}

function combine(a, b) {
  return a + "+" + b;
}

exports.default = function getUnusedExports(inputFolderLocation){
  let allExports = [];
  let importVariable = new Set();
  
  const pr = new PathResolver(path.join(inputFolderLocation,"tsconfig.json"));
  traverseDir(inputFolderLocation,pr,allExports,importVariable);


  /*
    inputFileLocations.forEach((file) => {
      const input = fs.readFileSync(file).toString();
      const output = getOptimizedCode(input);
      fs.writeFileSync(file, output.code, "utf8");
  
      const { exportedVariables, importedVariables } = getExportsAndImports(
        output.code,
        file
      );
  
      for (const exportedVariable of exportedVariables)
        allExports.push(exportedVariable);
      for (const importedVariable of importedVariables)
        importVariable.add(
          combine(importedVariable.from, importedVariable.importedName)
        );
    });
  */
  console.log("allExports: ",allExports);
  console.log("importVariable",importVariable);
  const unusedExports = allExports.filter(
    (value) => !importVariable.has(combine(value.from, value.exportedName))
  );

  //console.log(unusedExports);

  // if (unusedExports.length === 0) break;

  let unusedExportsByFile = {};

  for (let unusedExport of unusedExports) {
    if (unusedExportsByFile[unusedExport.from] === undefined) {
      unusedExportsByFile[unusedExport.from] = [{exportName: unusedExport.exportedName}];
    } else {
      unusedExportsByFile[unusedExport.from].push({exportName: unusedExport.exportedName});
    }
  }

  //console.log(unusedExportsByFile);
  return unusedExportsByFile;

  // for (let fileLocation of Object.keys(unusedExportsByFile)) {
  //   const input = fs.readFileSync(fileLocation).toString();
  //   const output = removeExportsFromFile(
  //     input,
  //     unusedExportsByFile[fileLocation]
  //   );
  //   fs.writeFileSync(fileLocation, output.code, "utf8");
  // }
}