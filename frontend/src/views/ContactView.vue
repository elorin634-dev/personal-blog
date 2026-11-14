<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useSiteStore } from '@/stores/site';
import PageIntro from '@/components/PageIntro.vue';
import StatusBlock from '@/components/StatusBlock.vue';

const store = useSiteStore();
const copied = ref(false);
let copyTimer = null;

onMounted(() => {
  store.load();
});

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer);
});

const contact = computed(() => store.contact);
const social = computed(() => store.social);
const profile = computed(() => store.profile);

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

    <StatusBlock
      :loading="store.loading && !store.loaded"
      :error="store.error"
      @retry="store.load(true)"
    >
      <div class="contact-grid">
        <section class="contact-main" aria-label="联系方式">
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

          <p v-if="contact.note" class="contact-note">{{ contact.note }}</p>

          <p v-if="!contact.email && !contact.wechat" class="contact-note">
            联系方式尚未配置，可在 site_config 表中补充 contact_email / contact_wechat。
          </p>
        </section>

        <aside class="contact-aside">
          <div class="panel">
            <p class="panel-title">在其他地方</p>
            <ul v-if="social.length" class="social-list">
              <li v-for="item in social" :key="item.platform">
                <a :href="item.url" target="_blank" rel="noopener noreferrer">
                  <span>{{ item.label }}</span>
                  <span class="social-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
            <p v-else class="panel-empty">暂未配置社交链接。</p>
          </div>

          <div class="panel panel-coming">
            <span class="badge">Coming soon</span>
            <p class="panel-title">留言板</p>
            <p class="panel-desc">
              v1.0 暂不开放游客留言。数据表与接口设计已预留，后续会在这里加一个不需要登录的留言表单。
            </p>
            <button type="button" class="btn btn-disabled" disabled>留言功能即将开放</button>
          </div>
        </aside>
      </div>
    </StatusBlock>
  </div>
</template>

<style scoped>
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: 64px;
  padding-bottom: 24px;
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

.contact-note {
  margin: 28px 0 0;
  padding: 20px 22px;
  border-left: 2px solid var(--accent);
  background: var(--surface-soft);
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.85;
}

.contact-aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}

.panel-title {
  margin: 0 0 18px;
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--ink);
}

.panel-empty {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.social-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.social-list li + li {
  border-top: 1px solid var(--line);
}

.social-list a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.social-list a:hover {
  color: var(--accent);
}

.social-arrow {
  color: var(--ink-muted);
}

.panel-coming {
  background: var(--surface-soft);
}

.badge {
  display: inline-block;
  margin-bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.panel-desc {
  margin: 0 0 20px;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.8;
}

.btn-disabled {
  width: 100%;
  justify-content: center;
  border-color: var(--line);
  background: var(--surface);
  color: var(--ink-muted);
  opacity: 0.8;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
</style>
