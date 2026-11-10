// 听声音找念到哪：David 提词器（teleprompter-app/ScriptAligner.java）的 JS 移植，参数保持一致。
// 识别结果和经文都转成「模糊拼音」再做局部对齐；对不上就返回 -1，位置不动，绝不乱跳。

const TAIL = 10 // 只拿识别结果最后几个字去对
const LOOK_BACK = 12 // 允许往回找几个字（重读）
const LOOK_AHEAD = 60 // 往前找多远（跳读）
const MAX_LOOK_AHEAD = 400 // 连续对不上时逐步放大到这么远（念快了一下超前很多也能追回来）
const WIDEN_EVERY = 8 // 每连续对不上这么多次才放大一档（识别每零点几秒出一次结果，3 次太快，会跳过头）
const NEAR = 0.03 // 离当前位置每远一个字扣的分
const FAR = 0.25 // 超出「这次最多可能念到的地方」后每多一个字再扣的分：经文重复句多，宁可认近处有错字的那句

/** 去声调；平翘舌、前后鼻音、n/l 不分。 */
export function fuzzy(py) {
  let p = String(py || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ü|v/g, 'u')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  if (!p) return ''
  if (/^(zh|ch|sh)/.test(p)) p = p[0] + p.slice(2)
  if (p.startsWith('n')) p = 'l' + p.slice(1)
  if (p.endsWith('ng')) p = p.slice(0, -1)
  return p
}

function sim1(a, b) {
  if (a === b) return 2
  if (a.length > 1 && b.length > 1 && a.slice(1) === b.slice(1)) return 0.5
  return -1.2
}

/** 两个读音集合的相似度；经文里读音待核实的字（空集合）算半对。 */
function sim(hyp, script) {
  if (!script.length) return 0.5
  let best = -Infinity
  for (const a of hyp) for (const b of script) best = Math.max(best, sim1(a, b))
  return best === -Infinity ? -1.2 : best
}

export class SutraAligner {
  /** @param {string[][]} script 每个字可接受的模糊读音 */
  constructor(script) {
    this.script = script
    this.pos = 0 // 已经念到第几个字（不含）
    this.misses = 0 // 连续对不上的次数
  }

  /** 手动点到某一处后，从那里接着对。 */
  seek(i) {
    this.pos = Math.max(0, Math.min(this.script.length, i))
    this.misses = 0
  }

  /**
   * 喂一段识别结果（每个识别出的字的模糊读音集合）。
   * 对上了返回新的位置（已念完的字数），没对上返回 -1。
   * @param {string[][]} hypAll
   */
  feed(hypAll) {
    const h = hypAll.filter((x) => x.length)
    if (h.length < 2 || !this.script.length) return -1
    const hyp = h.slice(-TAIL)
    const m = hyp.length
    const from = Math.max(0, this.pos - LOOK_BACK)
    const ahead = Math.min(MAX_LOOK_AHEAD, LOOK_AHEAD * (1 + Math.floor(this.misses / WIDEN_EVERY)))
    const to = Math.min(this.script.length, this.pos + ahead + m)
    const n = to - from

    // dp[i][j]：识别的前 i 个字对完、经文对到 from+j 为止的最高分；经文里起点随意
    let prev = new Float32Array(n + 1)
    let cur = new Float32Array(n + 1)
    for (let i = 1; i <= m; i++) {
      cur[0] = prev[0] - 1
      for (let j = 1; j <= n; j++) {
        const match = prev[j - 1] + sim(hyp[i - 1], this.script[from + j - 1])
        const skipHyp = prev[j] - 1 // 识别多出来的字
        const skipScript = cur[j - 1] - 0.8 // 漏念或识别漏掉的字
        cur[j] = Math.max(match, skipHyp, skipScript)
      }
      ;[prev, cur] = [cur, prev]
    }

    // 满分每个字 2 分，至少要对上一半左右才算数；够分的里面，挑离当前位置近的
    const need = Math.max(2.5, 0.9 * m)
    let best = -Infinity
    let bestJ = -1
    for (let j = 1; j <= n; j++) {
      if (prev[j] < need) continue
      const end = from + j
      const s = prev[j] - NEAR * Math.abs(end - this.pos) - FAR * Math.max(0, end - this.pos - m)
      if (s > best) {
        best = s
        bestJ = j
      }
    }
    if (bestJ < 0) {
      // 只有三四个字的零碎结果对不上不算数，免得一点杂音就把查找范围放大
      if (m >= 4) this.misses += 1
      return -1
    }
    this.misses = 0
    this.pos = from + bestJ
    return this.pos
  }
}
