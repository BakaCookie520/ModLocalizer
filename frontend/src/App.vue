<template>
  <div id="app">
    <el-container>
      <el-header class="modern-header">
        <div class="header-content">
          <div class="header-title" @click="goToTranslate">
            <el-icon class="title-icon"><Box /></el-icon>
            <h1>MCMOD汉化工具</h1>
          </div>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            router
            class="header-menu"
            :collapse="false"
          >
            <el-menu-item index="/config">
              <el-icon><Setting /></el-icon>
              <span>配置</span>
            </el-menu-item>
            <el-menu-item index="/translate">
              <el-icon><Document /></el-icon>
              <span>翻译</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main class="modern-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Box, Setting, Document } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const activeMenu = computed(() => route.path);

const goToTranslate = () => {
  router.push('/translate');
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  background: #ffffff;
}

/* 全局隐藏三个点的折叠菜单 */
.el-sub-menu.el-sub-menu__hide-arrow,
li.el-sub-menu.el-sub-menu__hide-arrow,
li[role="menuitem"].el-sub-menu {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  left: -9999px !important;
}

/* 全局移除菜单项的下边框 */
.el-menu--horizontal .el-menu-item,
.el-menu--horizontal .el-menu-item.is-active {
  border-bottom: none !important;
  border: none !important;
}

.el-menu--horizontal .el-menu-item::after,
.el-menu--horizontal .el-menu-item.is-active::after {
  display: none !important;
  content: none !important;
}

.modern-header {
  background: #ffffff;
  backdrop-filter: blur(10px);
  color: #303133;
  padding: 0;
  height: 70px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-title:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.title-icon {
  font-size: 28px;
  color: #409eff;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-menu {
  background-color: transparent;
  border-bottom: none;
  width: auto !important;
  min-width: auto !important;
  flex: 0 0 auto !important;
}

/* 隐藏菜单的折叠按钮和更多菜单（三个点） */
.header-menu :deep(.el-sub-menu),
.header-menu :deep(.el-sub-menu__hide-arrow),
.header-menu :deep(li.el-sub-menu),
.header-menu :deep(li[role="menuitem"].el-sub-menu),
.header-menu :deep(li.el-sub-menu.el-sub-menu__hide-arrow),
.header-menu :deep(.el-sub-menu__icon-more),
.header-menu :deep(.el-sub-menu__title),
.header-menu :deep(.el-menu--horizontal .el-submenu__icon-arrow),
.header-menu :deep(.el-menu--horizontal .el-menu--collapse),
.header-menu :deep(.el-menu--horizontal .el-menu--collapse .el-submenu__icon-arrow),
.header-menu :deep(.el-menu--horizontal .el-menu--collapse .el-submenu__title),
.header-menu :deep(.el-menu--horizontal .el-menu--collapse .el-submenu) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  left: -9999px !important;
}

/* 确保菜单项正常显示 */
.header-menu :deep(.el-menu--horizontal .el-menu-item) {
  display: inline-flex !important;
}

.header-menu .el-menu-item {
  color: #606266;
  border: none !important;
  border-bottom: none !important;
  transition: all 0.3s ease;
  margin: 0 5px;
  border-radius: 8px 8px 0 0;
}

.header-menu :deep(.el-menu-item) {
  border: none !important;
  border-bottom: none !important;
}

.header-menu :deep(.el-menu-item::after),
.header-menu :deep(.el-menu-item::before) {
  display: none !important;
  content: none !important;
}

.header-menu .el-menu-item:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
  border: none !important;
  border-bottom: none !important;
}

.header-menu .el-menu-item.is-active {
  color: #409eff;
  border: none !important;
  border-bottom: none !important;
  background-color: rgba(64, 158, 255, 0.15);
  font-weight: 500;
}

.header-menu :deep(.el-menu-item.is-active) {
  border: none !important;
  border-bottom: none !important;
}

.header-menu :deep(.el-menu-item.is-active::after),
.header-menu :deep(.el-menu-item.is-active::before) {
  display: none !important;
  content: none !important;
}

.modern-main {
  padding: 30px 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

