const excludedDirectories = ["pages","node_modules"];
const mustHaveDirectories = ["sprinklr-app-client/apps","sprinklr-app-client/packages"];

function isUnderAnExcludedDirectory(fileLocation){
  for(let excludedDirectory of excludedDirectories){
    const pattern = "/" + excludedDirectory + "/";
    if(fileLocation.includes(pattern))return true;
    if(fileLocation.slice(0,excludedDirectory.length) == excludedDirectory)return true;
  }
  return false;
}

function isUnderAnyMustHaveDirectory(fileLocation){//these parts can be optimized a little
  for(let mustHaveDirectory of mustHaveDirectories){
    if(fileLocation.includes(mustHaveDirectory))return true;
  }
  return false;
}

exports.default = function checkDirectory(fileLocation){
  //console.log(fileLocation, !isUnderAnExcludedDirectory(fileLocation),isUnderAnyMustHaveDirectory(fileLocation));
  //return true;
  return (!isUnderAnExcludedDirectory(fileLocation) && isUnderAnyMustHaveDirectory(fileLocation));
}