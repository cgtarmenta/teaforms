import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/login', name: 'login', component: () => import('./pages/Login.vue') },
  { path: '/403', name: 'forbidden', component: () => import('./pages/Forbidden.vue') },
  {
    path: '/forms',
    name: 'forms',
    component: () => import('./pages/Forms.vue'),
    meta: { requiresAuth: true, roles: ['clinician', 'sysadmin'] },
  },
  {
    path: '/forms/:id',
    name: 'form-builder',
    component: () => import('./pages/FormBuilder.vue'),
    meta: { requiresAuth: true, roles: ['clinician', 'sysadmin'] },
  },
  {
    path: '/episodes',
    name: 'episodes',
    component: () => import('./pages/Episodes.vue'),
    meta: { requiresAuth: true, roles: ['teacher', 'clinician', 'sysadmin'] },
  },
  {
    path: '/episodes/new',
    name: 'episodes-new',
    component: () => import('./pages/EpisodesNew.vue'),
    meta: { requiresAuth: true, roles: ['teacher', 'clinician', 'sysadmin'] },
  },
  {
    path: '/episodes/:id',
    name: 'episode-detail',
    component: () => import('./pages/EpisodeDetail.vue'),
    meta: { requiresAuth: true, roles: ['teacher', 'clinician', 'sysadmin'] },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('./pages/admin/Users.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin'] },
  },
  {
    path: '/admin/analytics',
    name: 'admin-analytics',
    component: () => import('./pages/admin/Analytics.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin'] },
  },
]

export default routes
