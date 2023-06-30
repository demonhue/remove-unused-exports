class Node {
  constructor(value = '') {
      this.children = new Map();
      this.value = value;
      this.index = -1;
  }
}

class Trie {
  constructor() {
      this.root = new Node();
  }
  insert(word,index) {
    if (!word) return false;

    let currNode = this.root;

    for (const letter of word) {
        if (!currNode.children.has(letter)) {
            currNode.children.set(letter,new Node(letter));
        }
        currNode = currNode.children.get(letter);
    }

    currNode.index = index;
    return currNode;
  }
}

exports.makeTrie =  function makeTrie(arr){
  const trie = new Trie();
  for(let i=0; i<arr.length;++i)trie.insert(arr[i],i);
  return trie;
}

exports.matchWord = function matchWord(trie,word){
  let index = -1, till = -1;
  let currNode = trie.root;
  for(let i=0;i<word.length;++i){
    const letter = word[i];
    if (!currNode.children.has(letter)){
      break;
    }
    else {
      currNode = currNode.children.get(letter);
      if(currNode.index!==-1){
        index = currNode.index;
        till = i;
      }
    }
  }
  return {index: index, till: till};
}