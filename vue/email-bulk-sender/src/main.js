// 从 Vue 包中导入 createApp：它负责创建整个 Vue 应用。
import { createApp } from 'vue';
// 导入页面的根组件（所有界面都从 App.vue 开始）。
import App from './App.vue';
// 导入全局 CSS 样式。
import './style.css';

// 把 App 组件挂载到 index.html 中 id 为 app 的元素上。
createApp(App).mount('#app');
