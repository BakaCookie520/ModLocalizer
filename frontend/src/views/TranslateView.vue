<template>
  <div class="translate-view">
    <section class="status-strip">
      <button
        v-for="(step, index) in steps"
        :key="step.title"
        class="step-pill"
        type="button"
        :class="{ active: currentStep === index, done: currentStep > index }"
        :disabled="index > currentStep"
      >
        <span class="step-index">{{ index + 1 }}</span>
        <span>
          <strong>{{ step.title }}</strong>
          <small>{{ step.detail }}</small>
        </span>
      </button>
    </section>

    <section class="task-panel">
      <header class="panel-header">
        <div>
          <p class="eyebrow">{{ activeStep.kicker }}</p>
          <h2>{{ activeStep.heading }}</h2>
        </div>
        <el-button v-if="currentStep > 0" @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>
      </header>

      <FileUpload v-if="currentStep === 0" @upload-success="handleUploadSuccess" />

      <div v-else-if="currentStep === 1" class="mod-picker">
        <el-empty v-if="langFiles.length === 0" description="没有找到可翻译的语言文件" />
        <div v-else class="mod-grid">
          <button
            v-for="langFile in langFiles"
            :key="langFile.modName"
            type="button"
            class="mod-option"
            :class="{ selected: selectedModName === langFile.modName }"
            @click="selectedModName = langFile.modName"
          >
            <span class="mod-icon">
              <el-icon><Document /></el-icon>
            </span>
            <span class="mod-meta">
              <strong>{{ langFile.modName }}</strong>
              <small>{{ langFile.entryCount }} 条待处理文本</small>
            </span>
            <el-icon v-if="selectedModName === langFile.modName" class="selected-icon"><CircleCheck /></el-icon>
          </button>
        </div>

        <footer class="panel-actions">
          <el-button type="primary" size="large" :disabled="!selectedModName" @click="handleLoadLangContent">
            <el-icon><ArrowRight /></el-icon>
            载入语言文件
          </el-button>
        </footer>
      </div>

      <div v-else-if="currentStep === 2" class="translate-stage">
        <div class="metrics">
          <div class="metric">
            <span>当前模块</span>
            <strong>{{ selectedModName }}</strong>
          </div>
          <div class="metric">
            <span>文本条目</span>
            <strong>{{ langEntries.length }}</strong>
          </div>
          <div class="metric">
            <span>状态</span>
            <strong>{{ translating ? '翻译中' : '待开始' }}</strong>
          </div>
        </div>

        <div v-if="translating" class="progress-card">
          <el-progress :percentage="translateProgress" :stroke-width="14" :status="translateProgress === 100 ? 'success' : ''" />
          <span>{{ translateProgressText }}</span>
        </div>

        <div v-else class="ready-box">
          <el-icon><MagicStick /></el-icon>
          <div>
            <h3>已准备好开始翻译</h3>
            <p>系统会把英文 lang 条目发送给已配置的 OpenAI 兼容接口，并返回可编辑的中文结果。</p>
          </div>
          <el-button type="primary" size="large" @click="handleTranslate">
            <el-icon><MagicStick /></el-icon>
            开始翻译
          </el-button>
        </div>
      </div>

      <div v-else class="result-stage">
        <div class="result-summary">
          <el-icon><CircleCheck /></el-icon>
          <div>
            <h3>翻译完成</h3>
            <p>可以继续校对条目。修改后请先点击更新，下载的 Mod 和 Lang 包会包含最新校对内容。</p>
          </div>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            新任务
          </el-button>
        </div>

        <TranslationTable
          :data="translationResult"
          :session-id="sessionId"
          :mod-name="selectedModName"
          @translation-updated="handleTranslationUpdated"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Document,
  MagicStick,
  RefreshLeft
} from '@element-plus/icons-vue';
import FileUpload from '../components/FileUpload.vue';
import TranslationTable from '../components/TranslationTable.vue';
import apiService from '../api';

const currentStep = ref(0);
const sessionId = ref('');
const langFiles = ref([]);
const selectedModName = ref('');
const langEntries = ref([]);
const translationResult = ref([]);
const translating = ref(false);
const translateProgress = ref(0);
const translateProgressText = ref('尚未开始');
let progressTimer = null;

const steps = [
  { title: '上传 Mod', detail: '读取 jar 内语言文件', kicker: 'Step 01', heading: '上传需要汉化的 Mod 文件' },
  { title: '选择模块', detail: '确认要翻译的语言表', kicker: 'Step 02', heading: '选择一个语言文件开始处理' },
  { title: 'AI 翻译', detail: '调用模型生成中文', kicker: 'Step 03', heading: '执行自动翻译' },
  { title: '校对下载', detail: '编辑结果并导出', kicker: 'Step 04', heading: '校对翻译并下载文件' }
];

