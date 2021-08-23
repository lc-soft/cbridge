# CBridge

**English**/[中文](README.zh-cn.md)

An API export tool used to create other naming style APIs and C++ bindings for C libraries.

(This project is not completed, please wait for the first release)

## Usage

The contents of the input header file:

```c
typedef struct ui_widget_t ui_widget_t;

void ui_init(void);
void ui_destroy(void);

ui_widget_t *ui_create_widget(const char *type);
ui_widget_t *ui_get_widget(const char *id);

void ui_widget_resize(ui_widget_t *w, float width, float height);
void ui_widget_update(ui_widget_t *w);
```

The header file containing the camel case naming style API will be output:

```c
typedef ui_widget_t LCUI_UIWidget;

#define ui_init LCUI_InitUI
#define ui_destroy LCUI_DestroyUI
#define ui_create_widget LCUI_CreateUIWidget
#define ui_get_widget LCUI_GetUIWidget
#define ui_widget_resize LCUI_ResizeUIWidget
#define ui_widget_update LCUI_UpdateUIWidget
```

It can also output C++ binding source code:

```cpp
// LCUI.cpp
#include "LCUI.h"
#include "LCUI.hpp"

void LCUI::UI::Widget::Resize(float width, float height)
{
	ui_widget_resize(this.data, width, height);
};

void LCUI::UI::Widget::Update(void)
{
	ui_widget_update(this.data);
};
```

```cpp
// LCUI.hpp
namespace LCUI::UI {

class Widget {
	ui_widget_t* data;
	void Resize(float width, float height);
	void Update(void);
};

void init(void);
void destroy(void);
ui_widget_t* create_widget(const char* type);
ui_widget_t* get_widget(const char* id);

};

```

Use the `generator.dict` and `generator.entry.useDict` configuration items to enable translation:

```js
module.exports = {
  generator: {
    dict: {
      cn: {
        load: '加载',
        set: '设置',
        get: '获取',
        init: '初始化',
        create: '创建',
        destroy: '销毁',
        add: '添加',
        remove: '移除',
        delete: '删除',
      },
    },
    entry: [
      {
        useDict: 'cn',
      },
    ],
  },
};

```

The content of the output C header file will look like this:

```c
typedef ui_widget_t 图形界面库_界面组件;

#define ui_init 图形界面库_初始化界面
#define ui_destroy 图形界面库_销毁界面
#define ui_create_widget 图形界面库_创建界面组件
#define ui_get_widget 图形界面库_获取界面组件
#define ui_widget_resize 图形界面库_调整尺寸界面组件
#define ui_widget_update 图形界面库_更新界面组件
```

## License

[MIT](LICENSE)
