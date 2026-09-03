<script setup>
// computed：根据已有数据自动计算新值；onMounted：页面首次显示后执行；ref：创建响应式数据。
import { computed, onMounted, ref } from 'vue';

// ref(...) 中的数据变化后，Vue 会自动更新页面。JavaScript 中读取/修改它要使用 .value。
// 下面四项是用户在“邮件编辑区”里输入的内容。
const companyName = ref('Northstar Studio');
const campaignName = ref('2026 秋季合作邀请');
const subject = ref('来自 {{companyName}} 的合作邀请');
const message = ref(`你好，{{firstName}}：

我们是 {{companyName}}。我们正在筹备一项新的合作计划，希望邀请你了解更多。

如果你愿意，我们很乐意安排 15 分钟交流，介绍适合你的合作方式。

期待你的回复，
{{companyName}} 团队`);

// 联系人列表的搜索词、发送状态和页面提示文字。
const searchTerm = ref('');
const sendState = ref('idle');
const sendNotice = ref('');
const contactsNotice = ref('');

// 控制“添加联系人”小表单是否显示，以及表单正在填写的数据。
const showAddContact = ref(false);
const newContact = ref({ name: '', email: '', company: '', optedIn: false });

// 联系人不在前端写死：页面加载后会从后端 GET /api/contacts 取得数据。
// selected 只代表本次页面中是否勾选，并不会作为联系人资料永久保存。
const contacts = ref([]);

// 只有“已勾选”且“已授权接收邮件”的联系人，才可以成为真实收件人。
const selectedContacts = computed(() => contacts.value.filter((contact) => contact.selected && contact.optedIn));

// 根据搜索框内容过滤联系人。computed 会在 searchTerm 或 contacts 改变时自动重新计算。
const filteredContacts = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return contacts.value;
  return contacts.value.filter((contact) =>
    [contact.name, contact.email, contact.company].some((value) => value.toLowerCase().includes(keyword)),
  );
});

// 把主题中的公司变量替换为当前输入的公司名，供右侧预览使用。
const resolvedSubject = computed(() => subject.value.replaceAll('{{companyName}}', companyName.value || '你的公司'));

// 预览会取第一位已选择联系人来演示 {{firstName}} 的替换效果。
const previewText = computed(() => message.value
  .replaceAll('{{companyName}}', companyName.value || '你的公司')
  .replaceAll('{{firstName}}', selectedContacts.value[0]?.name || '联系人'));
const previewParagraphs = computed(() => previewText.value.split('\n\n'));

// “全选”只会选中已授权的联系人，未授权联系人始终不能被发送。
function toggleAll(event) {
  contacts.value.forEach((contact) => {
    contact.selected = event.target.checked && contact.optedIn;
    contact.status = contact.selected ? '准备发送' : contact.optedIn ? '未选择' : '未授权';
  });
}

// 从后端载入联系人。后端第一次运行时会自动创建本地 JSON 联系人文件。
async function loadContacts() {
  try {
    const response = await fetch('/api/contacts');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '无法读取联系人。');
    contacts.value = result.map((contact) => ({ ...contact, selected: false }));
    contactsNotice.value = '';
  } catch (error) {
    contactsNotice.value = error.message || '无法连接到联系人服务。';
  }
}

// 删除按钮调用后端 DELETE API；后端成功删除后，再同步更新页面上的数组。
async function removeContact(id) {
  try {
    const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || '无法删除联系人。');
    }
    contacts.value = contacts.value.filter((contact) => contact.id !== id);
  } catch (error) {
    contactsNotice.value = error.message || '无法删除联系人。';
  }
}

// 提交“添加联系人”表单。联系人会先由后端验证姓名、邮箱和重复邮箱，再写入数据文件。
async function addContact() {
  const name = newContact.value.name.trim();
  const email = newContact.value.email.trim();
  if (!name || !email) return;

  try {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact.value),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '无法保存联系人。');
    contacts.value.push({ ...result, selected: false });
    newContact.value = { name: '', email: '', company: '', optedIn: false };
    showAddContact.value = false;
    contactsNotice.value = '';
  } catch (error) {
    contactsNotice.value = error.message || '无法保存联系人。';
  }
}

