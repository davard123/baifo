<script setup>
// 礼佛、求财、祭祖页：拜完之后「叫家人一起来」和「提醒我」。
// 邀请链接不带任何个人信息；提醒是浏览器里生成的日历文件，什么都不上传。
import { computed, ref } from 'vue'
import {
  buildIcs, downloadIcs, inviteCard, inviteText, isWeChat, nextYearly, pageUrl, spokenName, upcomingFestivals,
} from '../utils/familyCare.js'

const props = defineProps({
  // 'ancestor' | 'buddha' | 'qiucai'
  kind: { type: String, default: 'ancestor' },
  slug: { type: String, default: '' },
  // 佛菩萨或财神的名字
  subject: { type: String, default: '' },
  // 'bar'：舞台上拜完后浮出的小条；'section'：面板里的完整版
  variant: { type: String, default: 'section' },
})

const emit = defineEmits(['close'])
const who = computed(() => props.kind === 'ancestor' ? spokenName(props.slug) : (props.subject || '财神'))
const verb = computed(() => props.kind === 'ancestor' ? '祭拜' : '拜')
const lead = computed(() => {
  if (props.kind === 'buddha') return `心香已上。叫上家里人，一起为全家祈一份平安。`
  if (props.kind === 'qiucai') return `财神已拜。叫上家里人一起来，全家都沾沾财气。`
  return `心意到了。叫上家里人，一起给${who.value}上一炷香。`
})
const sub = computed(() => props.kind === 'ancestor'
  ? '回不了家的家人，也可以点开链接一起上香。忌日、清明、冬至，手机会提前一天提醒你。'
  : props.kind === 'qiucai'
    ? '把链接发到家人群，大家都能点开拜一拜。春节、初五迎财神，手机会提前一天提醒你。'
    : '把链接发到家人群，大家都能点开一起礼拜、写祈愿。')
const text = computed(() => inviteText(props.kind, props.slug, props.subject))
const open = ref('')
const copied = ref(false)
const shareNote = ref('')
const inWeChat = typeof navigator !== 'undefined' && isWeChat()

const festivals = upcomingFestivals(props.kind)
const picked = ref(Object.fromEntries(festivals.map((f) => [f.key, true])))
// 自己的日子：忌日、生日、开业纪念日……日期和名字都由访客自己填，可以多加几个
function newCustomDay(first = false) {
  return { date: '', label: first && props.kind === 'ancestor' ? `${spokenName(props.slug)}的忌日` : '', yearly: true }
}
const customDays = ref([newCustomDay(true)])
const customPlaceholder = props.kind === 'ancestor' ? '如：忌日、冥寿' : props.kind === 'qiucai' ? '如：开业纪念日、发薪日' : '如：观音诞、家人生日'
const remindNote = ref('')

const cardSrc = ref('')

async function invite() {
  open.value = 'invite'
  shareNote.value = ''
  if (!cardSrc.value) {
    try {
      cardSrc.value = await inviteCard(props.kind, props.slug, props.subject)
    } catch {
      shareNote.value = '邀请图没生成出来，可以先复制下面这段话发给家人。'
    }
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
  } catch {
    const box = document.createElement('textarea')
    box.value = text.value
    document.body.appendChild(box)
    box.select()
    document.execCommand('copy')
    box.remove()
  }
  copied.value = true
  shareNote.value = '已复制，去微信粘贴给家人或家人群。'
}

function saveReminders() {
  const events = festivals
    .filter((f) => picked.value[f.key])
    .map((f) => ({ date: f.date, title: `${f.label} · ${verb.value}${who.value}` }))
  for (const day of customDays.value) {
    if (!day.date) continue
    const title = day.label.trim() || `${verb.value}${who.value}`
    events.push(day.yearly ? { date: nextYearly(day.date.slice(5)), title, yearly: true } : { date: day.date, title })
  }
  if (!events.length) {
    remindNote.value = '请至少选一个日子。'
    return
  }
  downloadIcs(buildIcs(events, pageUrl()))
  remindNote.value = '日历文件已生成，打开后选「添加到日历」，到日子前一天上午手机会提醒你。'
}
</script>

