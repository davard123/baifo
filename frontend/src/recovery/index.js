import { createRecovery } from './route-recovery.mjs'
export const routeRecovery = createRecovery({
  origin: window.location.origin,
  navigate: url => window.location.assign(url),
})
