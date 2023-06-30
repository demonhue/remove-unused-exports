const recast = require("recast");
const babel = require('@babel/parser');
const generate = require("@babel/generator").default;
exports.parser = function parser(input) {
    let ast = recast.parse(input, {
        parser: {
            parse(input) {
                return require('recast/parsers/babel-ts').parse(input, {
                    plugins: [
                        // enable jsx and flow syntax
                        "jsx",
                        "flow",
                        "@babel/plugin-transform-react-jsx"
                    ],
                })
            }
        }
    });
    return ast;
};
exports.generator = (ast)  => recast.print(ast);
// exports.parser = function parser(input){
//     let ast = babel.parse(input,{
//         sourceType: "module",
//         plugins: [
//             "asyncGenerators",
//             "bigInt",
//             "classPrivateMethods",
//             "classPrivateProperties",
//             "classProperties",
//             "classStaticBlock",
//             "decimal",
//             "decorators-legacy",
//             "doExpressions",
//             "dynamicImport",
//             "exportDefaultFrom",
//             "exportExtensions",
//             "exportNamespaceFrom",
//             "functionBind",
//             "functionSent",
//             "importAssertions",
//             "importMeta",
//             "nullishCoalescingOperator",
//             "numericSeparator",
//             "objectRestSpread",
//             "optionalCatchBinding",
//             "optionalChaining",
//             [
//                 "pipelineOperator",
//                 {
//                     proposal: "minimal",
//                 },
//             ],
//             [
//                 "recordAndTuple",
//                 {
//                     syntaxType: "hash",
//                 },
//             ],
//             "throwExpressions",
//             "topLevelAwait",
//             "v8intrinsic",
//             "jsx",
//             "typescript",
//             'babel-plugin-styled-components'
//         ],
//         presets: [
//             [
//                 "@babel/preset-typescript",
//                 {
//                     "isTSX": true
//                 }
//             ],
//             '@babel/preset-react'
//         ],
//     })
//     return ast;
// }
// //console.log("%%%%%%%%%%",generate);
// exports.generator = (ast) => generate(ast);
