# web3-lulu-bot

请阅读后再使用！！！

- ***该程序只在本地运行，理论上不会传输用户的钱包信息***
- ***如何安全性问题已开发者无关***
- 建议使用非对称加密本地钱包(这个程序也提供对应的加密方法，具体使用bun run cli.ts --help 看看对应的细节)

## 安装运行环境

### MacOS，Linux，WSL 推荐使用Bun

``` shell
echo '安装bun'
curl -fsSL https://bun.sh/install | bash
echo "安装依赖"
bun install
```
### Windows 用NodeJS 以及npm

具体安装方法

- https://nodejs.org/en
- https://www.npmjs.com/

``` shell
npm install
```

## 当前可用命令（注意：下面只用bun来运行，如果是node，只要将bun切换成node即可）

### 挖Celestia

``` shell
bun run cli.ts cias-20  
```
具体配置，在cias/config.toml文件下，按需求修改即可

### 挖IERC-20

``` shell
bun run cli.ts ierc-20  
```
具体配置，在ierc20/config.toml文件下，按需求修改即可

### 挖INJS

``` shell
bun run cli.ts injs  
```
具体配置，在injs/config.toml文件下，按需求修改即可

### 挖SUI

https://www.suimint.io/

``` shell
bun run cli.ts suiIRC  
```
具体配置，在sui/config.toml文件下，按需求修改即可

