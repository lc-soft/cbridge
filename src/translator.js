class Translator {
  constructor(dict, key) {
    this.dict = dict;
    this.key = key;
  }

  translate(word) {
    let result;
    if (this.dict[this.key]) {
      result = this.dict[this.key][word.toLowerCase()];
    }
    if (result) {
      return result;
    }
    if (this.dict.default && this.dict.default[word]) {
      return this.dict.default[word];
    }
    return null;
  }
}

module.exports = Translator;
