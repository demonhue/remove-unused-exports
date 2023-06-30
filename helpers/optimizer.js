//const Parser = require("@babel/parser");
const {parser, generator} = require("./utils.js");
const transform = require("./transform.js").default;

/*
takes javascript code as text as input
returns ast as ouput
*/
//const input = fs.readFileSync(fileLocation).toString();
//'./src/main.js'
function getOptimizedCode(input,maxSmallIteration,file) {  
  let output = {code:input},
    lastOutputCode = undefined;
  /*
    maxSmallIteration is there to put
    a limit to the number of loops so that
    we don't get infinite loop
  */

  /*
    number of loops for convergence
  */
  let totalSmallIterations = 0;

  /*
    looping until there is no optimizations possible
  */
  while (output.code !== lastOutputCode && totalSmallIterations<=maxSmallIteration) {
    ++totalSmallIterations;
    try {
      let ast = parser(output.code);
      transform(ast,file);
      lastOutputCode = output.code;
      output = generator(ast);
    }catch(e){
      console.log({error:e,file: file, failSafe: "returning original input", iteration: totalSmallIterations});
      //throw e;
      return {output: {code: input}, totalSmallIterations: totalSmallIterations};
    }
  }
  return {output: output, totalSmallIterations: totalSmallIterations};
}

exports.default = getOptimizedCode;
//fs.writeFileSync('./output/final.js', output.code, 'utf8');