// 真正的发送动作：前端只传联系人 ID，不直接把任意邮箱交给发送接口。
// 后端会按照 ID 从联系人库读取邮箱，并再次检查该联系人是否已授权。
async function sendCampaign() {
  if (!selectedContacts.value.length) return;
  sendState.value = 'sending';
  sendNotice.value = '';

  try {
    const response = await fetch('/api/send-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignName: campaignName.value,
        companyName: companyName.value,
        subject: subject.value,
        message: message.value,
        // 只发送 ID；这能避免用户通过浏览器修改请求，把邮件发给未保存的地址。
        contactIds: selectedContacts.value.map((contact) => contact.id),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '发送请求失败。');

    // 根据后端返回的每封结果，更新列表中的发送状态。
    result.results.forEach((item) => {
      const contact = contacts.value.find((entry) => entry.id === item.id);
      if (contact) contact.status = item.success ? 'SMTP 已接受' : '发送失败';
    });
    sendState.value = result.failed ? 'partial' : 'sent';
    sendNotice.value = `已提交 ${result.sent} 封${result.failed ? `，${result.failed} 封失败` : ''}。`;
  } catch (error) {
    sendState.value = 'error';
    sendNotice.value = error.message || '无法连接到发送服务。';
  }
}

// Vue 页面刚挂载完成时，立刻请求后端联系人列表。
onMounted(loadContacts);
</script>

