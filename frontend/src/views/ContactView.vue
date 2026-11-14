<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { createMessage } from '@/api';
import { useSiteStore } from '@/stores/site';
import PageIntro from '@/components/PageIntro.vue';
import StatusBlock from '@/components/StatusBlock.vue';

const CONTENT_MAX = 1000;
const CONTENT_MIN = 5;
const NAME_MIN = 2;
const NAME_MAX = 30;

const store = useSiteStore();
const copied = ref(false);
let copyTimer = null;

const form = reactive({ name: '', email: '', content: '', website: '' });
const errors = reactive({ name: '', email: '', content: '' });
const submitting = ref(false);
const submitError = ref('');
const submitted = ref(false);

const nameInput = ref(null);
const emailInput = ref(null);
const contentInput = ref(null);

onMounted(() => {
  store.load();
});

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer);
});

const contact = computed(() => store.contact);
const social = computed(() => store.social);
const profile = computed(() => store.profile);
const contentCount = computed(() => Array.from(form.content).length);
const contentNearLimit = computed(() => contentCount.value > CONTENT_MAX - 100);

function clearErrors() {
  errors.name = '';
  errors.email = '';
  errors.content = '';
}

function validate() {
  clearErrors();
  const name = form.name.trim();
  const email = form.email.trim();
  const content = form.content.trim();
  const nameSize = Array.from(name).length;
  const contentSize = Array.from(content).length;

  if (nameSize < NAME_MIN) {
    errors.name = `昵称至少 ${NAME_MIN} 个字符`;
  } else if (nameSize > NAME_MAX) {
    errors.name = `昵称不能超过 ${NAME_MAX} 个字符`;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = '邮箱格式看起来不对';
  }

  if (contentSize < CONTENT_MIN) {
    errors.content = `留言内容至少 ${CONTENT_MIN} 个字符`;
  } else if (contentSize > CONTENT_MAX) {
    errors.content = `留言内容不能超过 ${CONTENT_MAX} 个字符`;
  }

  return !errors.name && !errors.email && !errors.content;
}

async function focusFirstError() {
  await nextTick();
  if (errors.name) nameInput.value?.focus();
  else if (errors.email) emailInput.value?.focus();
  else if (errors.content) contentInput.value?.focus();
}

async function submit() {
  if (submitting.value) return;
  submitError.value = '';

  if (!validate()) {
    await focusFirstError();
    return;
  }

  submitting.value = true;
  try {
    await createMessage({
      name: form.name.trim(),
      email: form.email.trim(),
      content: form.content.trim(),
      website: form.website,
    });
    submitted.value = true;
  } catch (error) {
    // 后端字段级错误（400）直接标在对应输入框下
    if (error.details && typeof error.details === 'object') {
      ['name', 'email', 'content'].forEach((key) => {
        if (error.details[key]) errors[key] = error.details[key];
      });
      await focusFirstError();
    }
    submitError.value = error.message || '提交失败，请稍后再试';
  } finally {
    submitting.value = false;
  }
}

async function resetForm() {
  form.name = '';
  form.email = '';
  form.content = '';
  form.website = '';
  clearErrors();
  submitError.value = '';
  submitted.value = false;
  await nextTick();
  nameInput.value?.focus();
}

async function copyWechat() {
  if (!contact.value.wechat) return;
  try {
    await navigator.clipboard.writeText(contact.value.wechat);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // 非安全上下文或用户拒绝授权时，微信号本身已展示，无需额外处理
    copied.value = false;
  }
}
</script>

