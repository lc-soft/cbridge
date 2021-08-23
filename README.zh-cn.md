# CBridge

[English](README.md)/**中文**

一个 API 导出工具，用于为 C 函数库创建其它命名风格 API 和  C++ 绑定。

（此项目未完成，请等待第一个发行版）

## 示例

输入的示例头文件内容：

```c
typedef struct ui_widget_t ui_widget_t;

void ui_init(void);
void ui_destroy(void);

ui_widget_t *ui_create_widget(const char *type);
ui_widget_t *ui_get_widget(const char *id);

void ui_widget_resize(ui_widget_t *w, float width, float height);
void ui_widget_update(ui_widget_t *w);
```

输出包含驼峰命名风格 API 的头文件：

```c
typedef ui_widget_t LCUI_UIWidget;

#define ui_init LCUI_InitUI
#define ui_destroy LCUI_DestroyUI
#define ui_create_widget LCUI_CreateUIWidget
#define ui_get_widget LCUI_GetUIWidget
#define ui_widget_resize LCUI_ResizeUIWidget
#define ui_widget_update LCUI_UpdateUIWidget
```

输出 C++ 绑定源码：

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

使用 `generator.dict` 和 `generator.entry.useDict` 配置项可启用翻译功能：

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

输出的 C 头文件内容会是这样：

```c
typedef ui_widget_t 图形界面库_界面组件;

#define ui_init 图形界面库_初始化界面
#define ui_destroy 图形界面库_销毁界面
#define ui_create_widget 图形界面库_创建界面组件
#define ui_get_widget 图形界面库_获取界面组件
#define ui_widget_resize 图形界面库_调整尺寸界面组件
#define ui_widget_update 图形界面库_更新界面组件
```

## 许可

[MIT](LICENSE)
