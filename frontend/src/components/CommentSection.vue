<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { createComment, fetchComments } from '@/api';
import { formatDate } from '@/utils/format';

const CONTENT_MAX = 500;
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 30;
const PAGE_SIZE = 20;

const props = defineProps({
  articleId: { type: Number, required: true },
});

const comments = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(true);
const loadingMore = ref(false);
const listError = ref('');

const submitting = ref(false);
const submitError = ref('');
const postedNotice = ref('');

const form = reactive({ nickname: '', email: '', content: '', website: '' });
const errors = reactive({ nickname: '', email: '', content: '' });

const nicknameInput = ref(null);
const emailInput = ref(null);
const contentInput = ref(null);

let requestToken = 0;
let noticeTimer = null;

const contentCount = computed(() => Array.from(form.content).length);
const hasMore = computed(() => comments.value.length < total.value);

onMounted(() => {
  loadPage(1, false);
});

watch(
  () => props.articleId,
  () => {
    resetList();
    loadPage(1, false);
  }
);

onBeforeUnmount(() => {
  requestToken += 1;
  if (noticeTimer) clearTimeout(noticeTimer);
});

function resetList() {
  comments.value = [];
  total.value = 0;
  page.value = 1;
  listError.value = '';
}

function mergeComments(list) {
  const seen = new Set(comments.value.map((item) => item.id));
  list.forEach((item) => {
    if (!seen.has(item.id)) {
      comments.value.push(item);
      seen.add(item.id);
    }
  });
}

async function loadPage(nextPage, append) {
  const token = ++requestToken;
  if (append) loadingMore.value = true;
  else loading.value = true;
  listError.value = '';

  try {
    const data = await fetchComments(props.articleId, { page: nextPage, pageSize: PAGE_SIZE });
    if (token !== requestToken) return;

    if (append) {
      mergeComments(data.list || []);
    } else {
      comments.value = data.list || [];
    }
    total.value = data.pagination?.total ?? comments.value.length;
    page.value = nextPage;
  } catch (error) {
    if (token !== requestToken) return;
    listError.value = error.message || '评论加载失败，请稍后再试';
  } finally {
    if (token === requestToken) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

function clearErrors() {
  errors.nickname = '';
  errors.email = '';
  errors.content = '';
}

function validate() {
  clearErrors();
  const nickname = form.nickname.trim();
  const email = form.email.trim();
  const content = form.content.trim();
  const nicknameSize = Array.from(nickname).length;
  const contentSize = Array.from(content).length;

  if (nicknameSize < NICKNAME_MIN) {
    errors.nickname = `昵称至少 ${NICKNAME_MIN} 个字符`;
  } else if (nicknameSize > NICKNAME_MAX) {
    errors.nickname = `昵称不能超过 ${NICKNAME_MAX} 个字符`;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = '邮箱格式看起来不对';
  }

  if (contentSize < 1) {
    errors.content = '评论内容不能为空';
  } else if (contentSize > CONTENT_MAX) {
    errors.content = `评论内容不能超过 ${CONTENT_MAX} 个字符`;
  }

  return !errors.nickname && !errors.email && !errors.content;
}

async function focusFirstError() {
  await nextTick();
  if (errors.nickname) nicknameInput.value?.focus();
  else if (errors.email) emailInput.value?.focus();
  else if (errors.content) contentInput.value?.focus();
}

async function submit() {
  if (submitting.value) return;
  submitError.value = '';
  postedNotice.value = '';

  if (!validate()) {
    await focusFirstError();
    return;
  }

  submitting.value = true;
  try {
    const comment = await createComment(props.articleId, {
      nickname: form.nickname.trim(),
      email: form.email.trim(),
      content: form.content.trim(),
      website: form.website,
    });

    // id 为 0 表示蜜罐命中（后端假成功但未入库），不追加到列表
    if (comment?.id && !comments.value.some((item) => item.id === comment.id)) {
      comments.value.push(comment);
      total.value += 1;
    }

    form.content = '';
    postedNotice.value = '评论已发布';
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      postedNotice.value = '';
    }, 4000);

    await nextTick();
    contentInput.value?.focus();
  } catch (error) {
    if (error.details && typeof error.details === 'object') {
      ['nickname', 'email', 'content'].forEach((key) => {
        if (error.details[key]) errors[key] = error.details[key];
      });
      await focusFirstError();
    }
    submitError.value = error.message || '评论发布失败，请稍后再试';
  } finally {
    submitting.value = false;
  }
}

