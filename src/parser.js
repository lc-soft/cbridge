const verbs = require('verb-corpus');

const verbSet = new Set([...verbs, 'init']);

function createTypeParser(config) {
  const namespaces = new Set(config.namespaces);
  const typeParsers = {
    '[<namespace>_]<object>_t': (str) => {
      const words = str.split('_');
      const prefix = words[0];
      const type = {
        cname: str,
        parsedCName: str,
        namespace: '',
        name: '',
      };

      if (str.endsWith('_t')) {
        type.parsedCName = str.substr(0, str.length - 2);
      } else {
        console.warn(`incorrect naming style: "${str}" should be named "${str}_t"`);
      }
      if (namespaces.has(prefix)) {
        type.namespace = prefix;
        type.name = words.slice(1, words.length - 1).join('_');
      } else {
        type.name = words.slice(0, words.length - 1).join('_');
      }
      return type;
    },
  };
  return typeParsers[config.typeNaming];
}

function createFunctionParser(config) {
  const namespaces = new Set(config.namespaces);
  const functionParsers = {
    '[<namespace>_][<object>_]<method>': (func) => {
      let words = func.name.split('_');
      const prefix = words[0];
      const parsedFunc = {
        ...func,
        cname: func.name,
        namespace: '',
        object: '',
        operate: '',
        target: '',
      };

      if (namespaces.has(prefix)) {
        words = words.slice(1);
        parsedFunc.namespace = prefix;
        parsedFunc.name = words.join('_');
      }
      if (words.length > 0) {
        [parsedFunc.operate] = words;
        if (verbSet.has(words[0])) {
          [parsedFunc.operate] = words;
          parsedFunc.target = words.slice(1).join('_');
        } else {
          [parsedFunc.object] = words;
          parsedFunc.operate = words[1] || '';
          parsedFunc.target = words.slice(2).join('_');
        }
      }
      return parsedFunc;
    },
  };
  return functionParsers[config.functionNaming];
}

function parse(str, config) {
  const types = [];
  const functions = [];
  const parseType = createTypeParser(config);
  const parseFunction = createFunctionParser(config);

  function parseStatement(stat) {
    const words = stat.split(' ').map((word) => word.trim()).filter(Boolean);
    // typedef struct foo foo_t
    // ['typedef', 'struct', 'foo', 'foo_t']
    if (words[0] === 'typedef') {
      types.push(parseType(words.pop(), config));
      return;
    }
    // LIB_EXPORT int foo_create(foo_t foo, const char *str)
    // ['LIB_EXPORT', 'int', 'foo_create(foo_t', 'foo', 'const', 'char', '*str)']
    const index = words.findIndex((word) => word.includes('('));
    if (index < 0) {
      return;
    }
    const func = {};
    const lastWord = index < words.length - 1 ? words[words.length - 1] : '';
    // foo_create(foo_t foo
    [func.name, func.args] = words[index].split('(');
    // foo_create (foo_t foo
    if (!func.name) {
      func.name = words[index - 1];
      func.returnType = words.slice(0, index - 1).join(' ');
    } else {
      func.returnType = words.slice(0, index).join(' ');
    }
    // foo_create(void)
    if (func.args.includes(')')) {
      [func.args] = func.args.split(')');
    }
    // char **func()
    while (func.name.startsWith('*')) {
      func.returnType += '*';
      func.name = func.name.substr(1);
    }
    func.args = [
      func.args,
      ...words.slice(index + 1, words.length - 1),
      lastWord.split(')')[0],
    ].filter(Boolean)
      .join(' ')
      .split(',')
      .map((arg) => arg.split(' '))
      .map((keywords) => {
        const arg = {
          type: keywords.slice(0, keywords.length - 1).join(' ').trim(),
          name: keywords[keywords.length - 1],
        };
        // char **arg
        while (arg.name.startsWith('*')) {
          arg.type += '*';
          arg.name = arg.name.substr(1);
        }
        return arg;
      });
    functions.push(parseFunction(func));
  }

  function parseStatements() {
    let start = 0;
    let brackets = 0;
    for (let i = start; i < str.length; ++i) {
      switch (str[i]) {
        case '{':
        case '(':
          brackets++;
          break;
        case '}':
        case ')':
          brackets--;
          break;
        case ';':
          if (brackets === 0) {
            parseStatement(str.substring(start, i));
          }
          start = i + 1;
          break;
        default: break;
      }
    }
  }

  parseStatements();
  return { types, functions };
}

module.exports = { parse };
