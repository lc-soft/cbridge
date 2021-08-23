const {
  pascalCase,
} = require('change-case');
const path = require('path');
const Translator = require('../translator');

class Writer {
  constructor(file, config) {
    this.indent = 0;
    this.file = file;
    this.config = config;
  }

  write(line) {
    this.file.content.push(
      `${this.config.insertSpaces
        ? ' '.repeat(this.indent * this.config.tabSize)
        : '\t'.repeat(this.indent)}${line}`,
    );
  }
}

function convert(data, config) {
  const translator = new Translator(config.dict, config.useDict);
  const translate = translator.translate.bind(translator);
  const typeConverters = {
    '<Object>': (name) => translate(name) || pascalCase(name),
  };
  const classConverters = {
    '<Object>': (name) => translate(name) || pascalCase(name),
  };
  const methodConverters = {
    '<Action>[Object]': (func) => [
      translate(func.action) || pascalCase(func.action),
      func.property && (translate(func.property) || pascalCase(func.property)),
    ].filter(Boolean).join('_'),
  };

  const classes = {};
  const namespaces = {};
  const defaultNamespace = {
    name: config.namespace,
    classes: [],
    types: [],
    functions: [],
  };
  const convertTypeName = typeConverters[config.typeNaming];
  const convertClassName = classConverters[config.classNaming];
  const convertMethodName = methodConverters[config.methodNaming];

  function allocNamespace(name) {
    if (!namespaces[name]) {
      namespaces[name] = {
        name: config.namespace
          ? `${config.namespace}::${convertTypeName(name)}`
          : convertTypeName(name),
        classes: [],
        types: [],
        functions: [],
      };
    }
    return namespaces[name];
  }

  data.types.forEach((type) => {
    classes[type.name] = ({
      namespace: type.namespace,
      name: convertClassName(type.name),
      type: {
        ...type,
        name: convertTypeName(type.name),
      },
      constructor: '',
      destructor: '',
      methods: [],
    });
  });
  defaultNamespace.functions = data.functions.filter((func) => {
    if (!func.object) {
      return true;
    }
    const classDecl = classes[func.object];
    if (!classDecl) {
      console.warn(`the type of the object to which function '${func.cname}' belongs is undefined.`);
      return true;
    }
    const clsFunc = { ...func, name: convertMethodName(func) };
    if (config.constructorName.includes(clsFunc.action)) {
      classDecl.constructor = clsFunc;
    } else if (config.destructorName.includes(clsFunc.action)) {
      classDecl.destructor = clsFunc;
    } else {
      classDecl.methods.push(clsFunc);
    }
    return false;
  });
  Object.keys(classes).forEach((typeName) => {
    const classDecl = classes[typeName];
    if (classDecl.methods.length > 0) {
      defaultNamespace.classes.push(classDecl);
    } else {
      defaultNamespace.types.push(classDecl.type);
    }
  });
  ['types', 'classes', 'functions'].forEach((key) => {
    defaultNamespace[key] = defaultNamespace[key].filter((element) => {
      if (element.namespace) {
        const namespace = allocNamespace(element.namespace);
        namespace[key].push(element);
        return false;
      }
      return true;
    });
  });
  return [defaultNamespace, ...Object.keys(namespaces).map((key) => namespaces[key])];
}

function generateArgs(args, start) {
  return args.slice(start).map((arg) => `${arg.type} ${arg.name}`.trim()).join(', ') || 'void';
}

function generateHeaderFile(namespaces, config) {
  const file = {
    path: path.resolve(config.outputPath, `${config.filename}.hpp`),
    content: [],
  };
  const writer = new Writer(file, config);
  const write = writer.write.bind(writer);

  namespaces.forEach((ns) => {
    if (!ns.functions.length && !ns.types.length && !ns.classes.length) {
      return;
    }
    write(`namespace ${ns.name} {`);
    write('');
    ns.types.forEach((type) => {
      write(`typedef ${type.cname} ${type.name};`);
    });
    if (ns.types.length > 0) {
      file.content.push('');
    }
    ns.classes.forEach((cls) => {
      write(`class ${cls.name} {`);
      writer.indent += 1;
      write(`${cls.type.cname}* data;`);
      if (cls.constructor) {
        write(`${cls.constructor.name}(${generateArgs(cls.constructor.args, 1)});`);
      } else {
        console.error(`the constructor of class ${cls.name} was not found. please add it, for example: ${cls.type.parsedCName}_create()`);
      }
      if (cls.destructor) {
        write(`~${cls.destructor.name}();`);
      } else {
        console.error(`the destructor of class ${cls.name} was not found. please add it, for example: ${cls.type.parsedCName}_destroy()`);
      }
      cls.methods.forEach((method) => {
        write(`${method.returnType || 'void'} ${method.name}(${generateArgs(method.args, 1)});`);
      });
      writer.indent -= 1;
      write('};');
      write('');
    });
    ns.functions.forEach((func) => {
      write(`${func.returnType} ${func.name}(${generateArgs(func.args)});`);
    });
    if (ns.functions.length) {
      file.content.push('');
    }
    write('};');
    write('');
  });
  return {
    path: file.path,
    content: file.content.join('\n'),
  };
}

function generateSourceFile(namespaces, config) {
  const file = {
    path: path.resolve(config.outputPath, `${config.filename}.cpp`),
    content: [],
  };
  const writer = new Writer(file, config);
  const write = writer.write.bind(writer);

  write(`#include "${config.headerFile}"`);
  write(`#include "${config.filename}.hpp"`);
  write('');
  namespaces.forEach((ns) => {
    ns.classes.forEach((cls) => {
      const prefix = `${ns.name}::${cls.name}::`;
      if (cls.constructor) {
        write(`${prefix}${cls.constructor.name}(${generateArgs(cls.constructor.args, 1)}`);
        write('{');
        writer.indent += 1;
        write(`this.data = ${cls.constructor.cname}(${cls.constructor.args.map((arg) => arg.name).join(', ')});`);
        writer.indent -= 1;
        write('}');
        write('');
      }
      if (cls.destructor) {
        write(`~${prefix}${cls.destructor.name}()`);
        write('{');
        writer.indent += 1;
        write(`${cls.destructor.cname}(${this.data})`);
        writer.indent -= 1;
        write('}');
        write('');
      }
      cls.methods.forEach((method) => {
        write(`${method.returnType} ${prefix}${method.name}(${generateArgs(method.args, 1)})`);
        write('{');
        writer.indent += 1;
        write(`${method.cname}(${['this.data', ...method.args.slice(1).map((arg) => arg.name)].join(', ')});`);
        writer.indent -= 1;
        write('};');
        write('');
      });
    });
  });
  return {
    path: path.resolve(config.outputPath, file.path),
    content: file.content.join('\n'),
  };
}

function generate(data, config) {
  const namespaces = convert(data, config);
  return [
    generateHeaderFile(namespaces, config),
    generateSourceFile(namespaces, config),
  ];
}

module.exports = {
  generate,
};
