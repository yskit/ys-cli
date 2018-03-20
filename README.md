# ys-cli

[YS](https://github.com/yskit/ys-mutify) 架构之命令行工具，用来快速创建项目、插件以及快速生成各模块代码的一个工具。它还支持插件的命令行功能，插件能够为琪扩展快速开发功能或者其他功能。

> 我们可以通过`ys -h`在不同的目录下查看所具有的命令功能。因为根据目录的不同，工具自动提供不能的功能给您，方便您操作，避免您的误操作。

## Install

```shell
npm i ys-cli -g
```

## Create a new project

```shell
ys new <project_name>
```

根据提示创建项目。

## Create worker files

我们可以通过命令自动创建各自文件夹下的文件。

如果我们在 `app/controller` 文件夹下

```shell
ys add <new_file> # new_file: 不需要制定文件类型 比如你 `index.js`，那么你直接写 `index`
```

这样我们就可以在这里创建一个controller，当然你可以通过明确指定创建类型来创建这个文件。同样的，你可以在项目根目录创建其他模块的文件。

```shell
ys add <new_file> -c # 创建controller文件
ys add <new_file> -m # 创建middleware文件
ys add <new_file> -s # 创建service文件
```

## Install or uninstall plugin

```shell
ys install <plugin>
ys i <plugin>
ys uninstall <plugin>
ys d <plugin>
```

## Create plugin commander

我们可以通过插件定义的命令来调用功能。插件需要做的是：

**ys.command.js**

```javascript
exports.command = async ({ app }) => {
  app.command('use <pkg>').action(pkg => {
    // ...
  })
}
```

一旦安装了这个插件，那么我们就可以使用

```shell
ys use koa
```

## Create dev Plugin

```bash
ys create <name>
```

一旦创建，你就是可以在应用中使用`path`来指定到本插件目录进行调试。

# License

It is [MIT licensed](https://opensource.org/licenses/MIT).