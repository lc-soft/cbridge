const {
  pascalCase,
} = require('change-case');
const path = require('path');
const Translator = require('../translator');

function generate(data, config) {
  const translator = new Translator(config.dict, config.useDict);
  const typeGenerators = {
    '[<NAMESPACE>_][Namespace]<Object>': (type) => {
      let newName = '';
      const translate = (str) => translator.translate(str) || pascalCase(str);

      if (config.namespace) {
        newName = `${config.namespace.toUpperCase()}_`;
      }
      if (type.namespace) {
        newName += translate(type.namespace);
      }
      newName += translate(type.name);
      return `typedef ${type.cname} ${newName};`;
    },
  };

  const functionGenerators = {
    '[<NAMESPACE>_][<Namespace>_][Object]<Method>': (func) => {
      let newName = '';
      const translate = (str) => translator.translate(str) || pascalCase(str);

      if (config.namespace) {
        newName = `${config.namespace.toUpperCase()}_`;
      }
      if (func.namespace) {
        newName += `${translate(func.namespace) || func.namespace.toUpperCase()}_`;
      }
      if (func.object) {
        newName += translate(func.object);
      }
      newName += translate(func.operate);
      newName += translate(func.target);
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
