const path = require('path');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { parse } = require('../src/parser');
const { generate } = require('../src/generator');

const config = {
  parser: {
    namespaces: [
      'ui',
    ],
    typeNaming: '[<namespace>_]<object>_t',
    functionNaming: '[<namespace>_]<object>_<action>[_<object>]',
  },
  generator: {
    tabSize: 8,
    insertSpaces: false,
    headerFile: 'LCUI.h',
    outputPath: path.join(__dirname, 'output'),
    dict: {
      default: {
        ui: 'UI',
      },
      cn: {
        ui: '界面',
        css: '样式库',
        load: '加载',
        set: '设置',
        get: '获取',
        init: '初始化',
        create: '创建',
        destroy: '销毁',
        add: '添加',
        remove: '移除',
        delete: '删除',
        resize: '调整尺寸',
        update: '更新',
        widget: '组件',
      },
    },
    entry: [
      {
        language: 'c',
        filename: 'LCUI',
        namespace: 'LCUI',
        typeNaming: '<NAMESPACE>_[Namespace]<Object>',
        functionNaming: '<NAMESPACE>_<Action>[Namespace]<Object>',
      },
      {
        language: 'c',
        filename: '图形界面库',
        namespace: '图形界面库',
        typeNaming: '<NAMESPACE>_[Namespace]<Object>',
        functionNaming: '<NAMESPACE>_<Action>[Namespace]<Object>',
        useDict: 'cn',
      },
      {
        language: 'c++',
        filename: 'LCUI',
        namespace: 'LCUI',
        typeNaming: '<Object>',
        classNaming: '<Object>',
        methodNaming: '<Action>[Object]',
        constructorName: ['create', 'new'],
        destructorName: ['destroy', 'free'],
      },
      {
        language: 'c++',
        filename: '图形界面库',
        namespace: '图形界面库',
        typeNaming: '<Object>',
        classNaming: '<Object>',
        methodNaming: '<Action>[Object]',
        constructorName: ['create', 'new'],
        destructorName: ['destroy', 'free'],
        useDict: 'cn',
      },
    ],
  },
};

const exampleCode = `
typedef struct ui_widget_t ui_widget_t;

void ui_init(void);
void ui_destroy(void);

ui_widget_t *ui_create_widget(const char *type);
ui_widget_t *ui_get_widget(const char *id);

void ui_widget_resize(ui_widget_t *w, float width, float height);
void ui_widget_update(ui_widget_t *w);
`;

const input = parse(exampleCode, config.parser);
console.log('input');
console.log(input);
console.log('output');
const output = generate(input, config.generator);
console.log(output);

output.forEach((file) => {
  console.log(`writing ${file.path}`);
  if (!existsSync(path.dirname(file.path))) {
    mkdirSync(path.dirname(file.path), { recursive: true });
  }
  writeFileSync(file.path, file.content, { encoding: 'utf-8' });
});