<template>
  <div class="container">
    <PageIntro
      eyebrow="Contact"
      title="联系"
      description="不一定要有正事。技术问题、合作想法，或者只是想说声你好，都可以。"
    />

    <div class="contact-grid">
      <section class="contact-main" aria-label="联系方式">
        <StatusBlock
          :loading="store.loading && !store.loaded"
          :error="store.error"
          @retry="store.load(true)"
        >
          <div v-if="contact.email" class="contact-item">
            <p class="label">Email</p>
            <a :href="`mailto:${contact.email}`" class="value value-link">{{ contact.email }}</a>
            <p class="hint">最直接的方式。技术问题附上复现步骤，沟通会快很多。</p>
          </div>

          <div v-if="contact.wechat" class="contact-item">
            <p class="label">微信</p>
            <div class="wechat-row">
              <span class="value">{{ contact.wechat }}</span>
              <button type="button" class="copy-btn" @click="copyWechat">
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
            <p class="hint">添加时请备注来意，方便我通过。</p>
          </div>

          <div v-if="profile.location" class="contact-item">
            <p class="label">坐标</p>
            <p class="value">{{ profile.location }}</p>
            <p class="hint">线上沟通为主，偶尔参加线下技术活动。</p>
          </div>

          <div v-if="social.length" class="social-block">
            <p class="label">在其他地方</p>
            <ul class="social-inline">
              <li v-for="item in social" :key="item.platform">
                <a :href="item.url" target="_blank" rel="noopener noreferrer">
                  {{ item.label }}
                  <span class="social-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>

          <p v-if="contact.note" class="contact-note">{{ contact.note }}</p>

          <p v-if="!contact.email && !contact.wechat" class="contact-note">
            联系方式尚未配置，可在 site_config 表中补充 contact_email / contact_wechat。
          </p>
        </StatusBlock>
      </section>

      <aside class="message-panel" aria-labelledby="message-title">
        <div class="panel-head">
          <p class="panel-eyebrow">Message</p>
          <h2 id="message-title">给站长留言</h2>
          <p class="panel-lead">
            不需要登录。留言会先进入审核队列，不会公开展示；如果留下邮箱，我会尽快回复。
          </p>
        </div>

        <form v-if="!submitted" class="message-form" novalidate @submit.prevent="submit">
          <div class="form-field">
            <label class="form-label" for="message-name">
              <span>昵称 <span class="required" aria-hidden="true">*</span></span>
              <span class="optional">{{ NAME_MIN }}–{{ NAME_MAX }} 字</span>
            </label>
            <input
              id="message-name"
              ref="nameInput"
              v-model="form.name"
              class="input"
              type="text"
              name="name"
              autocomplete="nickname"
              :maxlength="NAME_MAX"
              :aria-invalid="errors.name ? 'true' : 'false'"
              :aria-describedby="errors.name ? 'message-name-error' : undefined"
              placeholder="怎么称呼你？"
            />
            <p v-if="errors.name" id="message-name-error" class="field-error">{{ errors.name }}</p>
          </div>

          <div class="form-field">
            <label class="form-label" for="message-email">
              <span>邮箱 <span class="optional-inline">选填</span></span>
              <span class="optional">只用于回复，不会公开</span>
            </label>
            <input
              id="message-email"
              ref="emailInput"
              v-model="form.email"
              class="input"
              type="email"
              name="email"
              autocomplete="email"
              maxlength="190"
              :aria-invalid="errors.email ? 'true' : 'false'"
              :aria-describedby="errors.email ? 'message-email-error' : undefined"
              placeholder="you@example.com"
            />
            <p v-if="errors.email" id="message-email-error" class="field-error">
              {{ errors.email }}
            </p>
          </div>

          <div class="form-field">
            <label class="form-label" for="message-content">
              <span>留言内容 <span class="required" aria-hidden="true">*</span></span>
              <span class="optional">{{ CONTENT_MIN }}–{{ CONTENT_MAX }} 字</span>
            </label>
            <textarea
              id="message-content"
              ref="contentInput"
              v-model="form.content"
              class="textarea"
              name="content"
              rows="6"
              :maxlength="CONTENT_MAX"
              :aria-invalid="errors.content ? 'true' : 'false'"
              :aria-describedby="errors.content ? 'message-content-error' : undefined"
              placeholder="想聊点什么？项目、技术，或打个招呼。"
            ></textarea>
            <div class="field-foot">
              <span class="field-hint">请勿填写敏感信息</span>
              <span class="counter" :class="{ 'is-near': contentNearLimit }">
                {{ contentCount }} / {{ CONTENT_MAX }}
              </span>
            </div>
            <p v-if="errors.content" id="message-content-error" class="field-error">
              {{ errors.content }}
            </p>
          </div>

          <!-- 蜜罐字段：正常用户看不到，机器人填写后会被静默丢弃 -->
          <div class="hp-field" aria-hidden="true">
            <label for="message-website">Website</label>
            <input
              id="message-website"
              v-model="form.website"
              type="text"
              name="website"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <p v-if="submitError" class="form-alert" role="alert">{{ submitError }}</p>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="submitting">
            {{ submitting ? '发送中…' : '发送留言' }}
          </button>

          <p class="form-note">留言仅用于与站长沟通，不会公开展示。</p>
        </form>

        <div v-else class="success" role="status">
          <span class="success-icon" aria-hidden="true">✓</span>
          <h3>留言已收到</h3>
          <p>已经进入审核队列，不会公开展示。如果留了邮箱，我会尽快回复。</p>
          <button type="button" class="btn btn-ghost" @click="resetForm">再写一条</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
  gap: 64px;
  padding-bottom: 24px;
  align-items: start;
}

