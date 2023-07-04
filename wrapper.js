const fs = require("fs");
const path = require("path");
// const analyzeTsConfig= require('ts-unused-exports').default;
const removeExportsFromFile = require("./helpers/removeExportsFromFile").default;
const fileFinder = require("./helpers/fileFinder").default;
const getOptimizedCode = require("./helpers/optimizer").default;
const getUnusedExports = require("./helpers/getUnusedExports").default;
const checkDirectory = require("./path-utils/checkDirectory").default;

//Path to src
//must have a tsconfig.json right under this folder
const relativePathOfFolder = "./src/sprinklr-app-client"; //TODO or directly put absolute path in inputFolderLocation
const relativePathOfTsConfigFile = relativePathOfFolder + "/tsconfig.json";
const showRunningFile = true;
const showSmallIterations = true;

if(fs.existsSync(path.resolve(relativePathOfTsConfigFile)) === false){
  throw "TSConfigNotFound";
}
if(fs.existsSync(path.resolve(relativePathOfFolder)) === false){
  throw "FolderNotFound";
}

const inputFolderLocation = path.resolve(relativePathOfFolder);
const inputFileLocations = fileFinder(inputFolderLocation);

let lastUnusedExportsStringified;

const maxBigIteration = 10, maxSmallIteration = 10;
let totalBigIteration = 0;
process.stdout._handle.setBlocking(true);
const shouldBeNodeModule = new Set(); 
while (totalBigIteration<=maxBigIteration) {
  totalBigIteration++;
  inputFileLocations.forEach((file) => {
    try {
      const input = fs.readFileSync(file).toString();
      if(showRunningFile)console.log(`Running on file ${file}`);
      const {output,totalSmallIterations} = getOptimizedCode(input,maxSmallIteration,file);
      if(showSmallIterations)console.log(`Iterations: ${totalSmallIterations}\n`);
      fs.writeFileSync(file, output.code, "utf8");
    }catch(e){
      console.log("wrapper.js",{error:e,file:file});
    }
  });
  console.log("\n\n_________________________________________________________________________________\n\n");
  // let unusedExportsByFile = analyzeTsConfig(relativePathOfTsConfigFile);
  //let unusedExportsByFile = analyzeTsConfig(relativePathOfTsConfigFile,["--ignoreLocallyUsed=true"]);//////

  let unusedExportsByFile = getUnusedExports(inputFolderLocation,shouldBeNodeModule);
  console.log("\n\nList of unusedExports: ",unusedExportsByFile,"\n");

  //Processing unusedExportsByFile (ignoring pages folder and if exportName is undefined or empty)
  for(let key of Object.keys(unusedExportsByFile)){
    if(!checkDirectory(key)){
      delete unusedExportsByFile[key];
      continue;
    }
    unusedExportsByFile[key] = unusedExportsByFile[key].filter(value => !(value.exportName == undefined || value.exportName.length === 0));
    if(unusedExportsByFile[key].length === 0)delete unusedExportsByFile[key];
  }

  for(let [fileLocation, unusedExports] of Object.entries(unusedExportsByFile)){
    const input = fs.readFileSync(fileLocation).toString();
    let output;
    try{
      if(showRunningFile)console.log(`\nRemoving Exports from file ${fileLocation}\n`);
      output = removeExportsFromFile(input,unusedExports);
    }catch(e){
      console.log("error while removing exports",{error:e,failSafe: "returned original input instead",file:file});
      output = {code: input};
    }
    fs.writeFileSync(fileLocation, output.code, "utf8");
  }
  console.log(`\n\n########################################################################################\nEnd of Big Iteration ${totalBigIteration}\n`);
  
  if(Object.keys(unusedExportsByFile).length==0)break;

  const unusedExportsStringified = JSON.stringify(unusedExportsByFile);
  if(lastUnusedExportsStringified!== undefined && unusedExportsStringified === lastUnusedExportsStringified){
    console.log("ENDING BIG ITERATION BECAUSE UNABLE TO REMOVE THESE EXPORTS: ", unusedExportsByFile);
    break;
  }
  else {
    lastUnusedExportsStringified = unusedExportsStringified;
  }
}
console.log("totalBigIteration: ",totalBigIteration);
inputFileLocations.forEach((file) => {
  const input = fs.readFileSync(file).toString();
  if (!input.replace(/\s/g, '').length) {
    console.log(`Removing empty file: ${file}`);
    try {
      fs.unlinkSync(file);
      console.log("Removed!");
    }catch(e){
      console.log(e);
    }
  }
});