<template>
  <!-- 整个页面分为左侧导航栏与右侧工作区。 -->
  <main class="app-shell">
    <!-- 固定在左侧的导航栏：这里只是页面内锚点跳转。 -->
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">✦</span><span>mailflow</span></div>
      <nav aria-label="主菜单">
        <a class="nav-item active" href="#campaign"><span>✉</span> 新建邮件</a>
        <a class="nav-item" href="#contacts"><span>◉</span> 联系人</a>
        <a class="nav-item" href="#preview"><span>▣</span> 模板预览</a>
      </nav>
      <div class="sidebar-tip">
        <span>✓</span>
        <p><b>合规发送</b><br />仅向已获授权的联系人发送邮件。</p>
      </div>
      <div class="profile"><div class="profile-avatar">M</div><div><b>Marketing</b><small>发件人工作区</small></div></div>
    </aside>

    <!-- 右侧主要编辑区域。 -->
    <section class="workspace">
      <header class="topbar">
        <div><p class="breadcrumb">营销活动 / <span>新建批量邮件</span></p><h1>创建邮件活动</h1></div>
        <div class="autosave"><span></span> 已自动保存</div>
      </header>

      <!-- 活动名称与当前已选收件人数量。v-model 会把输入值与 campaignName 双向绑定。 -->
      <section id="campaign" class="campaign-head">
        <div class="campaign-title"><label>活动名称<input v-model="campaignName" /></label><small>保存为草稿后，你可以随时继续编辑。</small></div>
        <div class="campaign-stat"><b>{{ selectedContacts.length }}</b><span>位收件人</span></div>
      </section>

      <!-- 左边是编辑器；右边是根据变量实时更新的邮件预览。 -->
      <div class="editor-grid">
        <section class="panel compose-panel">
          <div class="panel-heading"><div><p class="section-kicker">01 · SENDER</p><h2>发件信息</h2></div><span class="required">必填</span></div>
          <!-- v-model 让输入框内容同步到 companyName；预览和后端都会用它替换变量。 -->
          <label class="field-label">发送公司名称 <span class="hint">变量：&#123;&#123;companyName&#125;&#125;</span>
            <input v-model="companyName" class="text-input" placeholder="例如：Northstar Studio" />
          </label>
          <p class="field-help">此变量会自动替换邮件主题和正文中的 <code>&#123;&#123;companyName&#125;&#125;</code>。</p>

          <div class="divider"></div>
          <div class="panel-heading compact"><div><p class="section-kicker">02 · MESSAGE</p><h2>邮件内容</h2></div></div>
          <label class="field-label">主题<input v-model="subject" class="text-input" /></label>
          <label class="field-label">正文<textarea v-model="message" rows="11"></textarea></label>
          <div class="variable-row"><span>可用变量</span><code>&#123;&#123;firstName&#125;&#125;</code><code>&#123;&#123;companyName&#125;&#125;</code></div>
        </section>

        <section id="preview" class="panel preview-panel">
          <div class="panel-heading"><div><p class="section-kicker">LIVE PREVIEW</p><h2>邮件预览</h2></div><span class="preview-dot">● 实时</span></div>
          <div class="mail-preview">
            <div class="mail-meta"><span>发件人</span><b>{{ companyName || '你的公司' }} &lt;hello@company.com&gt;</b><span>收件人</span><b>{{ selectedContacts[0]?.email || '选择联系人以预览' }}</b></div>
            <div class="mail-subject">{{ resolvedSubject }}</div>
            <!-- v-for 会把每一个正文段落分别显示；:key 帮助 Vue 高效更新列表。 -->
            <p v-for="(paragraph, index) in previewParagraphs" :key="index">{{ paragraph }}</p>
          </div>
          <p class="preview-note">预览使用第一位已选择的联系人数据。</p>
        </section>
      </div>

      <!-- 联系人区域：所有联系人都通过后端 API 读写，而不是只保存在浏览器中。 -->
      <section id="contacts" class="panel contacts-panel">
        <div class="contacts-top"><div><p class="section-kicker">03 · AUDIENCE</p><h2>选择收件人</h2><p>仅向已授权、且未退订的联系人发送。</p></div><button class="secondary-button" @click="showAddContact = !showAddContact">＋ 添加联系人</button></div>
        <p v-if="contactsNotice" class="contacts-error">{{ contactsNotice }}</p>
        <form v-if="showAddContact" class="add-contact" @submit.prevent="addContact"><input v-model="newContact.name" placeholder="联系人姓名" /><input v-model="newContact.email" type="email" placeholder="邮箱地址" /><input v-model="newContact.company" placeholder="所属公司（可选）" /><label class="consent-check"><input v-model="newContact.optedIn" type="checkbox" /> 已获授权</label><button>添加</button></form>
        <div class="contact-tools"><label class="select-all"><input type="checkbox" :checked="contacts.filter((contact) => contact.optedIn).length && contacts.filter((contact) => contact.optedIn).every((contact) => contact.selected)" @change="toggleAll" /> 全选已授权联系人</label><input v-model="searchTerm" class="search-input" placeholder="搜索姓名、邮箱或公司" /></div>
        <!-- v-for 为每位联系人创建一行。未授权时 :disabled 会禁用勾选框。 -->
        <div class="contact-table" role="table"><div class="table-row table-head" role="row"><span></span><span>联系人</span><span>所属公司</span><span>授权状态</span><span>发送状态</span><span></span></div><div v-for="contact in filteredContacts" :key="contact.id" class="table-row" role="row"><span><input v-model="contact.selected" type="checkbox" :disabled="!contact.optedIn" @change="contact.status = contact.selected ? '准备发送' : '未选择'" /></span><span><b>{{ contact.name }}</b><small>{{ contact.email }}</small></span><span>{{ contact.company }}</span><span class="consent-status" :class="{ unauthorized: !contact.optedIn }">{{ contact.optedIn ? '已授权' : '未授权' }}</span><span><i :class="{ muted: !contact.selected, queued: contact.status === 'SMTP 已接受', failed: contact.status === '发送失败' }"></i>{{ contact.status }}</span><span><button class="delete-button" title="删除联系人" @click="removeContact(contact.id)">删除</button></span></div></div>
      </section>

      <!-- 底部发送栏：没有已授权联系人，或正在发送时，按钮会被禁用。 -->
      <footer class="send-bar"><div><b>{{ selectedContacts.length }} 位已授权联系人将收到此邮件</b><span :class="{ 'send-error': sendState === 'error', 'send-success': sendState === 'sent' }">{{ sendNotice || '发送前请确认收件人已授权接收营销邮件。' }}</span></div><button class="send-button" :disabled="!selectedContacts.length || sendState === 'sending'" @click="sendCampaign">{{ sendState === 'sending' ? '正在通过 SMTP 发送…' : sendState === 'sent' ? '发送完成 ✓' : sendState === 'partial' ? '部分发送完成' : '真实发送邮件 →' }}</button></footer>
    </section>
  </main>
</template>