function initialOf(nickname) {
  return Array.from(nickname || '客')[0] || '客';
}
</script>

<template>
  <section class="comments-section" aria-labelledby="comments-title">
    <header class="comments-head">
      <div>
        <p class="eyebrow">Comments</p>
        <h2 id="comments-title">
          评论
          <span class="count">{{ total }}</span>
        </h2>
      </div>
      <p class="head-note">无需登录，提交后立即展示。</p>
    </header>

    <div v-if="listError" class="list-error" role="alert">
      <p>{{ listError }}</p>
      <button type="button" class="text-link" @click="loadPage(1, false)">重新加载</button>
    </div>

    <div v-if="comments.length" class="comment-list">
      <article v-for="comment in comments" :key="comment.id" class="comment">
        <span class="avatar" aria-hidden="true">{{ initialOf(comment.nickname) }}</span>
        <div class="comment-main">
          <div class="comment-meta">
            <span class="nickname">{{ comment.nickname }}</span>
            <time :datetime="comment.createdAt">{{ formatDate(comment.createdAt) }}</time>
          </div>
          <p class="comment-text">{{ comment.content }}</p>
        </div>
      </article>
    </div>

    <p v-else-if="loading" class="comment-status">评论加载中…</p>
    <p v-else-if="!listError" class="comment-status">还没有评论，来说第一句。</p>

    <div v-if="hasMore && !listError" class="load-more">
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="loadingMore"
        @click="loadPage(page + 1, true)"
      >
        {{ loadingMore ? '加载中…' : `加载更多评论（还有 ${total - comments.length} 条）` }}
      </button>
    </div>

    <form class="comment-form" novalidate aria-labelledby="comment-form-title" @submit.prevent="submit">
      <div class="form-head">
        <h3 id="comment-form-title">写下你的评论</h3>
        <p>不需要账号，填写昵称即可。</p>
      </div>

      <div class="field-grid">
        <div class="field">
          <label class="field-label" for="comment-nickname">
            <span>昵称 <span class="required" aria-hidden="true">*</span></span>
          </label>
          <input
            id="comment-nickname"
            ref="nicknameInput"
            v-model="form.nickname"
            class="input"
            type="text"
            name="nickname"
            autocomplete="nickname"
            :maxlength="NICKNAME_MAX"
            :aria-invalid="errors.nickname ? 'true' : 'false'"
            :aria-describedby="errors.nickname ? 'comment-nickname-error' : undefined"
            placeholder="怎么称呼你？"
          />
          <p v-if="errors.nickname" id="comment-nickname-error" class="field-error">
            {{ errors.nickname }}
          </p>
        </div>

        <div class="field">
          <label class="field-label" for="comment-email">
            <span>邮箱 <span class="optional-inline">选填</span></span>
            <span class="optional">不会公开</span>
          </label>
          <input
            id="comment-email"
            ref="emailInput"
            v-model="form.email"
            class="input"
            type="email"
            name="email"
            autocomplete="email"
            maxlength="190"
            :aria-invalid="errors.email ? 'true' : 'false'"
            :aria-describedby="errors.email ? 'comment-email-error' : undefined"
            placeholder="you@example.com"
          />
          <p v-if="errors.email" id="comment-email-error" class="field-error">
            {{ errors.email }}
          </p>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="comment-content">
          <span>评论内容 <span class="required" aria-hidden="true">*</span></span>
          <span class="counter">{{ contentCount }} / {{ CONTENT_MAX }}</span>
        </label>
        <textarea
          id="comment-content"
          ref="contentInput"
          v-model="form.content"
          class="textarea"
          name="content"
          rows="4"
          :maxlength="CONTENT_MAX"
          :aria-invalid="errors.content ? 'true' : 'false'"
          :aria-describedby="errors.content ? 'comment-content-error' : undefined"
          placeholder="说说你的看法，保持友善。"
        ></textarea>
        <p v-if="errors.content" id="comment-content-error" class="field-error">
          {{ errors.content }}
        </p>
      </div>

      <!-- 蜜罐字段：正常用户看不到 -->
      <div class="hp-field" aria-hidden="true">
        <label for="comment-website">Website</label>
        <input
          id="comment-website"
          v-model="form.website"
          type="text"
          name="website"
          tabindex="-1"
          autocomplete="off"
        />
      </div>

      <p v-if="submitError" class="form-alert" role="alert">{{ submitError }}</p>

      <div class="form-actions">
        <p class="form-note">邮箱仅用于后续联系，不会展示在页面上。</p>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '发布中…' : '发布评论' }}
        </button>
      </div>

      <p v-if="postedNotice" class="form-success" role="status">
        <span aria-hidden="true">✓</span> {{ postedNotice }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.comments-section {
  margin-top: 56px;
  padding-top: 40px;
  border-top: 1px solid var(--line);
}

.comments-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.comments-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 600;
  color: var(--ink);
}

