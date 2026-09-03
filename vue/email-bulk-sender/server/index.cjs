// 读取项目根目录 .env 中的 SMTP 密钥。这个文件不会提交到 Git。
require('dotenv').config();

// Node.js 自带的文件与路径工具：用来把联系人永久写入本地 JSON 文件。
const fs = require('fs/promises');
const path = require('path');
// Express 负责提供 HTTP API；Nodemailer 负责与 SMTP 邮件服务器通信。
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const port = Number(process.env.PORT || 3001);
const maxRecipients = 50;
const minInterval = Math.max(Number(process.env.SEND_INTERVAL_MS || 1000), 500);
// 联系人数据存放在 server/data/contacts.json；首次运行会自动创建该文件。
const contactsFile = path.join(__dirname, 'data', 'contacts.json');
// 第一次启动时写入的示例数据。example.com 不会用于真实邮件投递。
const defaultContacts = [
  { id: 'contact-1', name: '林晓', email: 'xiaolin@example.com', company: 'Nexa Labs', optedIn: true, status: '准备发送' },
  { id: 'contact-2', name: '陈雨', email: 'yuchen@example.com', company: 'Aster Works', optedIn: true, status: '准备发送' },
  { id: 'contact-3', name: '王晨', email: 'chen.wang@example.com', company: 'Orbit Design', optedIn: false, status: '未授权' },
  { id: 'contact-4', name: '赵宁', email: 'ning.zhao@example.com', company: 'Canvas & Co.', optedIn: true, status: '准备发送' },
];

// 让 Express 自动把请求 JSON 转为 request.body；同时限制请求大小。
app.use(express.json({ limit: '200kb' }));

