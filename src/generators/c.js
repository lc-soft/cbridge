const {
  pascalCase,
} = require('change-case');
const path = require('path');
const Translator = require('../translator');

function generate(data, config) {
  const translator = new Translator(config.dict, config.useDict);
  const translate = translator.translate.bind(translator);
  const typeGenerators = {
    '<NAMESPACE>_[Namespace]<Object>': (type) => {
      let newName = '';

      if (config.namespace) {
        newName = `${config.namespace.toUpperCase()}_`;
      } else {
        console.warn('the root namespace is not specified');
      }
      newName += [type.namespace, type.name]
        .filter(Boolean)
        .map((word) => translate(word) || pascalCase(word))
        .join('');
      return `typedef ${type.cname} ${newName};`;
    },
  };

  const functionGenerators = {
    '<NAMESPACE>_<Action>[Namespace]<Object>': (func) => {
      let newName = '';

      if (config.namespace) {
        newName = `${config.namespace.toUpperCase()}_`;
      } else {
        console.warn('the root namespace is not specified');
      }
      newName += [
        func.action,
        func.namespace,
        func.object,
        func.property,
      ].filter(Boolean).map((word) => translate(word) || pascalCase(word)).join('');

      return `#define ${func.cname} ${newName}`;
    },
  };

  const generateType = typeGenerators[config.typeNaming];
  const generateFunction = functionGenerators[config.functionNaming];
  return {
    path: path.resolve(config.outputPath, `${config.filename}.h`),
    content: [
      ...data.types.map(generateType),
      '',
      ...data.functions.map(generateFunction),
      '',
    ].join('\n'),
  };
}

module.exports = { generate };