.count {
  margin-left: 6px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--ink-muted);
  vertical-align: middle;
}

.head-note {
  margin: 0 0 4px;
  color: var(--ink-muted);
  font-size: 0.78rem;
}

.comment-list {
  display: flex;
  flex-direction: column;
}

.comment {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 14px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}

.avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 0.95rem;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
}

.nickname {
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 600;
}

.comment-meta time {
  color: var(--ink-muted);
  font-size: 0.72rem;
}

.comment-meta time::before {
  content: '·';
  margin-right: 8px;
  color: var(--line);
}

.comment-text {
  margin: 6px 0 0;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-status {
  margin: 0;
  padding: 24px 0;
  color: var(--ink-muted);
  font-size: 0.88rem;
}

.list-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
}

.list-error p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 22px 0 6px;
}

/* ---------- 表单 ---------- */

.comment-form {
  margin-top: 34px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}

.form-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.form-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ink);
}

.form-head p {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.75rem;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  margin-bottom: 16px;
}

.field-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  font-weight: 500;
}

.required {
  color: var(--accent);
}

.optional {
  color: var(--ink-muted);
  font-size: 0.7rem;
  font-weight: 400;
}

.optional-inline {
  margin-left: 4px;
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-muted);
  font-size: 0.66rem;
  font-weight: 400;
}

.counter {
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 400;
}

.input,
.textarea {
  width: 100%;
  padding: 10px 13px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--bg);
  color: var(--ink);
  font-size: 0.9rem;
  font-family: inherit;
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
  min-height: 108px;
  resize: vertical;
  line-height: 1.7;
}

.field-error {
  margin: 6px 0 0;
  color: var(--danger);
  font-size: 0.74rem;
  line-height: 1.5;
}

.form-alert {
  margin: 0 0 14px;
  padding: 9px 12px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--danger);
  font-size: 0.79rem;
  line-height: 1.6;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.form-note {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.7rem;
  line-height: 1.6;
}

.form-success {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  color: var(--accent);
  font-size: 0.78rem;
}

.hp-field {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@media (max-width: 720px) {
  .comments-section {
    margin-top: 40px;
    padding-top: 28px;
  }

  .comments-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .head-note {
    margin: 0;
  }

  .comment-form {
    padding: 18px;
  }

  .field-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions .btn {
    justify-content: center;
  }
}
</style>
