<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="brand" type="button" @click="goToTranslate">
        <img src="/logo.jpg" alt="ModLocalizer" class="brand-logo" />
        <span>
          <strong>ModLocalizer</strong>
          <small>Minecraft Mod 汉化工作台</small>
        </span>
      </button>

      <div class="page-heading">
        <p class="eyebrow">Mod language pipeline</p>
        <h1>{{ pageTitle }}</h1>
      </div>

      <div class="topbar-actions">
        <button
          class="theme-toggle"
          type="button"
          :class="{ dark: isDark }"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleTheme"
        >
          <span class="toggle-track">
            <span class="toggle-thumb">
              <el-icon>
                <Moon v-if="isDark" />
                <Sunny v-else />
              </el-icon>
            </span>
          </span>
          <span class="toggle-text">{{ isDark ? '深色' : '浅色' }}</span>
        </button>

        <RouterLink class="ghost-link" :to="actionLink.to">
          <el-icon>
            <component :is="actionLink.icon" />
          </el-icon>
          <span>{{ actionLink.label }}</span>
        </RouterLink>
      </div>
    </header>

    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { Document, Moon, Setting, Sunny } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const theme = ref('light');
const isDark = computed(() => theme.value === 'dark');
const themeKey = 'modlocalizer-theme';

const pageTitle = computed(() => {
  if (route.path === '/config') return '模型配置';
  return '翻译任务';
});

const actionLink = computed(() => {
  if (route.path === '/config') {
    return { to: '/translate', label: '翻译任务', icon: Document };
  }
  return { to: '/config', label: 'API 设置', icon: Setting };
});

const goToTranslate = () => {
  router.push('/translate');
};

const applyTheme = (value) => {
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = value;
};

const setTheme = (value) => {
  theme.value = value;
  localStorage.setItem(themeKey, value);
  applyTheme(value);
};

const toggleTheme = () => {
  const nextTheme = isDark.value ? 'light' : 'dark';

  if (document.startViewTransition) {
    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
    return;
  }

  setTheme(nextTheme);
};

applyTheme(theme.value);

onMounted(() => {
  const savedTheme = localStorage.getItem(themeKey);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
});
</script>

<style>
:root {
  --bg: #f5f7fb;
  --panel: #ffffff;
  --panel-soft: #f9fafc;
  --panel-strong: #ffffff;
  --text: #20242c;
  --muted: #687386;
  --border: #dfe5ef;
  --primary: #2563eb;
  --primary-weak: #e8f0ff;
  --accent: #0f766e;
  --accent-weak: #e5f7f4;
  --accent-border: rgba(15, 118, 110, 0.35);
  --warning: #b45309;
  --danger: #dc2626;
  --shadow: 0 16px 44px rgba(32, 36, 44, 0.08);
  --primary-shadow: 0 8px 28px rgba(37, 99, 235, 0.12);
  --icon-shadow: 0 10px 30px rgba(37, 99, 235, 0.12);
  --topbar: rgba(255, 255, 255, 0.9);
  --hover-border: #b9c3d4;
  --table-head: #f3f6fb;
  --code-bg: #eef2f7;
  --code-text: #334155;
  --dropzone-bg: #f8fafc;
  --dropzone-border: #b7c2d4;
  --ease-theme: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease;
}

:root[data-theme="dark"] {
  --bg: #0f172a;
  --panel: #151f32;
  --panel-soft: #1b2740;
  --panel-strong: #101827;
  --text: #e5e7eb;
  --muted: #9aa7bb;
  --border: #2d3a50;
  --primary: #60a5fa;
  --primary-weak: #132b4f;
  --accent: #5eead4;
  --accent-weak: #123b37;
  --accent-border: rgba(94, 234, 212, 0.32);
  --warning: #fbbf24;
  --danger: #f87171;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.34);
  --primary-shadow: 0 10px 30px rgba(96, 165, 250, 0.18);
  --icon-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  --topbar: rgba(15, 23, 42, 0.88);
  --hover-border: #52627a;
  --table-head: #1b2740;
  --code-bg: #0f172a;
  --code-text: #dbeafe;
  --dropzone-bg: #111c2f;
  --dropzone-border: #40506a;
  --el-bg-color: var(--panel);
  --el-bg-color-overlay: var(--panel-strong);
  --el-fill-color-blank: var(--panel);
  --el-fill-color-light: var(--panel-soft);
  --el-fill-color-lighter: var(--panel-soft);
  --el-text-color-primary: var(--text);
  --el-text-color-regular: var(--text);
  --el-text-color-secondary: var(--muted);
  --el-border-color: var(--border);
  --el-border-color-light: var(--border);
  --el-border-color-lighter: var(--border);
  --el-table-header-bg-color: var(--table-head);
  --el-table-row-hover-bg-color: var(--panel-soft);
  --el-mask-color: rgba(15, 23, 42, 0.72);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  transition: var(--ease-theme);
}

button,
input,
textarea {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

#app {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  transition: var(--ease-theme);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  min-height: 88px;
  padding: 16px 32px;
  background: var(--topbar);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px);
  transition: var(--ease-theme);
}

.brand {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: var(--ease-theme), transform 0.2s ease;
}

.brand:hover {
  background: var(--panel-soft);
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 17px;
  line-height: 1.2;
}

.brand small {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}

.page-heading {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.topbar h1 {
  margin: 0;
  font-size: 26px;
  line-height: 1.2;
}

.ghost-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-strong);
  color: var(--text);
  font-weight: 600;
  transition: var(--ease-theme), transform 0.2s ease;
}

.ghost-link:hover {
  border-color: var(--hover-border);
  transform: translateY(-1px);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-strong);
  color: var(--text);
  cursor: pointer;
  font-weight: 700;
  transition: var(--ease-theme), transform 0.2s ease;
}

.theme-toggle:hover {
  border-color: var(--hover-border);
  transform: translateY(-1px);
}

.toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--primary-weak);
  box-shadow: inset 0 0 0 1px var(--border);
  transition: var(--ease-theme);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--primary);
  color: #ffffff;
  font-size: 12px;
  transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.35s ease, color 0.35s ease;
}

.theme-toggle.dark .toggle-thumb {
  transform: translateX(20px);
}

.toggle-text {
  min-width: 30px;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.38s;
  animation-timing-function: ease;
}

.content {
  width: min(1240px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.el-button {
  border-radius: 8px;
  font-weight: 700;
}

.el-input__wrapper,
.el-textarea__inner {
  border-radius: 8px;
  transition: var(--ease-theme);
}

@media (max-width: 900px) {
  .topbar {
    grid-template-columns: 1fr;
    gap: 12px;
    min-height: auto;
    padding: 14px;
  }

  .brand {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .brand-logo {
    width: 44px;
    height: 44px;
  }

  .ghost-link {
    justify-content: center;
  }

  .topbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .theme-toggle,
  .ghost-link {
    width: 100%;
    justify-content: center;
  }

  .content {
    width: 100%;
    padding: 18px 14px 36px;
  }
}
</style>
