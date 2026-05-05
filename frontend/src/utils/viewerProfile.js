export function getViewerProfile() {
  const username =
    localStorage.getItem('baifo_username') ||
    localStorage.getItem('bless_name') ||
    localStorage.getItem('ancestor_global_username') ||
    ''

  const age =
    localStorage.getItem('baifo_age') ||
    localStorage.getItem('bless_age') ||
    localStorage.getItem('ancestor_global_age') ||
    ''

  return {
    username: username.trim(),
    age: age ? Number(age) : null,
  }
}

export function saveViewerProfile(username, age) {
  const cleanName = String(username || '').trim()
  const cleanAge = age == null || age === '' ? '' : String(age)

  if (cleanName) {
    localStorage.setItem('baifo_username', cleanName)
    localStorage.setItem('bless_name', cleanName)
    localStorage.setItem('ancestor_global_username', cleanName)
  }

  if (cleanAge) {
    localStorage.setItem('baifo_age', cleanAge)
    localStorage.setItem('bless_age', cleanAge)
    localStorage.setItem('ancestor_global_age', cleanAge)
  }
}