console.log("Should be node module: ",shouldBeNodeModule);









/////////////////////////////
/*
function BigIterate(){
  totalBigIteration++;
  if(totalBigIteration>maxBigIteration)return;


  let indexOfFile = 0;
  console.log(inputFileLocations.length);

  function optimizeEachFile(){
    do{
      const file = inputFileLocations[indexOfFile];
      indexOfFile++;
      try {
        const input = fs.readFileSync(file).toString();
        if(showRunningFile)console.log(`Running on file ${file} ::: ${indexOfFile}`);
        const {output,totalSmallIterations} = getOptimizedCode(input,maxSmallIteration,file);
        if(showSmallIterations)console.log(`Iterations: ${totalSmallIterations}\n`);
        fs.writeFileSync(file, output.code, "utf8");
      }catch(e){
        console.log("wrapper.js",{error:e,file:file});
      }
    }while(indexOfFile!==inputFileLocations.length && indexOfFile%10!=0);

    if(indexOfFile === inputFileLocations.length){
      setTimeout(removeUnusedExports);
      return;
    }
    else {
      console.log('\n\n - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \n\n')
      setTimeout(optimizeEachFile);
    }
  }

  optimizeEachFile();

  // inputFileLocations.forEach((file) => {
  //   try {
  //     const input = fs.readFileSync(file).toString();
  //     if(showRunningFile)console.log(`Running on file ${file}`);
  //     const {output,totalSmallIterations} = getOptimizedCode(input,maxSmallIteration,file);
  //     if(showSmallIterations)console.log(`Iterations: ${totalSmallIterations}\n`);
  //     fs.writeFileSync(file, output.code, "utf8");
  //   }catch(e){
  //     console.log("wrapper.js",{error:e,file:file});
  //   }
  // });

  let doNotIterate = false;

  function removeUnusedExports(){
    console.log("\n\n_________________________________________________________________________________\n\n");
    //let unusedExportsByFile = analyzeTsConfig(relativePathOfTsConfigFile);
    let unusedExportsByFile = analyzeTsConfig(relativePathOfTsConfigFile,["--ignoreLocallyUsed=true"]);
    //Processing unusedExportsByFile (ignoring pages folder and if exportName is undefined or empty)
    for(let key of Object.keys(unusedExportsByFile)){
      if(isUnderAnExcludedDirectory(key)){
        delete unusedExportsByFile[key];
        continue;
      }
      unusedExportsByFile[key] = unusedExportsByFile[key].filter(value => !(value.exportName == undefined || value.exportName.length === 0));
      if(unusedExportsByFile[key].length === 0)delete unusedExportsByFile[key];
    }

    for(let [fileLocation, unusedExports] of Object.entries(unusedExportsByFile)){
      const input = fs.readFileSync(fileLocation).toString();
      let output;
      try{
        if(showRunningFile)console.log(`Removing Exports from file ${fileLocation}`);
        output = removeExportsFromFile(input,unusedExports);
      }catch(e){
        console.log("error while removing exports",{error:e,failSafe: "returned original input instead",file:file});
        output = {code: input};
      }
      fs.writeFileSync(fileLocation, output.code, "utf8");
    }
    console.log(`\n\n########################################################################################\nEnd of Big Iteration ${totalBigIteration}\n`);
    //console.log(unusedExportsByFile);
    if(Object.keys(unusedExportsByFile).length==0){
      doNotIterate =  true;
      return;
    }

    const unusedExportsStringified = JSON.stringify(unusedExportsByFile);
    if(lastUnusedExportsStringified!== undefined && unusedExportsStringified === lastUnusedExportsStringified){
      console.log("Ending Big Iteration because unable to remove these unused exports", unusedExportsByFile);
      doNotIterate =  true;
      return;
    }
    else {
      lastUnusedExportsStringified = unusedExportsStringified;
    }
    if(doNotIterate){
      return;
    }
    else {
      setTimeout(BigIterate);
    }
  }
  if(doNotIterate){
    setTimeout(() => {console.log("totalBigIteration: ",totalBigIteration);});
    setTimeout(deleteEmptyFiles);
    return;
  }
}

BigIterate();

function deleteEmptyFiles(){
  inputFileLocations.forEach((file) => {
    const input = fs.readFileSync(file).toString();
    if (!input.replace(/\s/g, '').length) {
      console.log(`Removing empty file: ${file}`);
      try {
        fs.unlinkSync(file);
        console.log("Removed!");
      }catch(e){
        console.log(e);
      }
    }
  })
}
*/

///////////////////

