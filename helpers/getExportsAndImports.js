const {parser} = require("./utils");
const traverse = require("@babel/traverse").default;
const joinPath = require("path").join;
const extensionResolver = require("../path-utils/extensionResolver").default;

exports.default = function (code, fileLocation, pr) {
  const exportsAndImports = {
    importedVariables: [],
    exportedVariables: [],
  };

  function getAbsoluteAddressOfSource(path){
    const addressOfSource = path.node.source.value;
    const absoluteAddressOfSource = (addressOfSource[0]==='.')?
    joinPath(
      fileLocation,
      "..",
      addressOfSource
    ):
    pr.resolve(addressOfSource);

    const absoluteAddressOfSourceWithExtension = extensionResolver(absoluteAddressOfSource);
    if(absoluteAddressOfSourceWithExtension==undefined){
      console.log(`WARNING: couldn't find import source '${addressOfSource}' in file '${fileLocation}'.\nI HOPE '${addressOfSource}' IS A NODE MODULE.`);
      console.log(absoluteAddressOfSource);
    }
    return absoluteAddressOfSourceWithExtension;
  }

  const ast = parser(code);

  traverse(ast, {
    /*
    ExportSpecifier(path) {
      exportsAndImports.exportedVariables.push({
        localName: path.node.local.name,
        exportedName: path.node.exported.name,
        from: fileLocation,
      });
    },*/
    ExportNamedDeclaration(path) {
      const {node} = path;
      if(node.declaration){
       	if(node.declaration.id){//Case1
          exportsAndImports.exportedVariables.push({
            localName: node.declaration.id.name,
            exportedName: node.declaration.id.name,
            from: fileLocation,
          });
        }
        else if(node.declaration.declarations){
          node.declaration.declarations.forEach(value => {
            if(value.id.name){//Case2
              exportsAndImports.exportedVariables.push({
                localName: value.id.name,
                exportedName: value.id.name,
                from: fileLocation,
              });
            }
            else if(value.id.tsconfigoperties){//Case6
              value.id.tsconfigoperties.forEach(x => {
                exportsAndImports.exportedVariables.push({
                  localName: value.init.name,
                  exportedName: x.key.name,
                  from: fileLocation,
                });
              });
            }
            else if(value.id.elements){//Case5
              value.id.elements.forEach(x => {
                if(x !== null)
                exportsAndImports.exportedVariables.push({
                  localName: value.init.name,
                  exportedName: x.name,
                  from: fileLocation,
                })
              });
            }
          });
        }
      }
      else if(node.specifiers){
        if(node.source == null){
            node.specifiers.forEach(value => {
              if(value.exported.type === "StringLiteral"){//Case3
                exportsAndImports.exportedVariables.push({
                  localName: value.local.name,
                  exportedName: value.exported.value,
                  from: fileLocation,
                });
              }else if(value.exported.type === "Identifier"){//Case4
                exportsAndImports.exportedVariables.push({
                  localName: value.local.name,
                  exportedName: value.exported.name,
                  from: fileLocation,
                });
              }
            });
          }
        else {
          const absoluteAddressOfSource = getAbsoluteAddressOfSource(path);
          if(absoluteAddressOfSource == undefined)return;
          node.specifiers.forEach(value => {
            if(value.type === "ExportNamespaceSpecifier"){//Case7
              exportsAndImports.importedVariables.push({
                localName: undefined,
                importedName: undefined,
                from: absoluteAddressOfSource//use the source
              });
              exportsAndImports.exportedVariables.push({
                localName: undefined,
                exportedName: value.exported.name,
                from: fileLocation,//use the file's location
                relativeAddressOfSource: path.node.source.value
              });
            } else if(value.type === "ExportSpecifier"){//Case8
              exportsAndImports.importedVariables.push({
                localName: value.local.name,
                importedName: value.local.name,
                from: absoluteAddressOfSource//use the source
              });
              exportsAndImports.exportedVariables.push({
                localName: value.local.name,
                exportedName: value.exported.name,
                from: fileLocation,//use the file's location
                relativeAddressOfSource: path.node.source.value
              });
            }
          });
        }
      }
    },
    ExportDefaultDeclaration(path){
      exportsAndImports.exportedVariables.push({
        localName: undefined,
        exportedName:"default",
        from: fileLocation
      });
    },
    ExportAllDeclaration(path){
      const absoluteAddressOfSource = getAbsoluteAddressOfSource(path);
      if(absoluteAddressOfSource == undefined)return;
      exportsAndImports.importedVariables.push({
        localName: undefined,
        importedName: undefined,//meaning everything is imported
        from: absoluteAddressOfSource//use the source
      });
      exportsAndImports.exportedVariables.push({
        localName:undefined,
        exportedName:undefined,
        from: fileLocation//this file's location
      });
    },
    ImportDeclaration(path) {
      const absoluteAddressOfSource = getAbsoluteAddressOfSource(path);
      if(absoluteAddressOfSource == undefined)return;
      if (path.node.specifiers != null && path.node.specifiers.length) {
        //console.log(path.node.specifiers);
        path.node.specifiers.forEach((value) => {
          if(value.type === "ImportNamespaceSpecifier"){
            exportsAndImports.importedVariables.push({
              importedName: undefined,//meaning everything is imported
              localName: value.local.name,
              from: absoluteAddressOfSource,
            })
          } else {
            exportsAndImports.importedVariables.push({
              importedName:
                value.type == "ImportDefaultSpecifier"
                  ? "default"
                  : value.imported?.name ?? value.imported?.value,
              localName: value.local.name,
              from: absoluteAddressOfSource,
            })
          }
        });
      }
    },
  });

  // traverse(ast, {
  //   ImportDeclaration(path) {
  //     const relativeAddressOfSource = path.node.source.value;
  //     const absoluteAddressOfSource = joinPath(
  //       fileLocation,
  //       "..",
  //       relativeAddressOfSource
  //     );
  //     if (path.node.specifiers != null && path.node.specifiers.length) {
  //       //console.log(path.node.specifiers);
  //       path.node.specifiers.forEach((value) => {
  //         if(value.type === "ImportNamespaceSpecifier"){
  //           exportsAndImports.importedVariables.push({
  //             importedName: undefined,//meaning everything is imported
  //             localName: value.local.name,
  //             from: absoluteAddressOfSource,
  //           })
  //         } else {
  //           exportsAndImports.importedVariables.push({
  //             importedName:
  //               value.type == "ImportDefaultSpecifier"
  //                 ? "default"
  //                 : value.imported?.name ?? value.imported?.value,
  //             localName: value.local.name,
  //             from: absoluteAddressOfSource,
  //           })
  //         }
  //       });
  //     }
  //   },
  // });
  /*
  traverse(ast, {
    ExportNamedDeclaration(path){
      if(path.node){
        console.log("Case8: ",{
          exportedName: "default"
        });
      }
    }
  });
  */
 //console.log(exportsAndImports.importedVariables);
  return exportsAndImports;
};