.contact-item {
  padding: 28px 0;
  border-bottom: 1px solid var(--line);
}

.contact-item:first-child {
  padding-top: 0;
}

.label {
  margin: 0 0 10px;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.value {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.6vw, 1.8rem);
  color: var(--ink);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.value-link {
  text-decoration: none;
  border-bottom: 1px solid var(--line);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.value-link:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.hint {
  margin: 10px 0 0;
  color: var(--ink-muted);
  font-size: 0.84rem;
  line-height: 1.7;
}

.wechat-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.copy-btn {
  padding: 6px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.copy-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.social-block {
  padding: 28px 0;
  border-bottom: 1px solid var(--line);
}

.social-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.social-inline a {
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.88rem;
  transition: color 0.2s ease;
}

.social-inline a:hover {
  color: var(--accent);
}

.social-arrow {
  color: var(--ink-muted);
  font-size: 0.82em;
}

.contact-note {
  margin: 28px 0 0;
  padding: 20px 22px;
  border-left: 2px solid var(--accent);
  background: var(--surface-soft);
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.85;
}

/* ---------- 留言表单 ---------- */

.message-panel {
  position: sticky;
  top: 104px;
  padding: 30px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.panel-eyebrow {
  margin: 0 0 12px;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.message-panel h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.panel-lead {
  margin: 12px 0 26px;
  color: var(--ink-muted);
  font-size: 0.84rem;
  line-height: 1.75;
}

.form-field {
  margin-bottom: 18px;
}

.form-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 500;
}

.required {
  color: var(--accent);
}

.optional {
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 400;
}

.optional-inline {
  margin-left: 4px;
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-muted);
  font-size: 0.68rem;
  font-weight: 400;
}

.input,
.textarea {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--ink);
  font-size: 0.92rem;
  font-family: inherit;
  /* 聚焦时避开吸顶导航，连字段标签一起留在可视区 */
  scroll-margin-top: 128px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input::placeholder,
.textarea::placeholder {
  color: var(--ink-muted);
  opacity: 0.8;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.input[aria-invalid='true'],
.textarea[aria-invalid='true'] {
  border-color: var(--danger);
}

.input[aria-invalid='true']:focus,
.textarea[aria-invalid='true']:focus {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-soft);
}

.textarea {
  min-height: 148px;
  resize: vertical;
  line-height: 1.75;
}

.field-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.field-hint {
  color: var(--ink-muted);
  font-size: 0.72rem;
}

.counter {
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.counter.is-near {
  color: var(--danger);
}

.field-error {
  margin: 6px 0 0;
  color: var(--danger);
  font-size: 0.76rem;
  line-height: 1.5;
}

.form-alert {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--danger);
  font-size: 0.8rem;
  line-height: 1.6;
}

.submit-btn {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.form-note {
  margin: 12px 0 0;
  color: var(--ink-muted);
  font-size: 0.7rem;
  line-height: 1.6;
  text-align: center;
}

.hp-field {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* ---------- 成功态 ---------- */

.success {
  padding: 18px 0 8px;
  text-align: center;
}

.success-icon {
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.2rem;
}

.success h3 {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 1.35rem;
  color: var(--ink);
}

.success p {
  margin: 0 auto 22px;
  max-width: 34ch;
  color: var(--ink-muted);
  font-size: 0.85rem;
  line-height: 1.75;
  text-wrap: pretty;
}

@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .message-panel {
    position: static;
  }
}

@media (max-width: 560px) {
  .message-panel {
    padding: 22px 20px;
  }
}
</style>
