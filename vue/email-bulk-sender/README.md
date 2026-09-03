# Mailflow 批量邮件发送器

这是一个 Vue 前端 + Node.js SMTP 后端的真实邮件发送示例。发件凭据仅由后端读取，浏览器不会获取 SMTP 密码。

## 配置并启动

1. 复制 `.env.example` 为 `.env`，填入邮件服务商提供的 SMTP 信息和**已验证**的 `EMAIL_FROM` 地址。
2. 执行 `npm.cmd install`。
3. 执行 `npm.cmd run dev`，打开 `http://localhost:5174`。

联系人会由后端 API 持久保存在 `server/data/contacts.json`（该文件不会提交到 Git）。页面加载、添加、删除和发送结果都会与后端同步。

## 发送规则

- 仅允许发送给已授权（opt-in）的联系人；服务端会再次验证。
- 单批最多 50 位联系人，默认每封间隔 1 秒；可在 `.env` 中修改 `SEND_INTERVAL_MS`，最低 500ms。
- `{{companyName}}` 和 `{{firstName}}` 会由服务器在每封邮件发送前替换。
- SMTP 服务商“已接受”不等于最终送达；最终状态应以服务商投递报告、退信和退订记录为准。

生产部署时，请使用 HTTPS、数据库保存授权与退订状态、登录权限、审计记录和邮件服务商的退订机制。

## 小白阅读顺序

1. `src/main.js`：Vue 如何启动，并把页面放进 `index.html`。
2. `src/App.vue`：页面的输入框、联系人列表、按钮事件和调用后端的代码。文件内已写有中文注释。
3. `server/index.cjs`：联系人 API、本地数据保存，以及如何通过 SMTP 真实发送邮件。文件内已写有中文注释。
4. `vite.config.js`：为什么浏览器请求 `/api` 能转发给端口 3001 的后端。
5. `src/style.css`：页面外观；已按布局区域添加说明注释。

注意：`package.json` 是严格的 JSON 格式，JSON 规范不允许写注释；各依赖的用途请参考上面的文件说明和 npm 脚本名称。
