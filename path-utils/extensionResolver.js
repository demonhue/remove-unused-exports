const fs = require("fs");
const path = require("path");

const extensions = ['ts','tsx','js','jsx','cjs','mjs'];

exports.default = function resolveExtension(filePath){
  if(filePath==undefined)return undefined;
  const indexOfDot = filePath.lastIndexOf('.');
  if(indexOfDot === -1){
    for(const extension of extensions){
      const newFilePath = filePath + '.' + extension;
      if(fs.existsSync(newFilePath)){
        return newFilePath;
      }
    };
  }
  else if(fs.existsSync(filePath)){
    return filePath;
  }
  return undefined;
}