const activeStep = computed(() => steps[currentStep.value]);

const stopProgressPolling = () => {
  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
};

const pollTranslateProgress = async () => {
  const progress = await apiService.getTranslateProgress(sessionId.value, selectedModName.value);
  translateProgress.value = progress.percentage || 0;
  translateProgressText.value = progress.message || `已处理 ${progress.current || 0}/${progress.total || 0}`;
};

const handleUploadSuccess = (result) => {
  sessionId.value = result.sessionId;
  langFiles.value = result.langFiles || [];
  selectedModName.value = '';
  currentStep.value = 1;
};

const handleLoadLangContent = async () => {
  try {
    const result = await apiService.getLangContent(sessionId.value, selectedModName.value);
    langEntries.value = result.entries || [];
    currentStep.value = 2;
  } catch (error) {
    ElMessage.error(`载入失败：${error.message}`);
  }
};

const handleTranslate = async () => {
  translating.value = true;
  translateProgress.value = 0;
  translateProgressText.value = '准备翻译';
  stopProgressPolling();
  progressTimer = window.setInterval(() => {
    pollTranslateProgress().catch(() => {});
  }, 1000);

  try {
    const result = await apiService.translate(sessionId.value, selectedModName.value);
    await pollTranslateProgress().catch(() => {});
    translationResult.value = result.result || [];
    translateProgress.value = 100;
    translateProgressText.value = `翻译完成，共 ${translationResult.value.length} 条`;
    currentStep.value = 3;
    ElMessage.success('翻译完成');
  } catch (error) {
    ElMessage.error(`翻译失败：${error.message}`);
  } finally {
    stopProgressPolling();
    translating.value = false;
  }
};

const handleTranslationUpdated = (entries) => {
  translationResult.value = entries;
};

const handleBack = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
};

const handleReset = () => {
  stopProgressPolling();
  currentStep.value = 0;
  sessionId.value = '';
  langFiles.value = [];
  selectedModName.value = '';
  langEntries.value = [];
  translationResult.value = [];
  translating.value = false;
  translateProgress.value = 0;
  translateProgressText.value = '尚未开始';
};
</script>

<style scoped>
.translate-view {
  display: grid;
  gap: 18px;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.step-pill {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 78px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--muted);
  text-align: left;
  transition: var(--ease-theme), transform 0.2s ease;
}

.step-pill.active {
  border-color: var(--primary);
  color: var(--text);
  box-shadow: var(--primary-shadow);
}

.step-pill.done {
  border-color: var(--accent-border);
  color: var(--text);
}

.step-index {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--primary-weak);
  color: var(--primary);
  font-weight: 800;
}

.step-pill.done .step-index {
  background: var(--accent-weak);
  color: var(--accent);
}

.step-pill strong,
.step-pill small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-pill strong {
  font-size: 14px;
}

.step-pill small {
  margin-top: 3px;
  font-size: 12px;
}

.task-panel {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
  transition: var(--ease-theme);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.panel-header h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
}

.mod-grid {
  display: grid;
  gap: 10px;
}

.mod-option {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 78px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-soft);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: var(--ease-theme), transform 0.2s ease;
}

.mod-option:hover,
.mod-option.selected {
  border-color: var(--primary);
  background: var(--primary-weak);
}

.mod-icon {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--panel-strong);
  color: var(--primary);
  font-size: 22px;
  transition: var(--ease-theme);
}

.mod-meta strong,
.mod-meta small {
  display: block;
  overflow-wrap: anywhere;
}

.mod-meta small {
  margin-top: 4px;
  color: var(--muted);
}

.selected-icon {
  color: var(--primary);
  font-size: 22px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-soft);
  transition: var(--ease-theme);
}

.metric span,
.metric strong {
  display: block;
}

.metric span {
  color: var(--muted);
  font-size: 13px;
}

.metric strong {
  margin-top: 6px;
  overflow-wrap: anywhere;
  font-size: 20px;
}

.ready-box,
.progress-card,
.result-summary {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-soft);
  transition: var(--ease-theme);
}

.ready-box > .el-icon,
.result-summary > .el-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 26px;
}

.result-summary > .el-icon {
  background: var(--accent-weak);
  color: var(--accent);
}

.ready-box h3,
.result-summary h3 {
  margin: 0 0 5px;
  font-size: 18px;
}

.ready-box p,
.result-summary p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.progress-card {
  grid-template-columns: 1fr;
}

.progress-card span {
  color: var(--muted);
}

.result-stage {
  display: grid;
  gap: 18px;
}

@media (max-width: 900px) {
  .status-strip,
  .metrics {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .ready-box,
  .result-summary {
    grid-template-columns: 1fr;
  }

  .task-panel {
    padding: 18px;
  }
}
</style>
