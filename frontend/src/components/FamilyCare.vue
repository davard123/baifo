<script setup>
// 祭祖页：拜完之后「叫家人一起来」和「提醒我」。
// 邀请链接不带先人姓名；提醒是浏览器里生成的日历文件，什么都不上传。
import { computed, ref } from 'vue'
import {
  buildIcs, downloadIcs, inviteText, inviteUrl, isWeChat, nextYearly, spokenName, upcomingFestivals,
} from '../utils/familyCare.js'

const props = defineProps({
  slug: { type: String, required: true },
  // 'bar'：舞台上拜完后浮出的小条；'section'：供养面板里的完整版
  variant: { type: String, default: 'section' },
})

const who = computed(() => spokenName(props.slug))
const emit = defineEmits(['close'])
const open = ref('')
const copied = ref(false)
const shareNote = ref('')
const inWeChat = typeof navigator !== 'undefined' && isWeChat()

const festivals = upcomingFestivals()
const picked = ref(Object.fromEntries(festivals.map((f) => [f.key, true])))
const anniversary = ref('')
const remindNote = ref('')

async function invite() {
  open.value = 'invite'
  const text = inviteText(props.slug)
  if (navigator.share && !inWeChat) {
    try {
      await navigator.share({ title: `一起祭拜${who.value}`, text, url: inviteUrl() })
      shareNote.value = '已打开分享，选家人或家人群发送即可。'
      return
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }
  await copy()
}

async function copy() {
  const text = inviteText(props.slug)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const box = document.createElement('textarea')
    box.value = text
    document.body.appendChild(box)
    box.select()
    document.execCommand('copy')
    box.remove()
  }
  copied.value = true
  shareNote.value = '已复制，去微信粘贴给家人或家人群。'
}

function saveReminders() {
  const pageUrl = `${location.origin}${location.pathname}`
  const events = festivals
    .filter((f) => picked.value[f.key])
    .map((f) => ({ date: f.date, title: `${f.label} · 祭拜${who.value}` }))
  if (anniversary.value) {
    events.push({ date: nextYearly(anniversary.value.slice(5)), title: `${who.value}的忌日`, yearly: true })
  }
  if (!events.length) {
    remindNote.value = '请至少选一个日子。'
    return
  }
  downloadIcs(buildIcs(events, pageUrl))
  remindNote.value = '日历文件已生成，打开后选「添加到日历」，到日子前一天上午手机会提醒你。'
}
</script>

<template>
  <section class="family-care" :class="`family-care--${variant}`" aria-label="和家人一起祭拜">
    <template v-if="variant === 'bar'">
      <button type="button" class="fc-close" aria-label="关闭" @click="emit('close')">×</button>
      <p class="fc-lead">心意到了。叫上家里人，一起给{{ who }}上一炷香。</p>
    </template>
    <template v-else>
      <h2 class="fc-title">和家人一起，记得日子</h2>
      <p class="fc-sub">回不了家的家人，也可以点开链接一起上香。忌日、清明、冬至，手机会提前一天提醒你。</p>
    </template>

    <div class="fc-actions">
      <button type="button" class="fc-btn fc-btn--primary" @click="invite">叫家人一起来拜</button>
      <button type="button" class="fc-btn" :aria-expanded="open === 'remind'" @click="open = open === 'remind' ? '' : 'remind'">提醒我</button>
    </div>

    <div v-if="open === 'invite'" class="fc-panel" role="status">
      <p class="fc-preview">{{ inviteText(slug) }}</p>
      <p v-if="shareNote" class="fc-note">{{ shareNote }}</p>
      <p v-if="inWeChat" class="fc-note">也可以点右上角「···」→「发送给朋友」。</p>
      <button v-if="!copied" type="button" class="fc-btn fc-btn--small" @click="copy">复制这段话</button>
    </div>

    <div v-if="open === 'remind'" class="fc-panel">
      <fieldset class="fc-days">
        <legend>到这些日子提醒我</legend>
        <label v-for="f in festivals" :key="f.key">
          <input v-model="picked[f.key]" type="checkbox" /> {{ f.label }}（{{ +f.date.slice(5, 7) }}月{{ +f.date.slice(8) }}日）
        </label>
        <label class="fc-anniv">
          {{ who }}的忌日（公历，每年提醒，可不填）
          <input v-model="anniversary" type="date" />
        </label>
      </fieldset>
      <button type="button" class="fc-btn fc-btn--primary fc-btn--small" @click="saveReminders">加到手机日历</button>
      <p v-if="remindNote" class="fc-note" role="status">{{ remindNote }}</p>
      <p v-if="inWeChat" class="fc-note">微信里不能直接加日历：点右上角「···」选「在浏览器打开」，再点一次。</p>
      <p class="fc-note fc-note--quiet">日子只存在你的手机日历里，网站不记录。</p>
    </div>
  </section>
</template>

<style scoped>
.family-care {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(242, 200, 121, 0.26);
  background: rgba(255, 248, 233, 0.05);
  color: var(--text);
}
.family-care--bar {
  position: absolute;
  left: 50%;
  bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  width: min(440px, calc(100% - 32px));
  z-index: 6;
  background: rgba(24, 17, 12, 0.88);
  backdrop-filter: blur(6px);
  animation: fcIn 0.5s ease both;
}
@keyframes fcIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
.fc-close { position: absolute; top: 4px; right: 8px; width: 32px; height: 32px; border: none; background: none; color: var(--text-muted); font-size: 1.3rem; cursor: pointer; }
.fc-lead { padding: 0 24px; font-size: 0.95rem; color: var(--gold-light); text-align: center; line-height: 1.6; }
.fc-title { font-size: 1.05rem; color: var(--gold-light); }
.fc-sub { font-size: 0.86rem; color: var(--text-muted); line-height: 1.7; }
.fc-actions { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; }
.fc-btn {
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(242, 200, 121, 0.35);
  background: rgba(255, 248, 233, 0.06);
  color: var(--accent);
  font-size: 0.95rem;
  cursor: pointer;
}
.fc-btn--primary { background: linear-gradient(135deg, #e0b76e, #f0d091); border-color: transparent; color: #2a1c0c; font-weight: 600; }
.fc-btn--small { min-height: 38px; font-size: 0.88rem; justify-self: start; }
.fc-panel { display: grid; gap: 8px; padding-top: 4px; }
.fc-preview { font-size: 0.86rem; line-height: 1.7; padding: 10px 12px; border-radius: 10px; background: rgba(0, 0, 0, 0.25); overflow-wrap: anywhere; }
.fc-note { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }
.fc-note--quiet { opacity: 0.8; }
.fc-days { display: grid; gap: 8px; border: none; padding: 0; margin: 0; font-size: 0.9rem; }
.fc-days legend { font-size: 0.86rem; color: var(--text-muted); margin-bottom: 4px; }
.fc-days label { display: flex; align-items: center; gap: 8px; }
.fc-anniv { flex-wrap: wrap; }
.fc-anniv input { min-height: 38px; padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(242, 200, 121, 0.3); background: rgba(255, 248, 233, 0.08); color: var(--text); }
@media (prefers-reduced-motion: reduce) { .family-care--bar { animation: none; } }
</style>
