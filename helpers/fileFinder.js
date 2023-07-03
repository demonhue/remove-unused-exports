const fs = require("fs");
const path = require("path");
const {isUnderAnyMustHaveDirectory} = require("../path-utils/checkDirectory");

function getExtension(filename) {
    return filename.split(".").pop();
}

// function removeExtension(filename){
//     return filename.split(".")[0];
// }

function isJSFile(filename) {
    const ext = getExtension(filename);
    return ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx";
}

const inputFileLocations = [];

function traverseDir(dir) {
    fs.readdirSync(dir).forEach((file) => {
        let fullPath = path.join(dir, file);
        if(!isUnderAnyMustHaveDirectory(fullPath)){
            return;
        }
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (isJSFile(file)) {
            inputFileLocations.push(fullPath);
        }
  });
}

function fileFinder(inputFolderLocation) {
  //const inputFileLocations = [];
    inputFileLocations.splice(0, inputFileLocations.length);
    traverseDir(inputFolderLocation);
    return inputFileLocations;
}

exports.default = fileFinder;
