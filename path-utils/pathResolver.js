const {makeTrie, matchWord} = require("./trie.js");
const path = require("path");
const { getTsconfig } = require('get-tsconfig');

exports.default = class pathResolver{
  constructor(pathToTsConfig){
    this.pathToTsConfig = pathToTsConfig;
    let tsConfig;
    try {
      tsConfig = getTsconfig(pathToTsConfig);
    } catch(e){
      console.log("error parsing tsconfig");
      throw e;
    }
    const {paths,baseUrl} = tsConfig.config.compilerOptions;
    this.baseUrl = baseUrl ?? '.';
    if(paths == undefined || baseUrl == undefined)return;
    this.newObj = {};

    for(const [key,value] of Object.entries(paths)){
      this.newObj[key.replace(/.$/,'')] = value[0].replace(/.$/,'');
    }

    this.keys = Object.keys(this.newObj);
    this.trie = makeTrie(this.keys);
  }
  resolve(modulePath){
    //const modulePath = extensionResolver(modulePath);
    if(modulePath == undefined){
      throw `You are trying to resolve 'undefined'`;
    }
    else if(modulePath[0]==='.'){//for relative or absolute path
      throw `Cant resolve ${modulePath} since it is relative path`;
    }
    else if(modulePath[0]==='/'){
      console.log(`I HOPE ${modulePath} IS AN ABSOLUTE PATH`);
      return modulePath;
    }
    else {//for aliases
      if(this.trie==undefined){//when paths or baseUrl is not in tsconfig but we tried to get alias might happen in case of node_modules
        console.log("WARNING",`couldnt find alias for ${modulePath}`);
        return modulePath;
      }
      const {index, till} = matchWord(this.trie,modulePath);
      if(index === -1){//can't find a match
        return undefined;
      }
      return path.join(this.pathToTsConfig,'..',this.baseUrl,this.newObj[this.keys[index]],modulePath.substring(till+1,modulePath.length));
    }
  }
}
// console.log(paths[keys[index]][0]);

// const absolutePath = path.join(baseUrl,paths[keys[index]][0]);

// console.log(absolutePath);