<template>
  <section class="family-care" :class="`family-care--${variant}`" aria-label="和家人一起">
    <template v-if="variant === 'bar'">
      <button type="button" class="fc-close" aria-label="关闭" @click="emit('close')">×</button>
      <p class="fc-lead">{{ lead }}</p>
    </template>
    <template v-else>
      <h2 class="fc-title">和家人一起，记得日子</h2>
      <p class="fc-sub">{{ sub }}</p>
    </template>

    <div class="fc-actions">
      <button type="button" class="fc-btn fc-btn--primary" @click="invite">叫家人一起来拜</button>
      <button type="button" class="fc-btn" :aria-expanded="open === 'remind'" @click="open = open === 'remind' ? '' : 'remind'">提醒我</button>
    </div>

    <div v-if="open === 'invite'" class="fc-panel" role="status">
      <img v-if="cardSrc" :src="cardSrc" class="fc-card" :alt="`邀请家人一起${verb}${who}的二维码图片`" />
      <p class="fc-note">{{ inWeChat ? '长按上面的图片，选「发送给朋友」或「保存图片」，发到家人群。家人长按二维码就能打开。' : '在手机上长按图片可保存或转发；家人用微信扫码就能打开。' }}</p>
      <div class="fc-row">
        <a v-if="cardSrc && !inWeChat" :href="cardSrc" download="一起来拜-fopusha.png" class="fc-btn fc-btn--small">保存图片</a>
        <button type="button" class="fc-btn fc-btn--small" @click="copy">{{ copied ? '已复制文字' : '复制文字链接' }}</button>
      </div>
      <p v-if="shareNote" class="fc-note">{{ shareNote }}</p>
    </div>

    <div v-if="open === 'remind'" class="fc-panel">
      <fieldset class="fc-days">
        <legend>{{ festivals.length ? '到这些日子提醒我' : '填上你想记住的日子' }}</legend>
        <label v-for="f in festivals" :key="f.key">
          <input v-model="picked[f.key]" type="checkbox" /> {{ f.label }}（{{ +f.date.slice(5, 7) }}月{{ +f.date.slice(8) }}日）
        </label>
        <div v-for="(day, i) in customDays" :key="i" class="fc-custom">
          <input v-model="day.label" type="text" maxlength="20" class="fc-input" :placeholder="customPlaceholder" aria-label="日子的名字" />
          <input v-model="day.date" type="date" class="fc-input" aria-label="日期" />
          <label class="fc-yearly"><input v-model="day.yearly" type="checkbox" /> 每年提醒</label>
        </div>
        <button type="button" class="fc-link" @click="customDays.push(newCustomDay())">＋ 再加一个日子</button>
        <p class="fc-note fc-note--quiet">按公历提醒。农历的日子（如观音诞、农历生日）每年公历不一样，建议不勾「每年提醒」，每年来设一次。</p>
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
.fc-actions { display: flex; gap: 10px; }
.fc-actions .fc-btn { flex: 1; }
.fc-actions .fc-btn--primary { flex: 1.4; }
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
.fc-card { width: min(260px, 100%); justify-self: center; border-radius: 10px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4); }
.fc-row { display: flex; flex-wrap: wrap; gap: 8px; }
.fc-row .fc-btn { display: inline-flex; align-items: center; text-decoration: none; }
.fc-panel { display: grid; gap: 8px; padding-top: 4px; }
.fc-preview { font-size: 0.86rem; line-height: 1.7; padding: 10px 12px; border-radius: 10px; background: rgba(0, 0, 0, 0.25); overflow-wrap: anywhere; }
.fc-note { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }
.fc-note--quiet { opacity: 0.8; }
.fc-days { display: grid; gap: 8px; border: none; padding: 0; margin: 0; font-size: 0.9rem; }
.fc-days legend { font-size: 0.86rem; color: var(--text-muted); margin-bottom: 4px; }
.fc-days label { display: flex; align-items: center; gap: 8px; }
.fc-custom { display: grid; grid-template-columns: 1fr auto; gap: 6px 8px; align-items: center; padding: 8px 0; border-top: 1px dashed rgba(242, 200, 121, 0.2); }
.fc-custom .fc-input:first-child { grid-column: 1 / -1; }
.fc-input { min-height: 38px; padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(242, 200, 121, 0.3); background: rgba(255, 248, 233, 0.08); color: var(--text); font-size: 0.9rem; }
.fc-yearly { font-size: 0.85rem; white-space: nowrap; }
.fc-link { justify-self: start; border: none; background: none; color: var(--accent); font-size: 0.88rem; cursor: pointer; padding: 4px 0; }
@media (prefers-reduced-motion: reduce) { .family-care--bar { animation: none; } }
</style>
