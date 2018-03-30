# ys-cli

[YS](https://github.com/yskit/ys-mutify) 架构之命令行工具，用来快速创建项目、插件以及快速生成各模块代码的一个工具。它还支持插件的命令行功能，插件能够为琪扩展快速开发功能或者其他功能。

## Install

```shell
npm i ys-cli -g
```

我们不必担心升级的问题，因为工具会自行检测升级，一旦检测到有版本更新，工具会强制自动为您升级。

## Create a new project

```shell
ys new <project_name>
```

工具会提示您选择的框架和使用的路由，您只要按照提示选择即可。

## Create worker module files

我们可以通过命令自动创建各自文件夹下的文件。

如果我们在 `app/controller` 文件夹下

```shell
ys add <new_file> # new_file: 不需要制定文件类型 比如你 `index.js`，那么你直接写 `index`
```

在具体模块文件夹下您不需要写入`-c` `-m` `-s`等文件类型，系统已经自动判断。

这样我们就可以在这里创建一个controller，当然你可以通过明确指定创建类型来创建这个文件。同样的，你可以在项目根目录创建其他模块的文件。

```shell
ys add <new_file> -c # 创建controller文件
ys add <new_file> -m # 创建middleware文件
ys add <new_file> -s # 创建service文件
```

如果您在`app/controller`文件夹下，使用`ys add xxx -s`那么，工具将为您创建在 `app/service`下。

> 注意：该命令只能在项目或者插件文件夹下使用

## Install or uninstall plugin

```shell
ys install <plugin>
ys i <plugin>
ys uninstall <plugin>
ys d <plugin>
ys d
```

当我们需要卸载一个插件，而没有指定插件名的时候，系统将自动为您列出已经安装的插件，您只需要选择卸载即可。

> 注意：该命令只能在项目文件夹下使用

## Create dev Plugin

```bash
ys create <plugin_name>
```

一旦创建，你就是可以在应用中使用`path`来指定到本插件目录进行调试。


## Create plugin commander

我们可以通过插件定义的命令来调用功能。插件需要做的是：

**{root}/.ys.command.js**

```javascript
/**
 * 我们通过导出一个class对象用来描述这个插件运行过程
 * @param thread `object` 单步线程对象
 * @param installer `object` cli工具提供的运行时对象
 */
module.exports = class CommanderModule {
  constructor(thread, installer) {
    this.installer = installer;
    this.thread = thread;
  }

  /**
   * 当我们处于项目文件夹下，我们额外提供给工具的命令支持
   * @param app `object` 模块`cmdu`的全局app对象 see: http://npmjs.com/cmdu
   * @param installer `object` cli工具提供的运行时对象
   */
  static ['command:framework'](app, installer) {
    app.command('test')
      .action(installer.task('../command'));
  }

  /**
   * 嵌入在{project root}/config/plugin.js中的代码
   * 它可以是一个json对象，也可以是一个字符床
   */
  ['options:plugin']() {
    return {
      enable: true,
      package: 'xxxx',
      agent: ['agent'],
      dependencies: []
    };
  }

  /**
   * 自定义安装逻辑
   * @param cwd `string` 项目或者插件根目录地址
   * @param name `string` 插件名称
   * @param cname `string` 插件别名
   */
  async ['life:created']({ cwd }) {}

  /**
   * 自定义卸载逻辑
   * @param cwd `string` 项目或者插件根目录地址
   * @param name `string` 插件名称
   */
  async ['life:destroyed']({ cwd }) {}
}
```

一旦安装了这个插件，那么我们就可以根据他提供的命令运行

```shell
ys test
```

# License

It is [MIT licensed](https://opensource.org/licenses/MIT).