// const PathResolver = require("./path_resolver/pathResolver.js").default;

// const skipDirectories = ["node_modules"];

// function traverseDir(dir, pr) {
//   fs.readdirSync(dir).forEach((file) => {
//     if(skipDirectories.includes(file)){
//       return;
//     }
//     let fullPath = path.join(dir, file);
//     if (fs.lstatSync(fullPath).isDirectory()) {
//       const directories = fs.readdirSync(fullPath);
//       const index = directories.findIndex(file => file === "tsconfig.json");
//       if(index!=-1){
//         const pathToTsConfig = path.join(fullPath,directories[index]);
//         console.log("tsconfig inside :",pathToTsConfig);
//         const newpr = new PathResolver(pathToTsConfig);
//         traverseDir(fullPath,newpr);
//       }
//       else {
//         traverseDir(fullPath,pr);
//       }
//     }else {
//       function getExtension(filename) {
//         return filename.split(".").pop();
//       }
      
//       function isJSFile(filename) {
//         const ext = getExtension(filename);
//         return ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx";
//       }

//       if(!isJSFile(fullPath))return;
//       console.log("running on file: ",fullPath);
//       if(pr===undefined){
//         console.log("how is it undefined?", fullPath);
//         return;
//       }
//       try {
//       const xx = getExportsAndImports(fs.readFileSync(fullPath).toString(),fullPath,pr);
//       console.log(xx);
//       }catch(e){
//         console.log("error on file: ",fullPath);
//         console.log("error: ",e);
//       }
//     }
// });
// }

// const pr = new PathResolver(path.join(inputFolderLocation,"tsconfig.json"));
// traverseDir(inputFolderLocation,pr);

// const { getTsconfig, createPathsMatcher } = require('get-tsconfig');

// function getPathsMatcher(pathToTsConfig){
//   const tsconfig = getTsconfig(pathToTsConfig);
//   console.log("hello ",tsconfig);
//   const pathsMatcher = createPathsMatcher(tsconfig);
//   console.log("hello ",pathsMatcher);
//   return pathsMatcher;
// }

// const skipDirectories = ["node_modules"];

// function traverseDir(dir, pathsMatcher) {
//   fs.readdirSync(dir).forEach((file) => {
//     if(skipDirectories.includes(file)){
//       return;
//     }
//     let fullPath = path.join(dir, file);
//     if (fs.lstatSync(fullPath).isDirectory()) {
//       const directories = fs.readdirSync(fullPath);
//       const index = directories.findIndex(file => file === "pathsMatcher.json");
//       if(index!=-1){
//         const pathToTsConfig = path.join(fullPath,directories[index]);
//         //console.log("pathsMatcher inside :",pathToTsConfig);
//         const newPathsMatcher = getPathsMatcher(pathToTsConfig);
//         traverseDir(fullPath,newPathsMatcher);
//       }
//       else {
//         traverseDir(fullPath,pathsMatcher);
//       }
//     }else {
//       function getExtension(filename) {
//         return filename.split(".").pop();
//       }
      
//       // function removeExtension(filename){
//       //     return filename.split(".")[0];
//       // }
      
//       function isJSFile(filename) {
//         const ext = getExtension(filename);
//         return ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx";
//       }

//       if(!isJSFile(fullPath))return;
//       if(pathsMatcher==undefined){
//         throw `Couldn't find tsconfig for ${fullPath}`;
//       }
//       try {
//         console.log(pathsMatcher);
//         const xx = getExportsAndImports(fs.readFileSync(fullPath).toString(),fullPath,pathsMatcher);
//         console.log("here ",xx);
//       }catch(e){
//         console.log("error on file: ",fullPath);
//         // if(fullPath === "/Users/abhishekanand/Desktop/project2 2/src/tests/calculator/index.ts")console.log("error: ",e);
//         // if(
//         //   fullPath === "/Users/abhishekanand/Desktop/project2 2/src/mono-repo-dummy/apps/example/index.ts"
//         //   || fullPath === "/Users/abhishekanand/Desktop/project2 2/src/vibesition/src/components/login.tsx"
//         //   || fullPath === "/Users/abhishekanand/Desktop/project2 2/src/vibesition/src/components/player.tsx"
//         // )
//         console.log("error: ",e);
//       }
//     }
// });
// }
// //console.log(path.join(inputFolderLocation,"tsconfig.json"));
// const pathsMatcher = getPathsMatcher(path.join(inputFolderLocation,"tsconfig.json"));
// console.log(pathsMatcher);
// traverseDir(inputFolderLocation,pathsMatcher);