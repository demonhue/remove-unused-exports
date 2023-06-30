const traverse = require("@babel/traverse").default;
const {parser,generator} = require("./utils");
const {getBindings,removeConstantViolations} = require("./transform");

function removeExportsFromFile(input, unusedExports) {
  const ast = parser(input);
  const bindings = getBindings(ast);

  //console.log(bindings);

  function getStartOfVariablesReferencedMoreThanOnce(){
    let startOfVariablesReferencedMoreThanOnce = new Set();
    for(let key of Object.keys(bindings)){
      if(bindings[key].references>1){
        startOfVariablesReferencedMoreThanOnce.add(parseInt(key,10));
      }
    }
    return startOfVariablesReferencedMoreThanOnce;
  }

  const startOfVariablesReferencedMoreThanOnce = getStartOfVariablesReferencedMoreThanOnce();
  //console.log("##",startOfVariablesReferencedMoreThanOnce);

  let unusedExportsSet = new Set();

  for (let unusedExport of unusedExports) {
    unusedExportsSet.add(unusedExport.exportName);
  }

  function isNotImportedAnywhere(exportName){
    return unusedExportsSet.has(exportName);
  }

  function isUsedInTheFile(start){
    return startOfVariablesReferencedMoreThanOnce.has(start);
  }
  //console.log(bindings);
  function isUselessExport(exportName,start){
    return (isNotImportedAnywhere(exportName) && !isUsedInTheFile(start));
  }

  traverse(ast, {
    /*
    ExportSpecifier(path) {
      exportsAndImports.push({
        localName: path.node.local.name,
        exportedName: path.node.exported.name,
        from: fileLocation,
      });
    },*/
    ExportNamedDeclaration(path) {
      const {node} = path;
      if(node.declaration){
       	if(node.declaration.id){//Case1
          const exportName = node.declaration.id.name;
          const start = node.declaration.id.start;
          if(isUselessExport(exportName,start)){
            console.log(`Removing export ${exportName}`);
            removeConstantViolations(bindings[start]);
            path.remove();
          }
        }
        else if(node.declaration.declarations){
          node.declaration.declarations = node.declaration.declarations.filter(value => {
            if(value.id.name){//Case2
              const exportName = value.id.name;
              const start = value.id.start;
              if(isUselessExport(exportName,start)){
                console.log(`Removing export ${exportName}`);
                removeConstantViolations(bindings[start]);
                return false;
              } else {
                return true;
              }
            }
            else if(value.id.properties){//Case6
              value.id.properties = value.id.properties.filter(x => {
                //console.log(x);
                const exportName = x.value.name;
                const start = x.value.start;
                if(isUselessExport(exportName,start)){
                  console.log(`Removing export ${exportName}`);
                  removeConstantViolations(bindings[start]);
                  return false;
                } else {
                  return true;
                }
              });
              return value.id.properties.length !== 0;
            }
            else if(value.id.elements){//Case5
              let count = 0;
              value.id.elements = value.id.elements.map(x => {
                if(x === null){
                  count++;
                  return null;
                }
                const exportName = x.name;
                const start = x.start;
                if(isUselessExport(exportName,start)){
                  console.log(`Removing export ${exportName}`);
                  removeConstantViolations(bindings[start]);
                  count++;
                  return null;
                }
                return x;
              });
              //console.log(count,value.id.)
              return (count !== value.id.elements.length);
            }
          });
          if(node.declaration.declarations.length === 0)path.remove();
        }
      }
      else if(node.specifiers){
        if(node.source == null){
            node.specifiers = node.specifiers.filter(value => {
              if(value.exported.type === "StringLiteral"){//Case3
                const exportName = value.exported.value;
                const start = value.exported.start;
                if(isUselessExport(exportName,start)){
                  console.log(`Removing export ${exportName}`);
                  removeConstantViolations(bindings[start]);
                  return false;
                } else {
                  return true;
                }
              }else if(value.exported.type === "Identifier"){//Case4
                const exportName = value.exported.name;
                const start = value.exported.start;
                if(isUselessExport(exportName,start)){
                  console.log(`Removing export ${exportName}`);
                  removeConstantViolations(bindings[start]);
                  return false;
                } else {
                  return true;
                }
              }
            });
          }
        else {
          node.specifiers = node.specifiers.filter(value => {
            if(value.type === "ExportNamespaceSpecifier"){//Case7
              const exportName = value.exported.name;
              const start = value.exported.start;
              if(isUselessExport(exportName,start)){
                console.log(`Removing export ${exportName}`);
                removeConstantViolations(bindings[start]);
                return false;
              } else {
                return true;
              }
            } else if(value.type === "ExportSpecifier"){//Case8
              const exportName = value.exported.name;
              const start = value.exported.start;
              if(isUselessExport(exportName,start)){
                console.log(`Removing export ${exportName}`);
                removeConstantViolations(bindings[start]);
                return false;
              } else {
                return true;
              }
            }
          });
        }
        if(node.specifiers.length === 0)path.remove();
      }
    },
    ExportDefaultDeclaration(path){
      const exportName = "default";
      const start = path.node.declaration.id?.start;
      if(isUselessExport(exportName,start)){
        console.log(`Removing export ${exportName}`);
        removeConstantViolations(bindings[start]);
        path.remove();
      }
    }
  });

  const output = generator(ast);

  return output;
}

exports.default = removeExportsFromFile;
