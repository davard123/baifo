// 叩拜后浮出的「叫家人一起来」小条：全站只第一次弹一次（不论点没点、关没关），之后不再自动弹；
// 想叫家人的人从抽屉底部的「和家人一起，记得日子」那块点。
const KEY = 'familyBar:shown'
export const FAMILY_BAR_MS = 8000 // 弹出后没人点，约 8 秒自己收起

export function familyBarShown() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markFamilyBarShown() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* 隐私模式：只在本页内不再重复，见各页的 familyBarDismissed */
  }
}