// 基础邮箱格式检查。实际能否投递仍取决于邮件服务商。
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
// 发送间隔函数，避免短时间内过快地发送大量邮件。
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// 读取联系人文件；如果项目第一次运行、文件不存在，就创建默认联系人。
async function readContacts() {
  try {
    return JSON.parse(await fs.readFile(contactsFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeContacts(defaultContacts);
    return defaultContacts;
  }
}

// 先写入临时文件，再重命名替换正式文件，减少写入中断造成数据损坏的概率。
async function writeContacts(contacts) {
  await fs.mkdir(path.dirname(contactsFile), { recursive: true });
  const temporaryFile = `${contactsFile}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(contacts, null, 2), 'utf8');
  await fs.rename(temporaryFile, contactsFile);
}

// 统一整理并验证来自前端的联系人字段，防止空姓名或错误邮箱写进后台。
function normalizeContact(input) {
  const contact = {
    name: String(input?.name || '').trim(),
    email: String(input?.email || '').trim().toLowerCase(),
    company: String(input?.company || '').trim() || '未填写公司',
    optedIn: input?.optedIn === true,
  };
  if (!contact.name || !isEmail(contact.email)) return null;
  return contact;
}

// 真实发送前检查 SMTP 必填配置。缺少配置时，绝不会尝试发信。
function requireMailConfig() {
  const fields = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const missing = fields.filter((field) => !process.env[field]);
  if (missing.length) throw new Error(`邮件服务尚未配置：缺少 ${missing.join(', ')}`);
}

// 使用 .env 的值创建 SMTP 连接。用户名、密码始终只保存在服务器端。
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// 在每封邮件发送前，替换模板里的变量。
function render(template, recipient, companyName) {
  return String(template)
    .replaceAll('{{companyName}}', companyName)
    .replaceAll('{{firstName}}', recipient.name);
}

// 健康检查：前端或部署平台可用它确认后端是否启动、SMTP 是否已经配置。
app.get('/api/health', (_request, response) => {
  response.json({ ok: true, smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM) });
});

// 读取全部联系人。
app.get('/api/contacts', async (_request, response) => {
  try {
    response.json(await readContacts());
  } catch (error) {
    response.status(500).json({ message: '无法读取联系人。' });
  }
});

// 新增联系人，并拒绝重复的邮箱地址。
app.post('/api/contacts', async (request, response) => {
  try {
    const contact = normalizeContact(request.body);
    if (!contact) return response.status(400).json({ message: '请填写联系人姓名和有效的邮箱地址。' });

    const contacts = await readContacts();
    if (contacts.some((entry) => entry.email === contact.email)) {
      return response.status(409).json({ message: '该邮箱已经存在于联系人列表中。' });
    }
    const newContact = { id: `contact-${Date.now()}`, ...contact, status: contact.optedIn ? '准备发送' : '未授权' };
    contacts.push(newContact);
    await writeContacts(contacts);
    return response.status(201).json(newContact);
  } catch (error) {
    return response.status(500).json({ message: '无法保存联系人。' });
  }
});

// 更新单个联系人。虽然当前页面尚未提供编辑 UI，但这个 API 已准备好供以后使用。
app.patch('/api/contacts/:id', async (request, response) => {
  try {
    const contacts = await readContacts();
    const index = contacts.findIndex((contact) => contact.id === request.params.id);
    if (index === -1) return response.status(404).json({ message: '未找到联系人。' });

    const updated = normalizeContact({ ...contacts[index], ...request.body });
    if (!updated) return response.status(400).json({ message: '联系人信息无效。' });
    if (contacts.some((contact, contactIndex) => contactIndex !== index && contact.email === updated.email)) {
      return response.status(409).json({ message: '该邮箱已经存在于联系人列表中。' });
    }
    contacts[index] = { ...contacts[index], ...updated, status: updated.optedIn ? contacts[index].status : '未授权' };
    await writeContacts(contacts);
    return response.json(contacts[index]);
  } catch (error) {
    return response.status(500).json({ message: '无法更新联系人。' });
  }
});

// 按联系人 ID 删除联系人。
app.delete('/api/contacts/:id', async (request, response) => {
  try {
    const contacts = await readContacts();
    const remainingContacts = contacts.filter((contact) => contact.id !== request.params.id);
    if (remainingContacts.length === contacts.length) return response.status(404).json({ message: '未找到联系人。' });
    await writeContacts(remainingContacts);
    return response.status(204).end();
  } catch (error) {
    return response.status(500).json({ message: '无法删除联系人。' });
  }
});

// 真实发信接口：前端只能传 contactIds，服务器会自行从联系人库取出收件人。
app.post('/api/send-campaign', async (request, response) => {
  try {
    requireMailConfig();
    const { campaignName, companyName, subject, message, contactIds } = request.body || {};
    if (![campaignName, companyName, subject, message].every((value) => typeof value === 'string' && value.trim())) {
      return response.status(400).json({ message: '活动名称、公司名称、主题和正文均为必填项。' });
    }
    if (!Array.isArray(contactIds) || !contactIds.length) {
      return response.status(400).json({ message: '请至少选择一位已授权的联系人。' });
    }
    if (contactIds.length > maxRecipients) {
      return response.status(400).json({ message: `单批最多发送给 ${maxRecipients} 位联系人。` });
    }

    // 不信任浏览器传来的邮箱；以服务器联系人库中的数据为准。
    const contacts = await readContacts();
    const recipients = contacts.filter((contact) => contactIds.includes(contact.id));
    if (recipients.length !== new Set(contactIds).size || recipients.some((contact) => !contact.optedIn || !isEmail(contact.email))) {
      return response.status(400).json({ message: '收件人必须来自后台联系人列表，且已授权接收邮件。' });
    }

    const transporter = createTransporter();
    const results = [];
    // 用 for 循环逐封发送，才能控制发送间隔，并得到每位联系人的发送结果。
    for (let index = 0; index < recipients.length; index += 1) {
      const contact = recipients[index];
      try {
        // Nodemailer 将邮件提交给 SMTP 服务商；服务商接受后会返回 messageId。
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: contact.email,
          replyTo: process.env.EMAIL_REPLY_TO || undefined,
          subject: render(subject, contact, companyName.trim()),
          text: render(message, contact, companyName.trim()),
        });
        results.push({ id: contact.id, success: true, messageId: info.messageId });
        contact.status = 'SMTP 已接受';
        contact.lastSentAt = new Date().toISOString();
      } catch (error) {
        results.push({ id: contact.id, success: false, error: '邮件服务商拒绝或发送失败。' });
        contact.status = '发送失败';
      }
      if (index < recipients.length - 1) await delay(minInterval);
    }

    // 把“SMTP 已接受 / 发送失败”和最近发送时间保存到联系人文件。
    await writeContacts(contacts);
    const sent = results.filter((result) => result.success).length;
    console.info(`Campaign sent: ${campaignName} — ${sent}/${recipients.length} accepted by SMTP provider.`);
    return response.status(200).json({ sent, failed: recipients.length - sent, results });
  } catch (error) {
    console.error('Campaign dispatch failed:', error.message);
    return response.status(500).json({ message: error.message || '发送服务发生未知错误。' });
  }
});

// 启动后端，供 Vue 前端通过 /api 代理访问。
app.listen(port, () => {
  console.log(`Mail API listening on http://localhost:${port}`);
});
