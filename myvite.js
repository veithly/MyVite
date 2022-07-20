// node 服务器，处理浏览器加载各种资源的请求
// 1. index.html
// 2. js
// 3. vue

// 初始化koa服务器和实例
const fs = require('fs');
const koa =  require('koa');
const path = require('path');
const compilerSFC = require('@vue/compiler-sfc');
const compilerDom = require('@vue/compiler-dom');

const app = new koa();

// 初始化路由
app.use(async ctx => {
    // 首页请求
    const { url, query } = ctx.request;
    if (url === '/') {
        // 加载index.html
        ctx.type = 'text/html';
        ctx.body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf8');
    } else if (url.endsWith('.js')) {
        const p = path.join(__dirname, url);
        // 加载js
        ctx.type = 'application/javascript';
        ctx.body = rewriteImport(fs.readFileSync(p, 'utf8'));
    } else if (url.startsWith('/@modules')) {
        // 裸模块名称
        const moduleName = url.replace('/@modules/', '');
        // 去node_modules中查找
        const prefix = path.join(__dirname, '/node_modules', moduleName);
        // package.json获取module的字段
        const module = require(`${prefix}/package.json`).module;
        const filePath = path.join(prefix, module);
        const ret = fs.readFileSync(filePath, 'utf8');
        // 加载模块
        ctx.type = 'application/javascript';
        ctx.body = rewriteImport(ret);
    } else if (url.indexOf('.vue') > -1) {
        const p = path.join(__dirname, url.split('?')[0]);
        const ret = compilerSFC.parse(fs.readFileSync(p, 'utf8'));
        // query判断
        if (!query.type) {
            // SFC请求
            // 读取VUE文件  并解析
            // 获取vue script部分
            const scriptContent = ret.descriptor.script.content;
            const script = scriptContent.replace('export default', 'const _script = ');
            ctx.type = 'application/javascript';
            ctx.body = `
                ${rewriteImport(script)}
                import { render as _render } from '${url}?type=template';
                _script.render = _render;
                export default _script;
            `
        } else if (query.type === 'template') {
            const tpl = ret.descriptor.template.content;
            const render = compilerDom.compile(tpl, {mode: 'module'}).code;
            ctx.type = 'application/javascript';
            ctx.body = rewriteImport(render);
        }
    } 
});

// 裸模块地址重写
// import xxx from 'vue'
function rewriteImport(content) {
    return content.replace(/ from ['"](.*?)['"]/g, (match, p1) => {
        if (p1.startsWith('/') || p1.startsWith('./') || p1.startsWith('../')) {
            return match;
        } else {
            // 裸模块 替换
            return ` from '/@modules/${p1}'`;
        }
    });
};

// 监听端口
app.listen(3000,() => {
    console.log('myvite server is running at port 3000');
});