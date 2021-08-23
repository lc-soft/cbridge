const generateC = require('./generators/c').generate;
const generateCpp = require('./generators/cpp').generate;

function generate(data, config) {
  const outputs = [];

  config.entry.forEach((entry) => {
    const entryConfig = { ...config, ...entry, entry: undefined };
    switch (entry.language) {
      case 'c':
        outputs.push(generateC(data, entryConfig));
        break;
      case 'c++':
        outputs.push(generateCpp(data, entryConfig));
        break;
      default:
        break;
    }
  });
  return outputs.flat();
}

module.exports = {
  generate,
};
