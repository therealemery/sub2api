<template>
  <aside
    class="sidebar w-64"
    :class="{ '-translate-x-full lg:translate-x-0': !mobileOpen }"
  >
    <!-- Logo/Brand -->
    <div class="sidebar-header" :class="{ 'sidebar-header-collapsed': sidebarCollapsed }">
      <!-- Custom Logo or Default Logo -->
      <div class="sidebar-logo flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg">
        <img :src="siteLogoPath" alt="Logo" class="site-logo-img" />
      </div>
      <div class="sidebar-brand" :class="{ 'sidebar-brand-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">
        <span class="sidebar-brand-title text-lg font-bold text-gray-900">
          {{ siteName }}
        </span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav scrollbar-hide">
      <!-- Admin View: Admin menu first, then personal menu -->
      <template v-if="isAdmin">
        <!-- Admin Section -->
        <div class="sidebar-section">
          <template v-for="item in adminNavItems" :key="item.path">
            <!-- Collapsible group (has children) -->
            <template v-if="item.children?.length">
              <button
                type="button"
                class="sidebar-link mb-1 w-full"
                :class="{
                  'sidebar-link-active': isGroupActive(item) && !isGroupExpanded(item),
                  'sidebar-link-collapsed': sidebarCollapsed
                }"
                :title="sidebarCollapsed ? item.label : undefined"
                @click="handleGroupClick(item)"
              >
                <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
                <span
                  class="sidebar-label sidebar-label-flex"
                  :class="{ 'sidebar-label-collapsed': sidebarCollapsed }"
                  :aria-hidden="sidebarCollapsed ? 'true' : 'false'"
                >
                  <span class="min-w-0 truncate">{{ item.label }}</span>
                  <ChevronDownIcon
                    class="h-4 w-4 flex-shrink-0 transition-transform duration-200"
                    :class="isGroupExpanded(item) ? 'rotate-180' : ''"
                  />
                </span>
              </button>
              <!-- Children -->
              <div v-if="!sidebarCollapsed && isGroupExpanded(item)" class="mb-1 ml-4 pl-2">
                <router-link
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  class="sidebar-link mb-0.5 py-1.5 text-sm"
                  :class="{ 'sidebar-link-active': route.path === child.path }"
                  @click="handleMenuItemClick(child.path)"
                >
                  <component :is="child.icon" class="h-4 w-4 flex-shrink-0" />
                  <span>{{ child.label }}</span>
                </router-link>
              </div>
            </template>
            <!-- Normal item (no children) -->
            <router-link
              v-else
              :to="item.path"
              class="sidebar-link mb-1"
              :class="{ 'sidebar-link-active': isActive(item.path), 'sidebar-link-collapsed': sidebarCollapsed }"
              :title="sidebarCollapsed ? item.label : undefined"
              :id="
                item.path === '/admin/accounts'
                  ? 'sidebar-channel-manage'
                  : item.path === '/admin/groups'
                    ? 'sidebar-group-manage'
                    : item.path === '/admin/redeem'
                      ? 'sidebar-wallet'
                      : undefined
              "
              :data-tour="getSidebarTourId(item.path)"
              @click="handleMenuItemClick(item.path)"
            >
              <span v-if="item.iconSvg" class="h-5 w-5 flex-shrink-0 sidebar-svg-icon" v-html="sanitizeSvg(item.iconSvg)"></span>
              <component v-else :is="item.icon" class="h-5 w-5 flex-shrink-0" />
              <span class="sidebar-label" :class="{ 'sidebar-label-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">{{ item.label }}</span>
            </router-link>
          </template>
        </div>

        <!-- Personal Section for Admin (hidden in simple mode) -->
        <div v-if="!authStore.isSimpleMode" class="sidebar-section">
          <div class="sidebar-section-title" :class="{ 'sidebar-section-title-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">
            <span class="sidebar-section-title-text" :class="{ 'sidebar-section-title-text-collapsed': sidebarCollapsed }">
              {{ t('nav.myAccount') }}
            </span>
          </div>

          <router-link
            v-for="item in personalNavItems"
            :key="item.path"
            :to="item.path"
            class="sidebar-link mb-1"
            :class="{ 'sidebar-link-active': isActive(item.path), 'sidebar-link-collapsed': sidebarCollapsed }"
            :title="sidebarCollapsed ? item.label : undefined"
            :data-tour="getSidebarTourId(item.path)"
            @click="handleMenuItemClick(item.path)"
          >
            <span v-if="item.iconSvg" class="h-5 w-5 flex-shrink-0 sidebar-svg-icon" v-html="sanitizeSvg(item.iconSvg)"></span>
            <component v-else :is="item.icon" class="h-5 w-5 flex-shrink-0" />
            <span class="sidebar-label" :class="{ 'sidebar-label-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">{{ item.label }}</span>
          </router-link>
        </div>
      </template>

      <!-- Regular User View -->
      <template v-else-if="!appStore.backendModeEnabled">
        <div class="sidebar-section">
          <router-link
            v-for="item in userNavItems"
            :key="item.path"
            :to="item.path"
            class="sidebar-link mb-1"
            :class="{ 'sidebar-link-active': isActive(item.path), 'sidebar-link-collapsed': sidebarCollapsed }"
            :title="sidebarCollapsed ? item.label : undefined"
            :data-tour="getSidebarTourId(item.path)"
            @click="handleMenuItemClick(item.path)"
          >
            <span v-if="item.iconSvg" class="h-5 w-5 flex-shrink-0 sidebar-svg-icon" v-html="sanitizeSvg(item.iconSvg)"></span>
            <component v-else :is="item.icon" class="h-5 w-5 flex-shrink-0" />
            <span class="sidebar-label" :class="{ 'sidebar-label-collapsed': sidebarCollapsed }" :aria-hidden="sidebarCollapsed ? 'true' : 'false'">{{ item.label }}</span>
          </router-link>
        </div>
      </template>
    </nav>

    <!-- Bottom Section -->
    <div class="sidebar-footer mt-auto border-t border-gray-100 p-3 border-[var(--border-default)]">
      <router-link
        to="/docs"
        class="sidebar-link sidebar-doc-link w-full"
        :class="{ 'sidebar-link-active': isActive('/docs') }"
        @click="handleMenuItemClick('/docs')"
      >
        <component :is="SidebarDocsIcon" class="h-5 w-5 flex-shrink-0" />
        <span class="sidebar-label">{{ t('nav.docs') }}</span>
      </router-link>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <transition name="fade">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="closeMobile"
    ></div>
  </transition>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminSettingsStore, useAppStore, useAuthStore, useOnboardingStore } from '@/stores'
import { sanitizeSvg } from '@/utils/sanitize'
import { resolveSiteLogoPath } from '@/constants/branding'

interface NavItem {
  path: string
  label: string
  icon: unknown
  iconSvg?: string
  hideInSimpleMode?: boolean
  children?: NavItem[]
  /**
   * When true, the parent item only toggles the expand/collapse state and
   * does NOT navigate to its `path`. The `path` is purely a stable key.
   */
  expandOnly?: boolean
}

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()
const adminSettingsStore = useAdminSettingsStore()

const sidebarCollapsed = computed(() => false)
const mobileOpen = computed(() => appStore.mobileOpen)
const isAdmin = computed(() => authStore.isAdmin)

// Track which parent nav groups are expanded
const expandedGroups = ref<Set<string>>(new Set())

// Site settings from appStore (cached, no flicker)
const siteName = computed(() => appStore.siteName)
const siteLogoPath = computed(() => resolveSiteLogoPath(appStore.siteLogo))

const SIDEBAR_ICON_MAIN = 'var(--sidebar-icon-main)'
const SIDEBAR_ICON_ACCENT = 'var(--sidebar-icon-accent)'

interface SidebarIconPath {
  d: string
  accent?: boolean
}

function makeSidebarIcon(paths: SidebarIconPath[]) {
  return {
    render: () =>
      h(
        'svg',
        {
          fill: 'none',
          viewBox: '0 0 24 24',
          'aria-hidden': 'true',
        },
        paths.map((path) =>
          h('path', {
            d: path.d,
            stroke: path.accent ? SIDEBAR_ICON_ACCENT : SIDEBAR_ICON_MAIN,
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            fill: 'none',
          })
        )
      ),
  }
}

const SidebarDashboardIcon = makeSidebarIcon([
  { d: 'M5 4.5h4.4c.35 0 .6.25.6.6v4.3c0 .35-.25.6-.6.6H5.1c-.35 0-.6-.25-.6-.6V5.1c0-.35.25-.6.5-.6zM14.6 4.5H19c.35 0 .6.25.6.6v4.3c0 .35-.25.6-.6.6h-4.3c-.35 0-.6-.25-.6-.6V5.1c0-.35.25-.6.5-.6zM5 14h4.4c.35 0 .6.25.6.6V19c0 .35-.25.6-.6.6H5.1c-.35 0-.6-.25-.6-.6v-4.3c0-.45.25-.7.5-.7z' },
  { d: 'M14.6 14H19c.35 0 .6.25.6.6V19c0 .35-.25.6-.6.6h-4.3c-.35 0-.6-.25-.6-.6v-4.3c0-.45.25-.7.5-.7z', accent: true },
])

const SidebarOpsIcon = makeSidebarIcon([
  { d: 'M3.5 12h3.2l2.2-5.1 4.2 10.2 2.5-5.1h2.3' },
  { d: 'M20 12h.1', accent: true },
])

const SidebarUsersIcon = makeSidebarIcon([
  { d: 'M8.4 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zM3.4 19.2c.2-3.2 2.2-5.2 5-5.2 1.7 0 3 .65 3.85 1.85' },
  { d: 'M16.5 11.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4zM14.3 14.5c2.9.15 4.75 1.9 5 4.7', accent: true },
])

const SidebarGroupIcon = makeSidebarIcon([
  { d: 'M3.8 8.2h6.45l1.55 1.7h8.4c.55 0 1 .45 1 1v7.3c0 .55-.45 1-1 1H3.8c-.55 0-1-.45-1-1v-9c0-.55.45-1 1-1zM3 12.2h18' },
  { d: 'M6.2 12.2h4.5', accent: true },
])

const SidebarChannelIcon = makeSidebarIcon([
  { d: 'M7.2 12H13M15.8 7.2l-2.8 2.2M15.8 16.8 13 14.6M18.5 5.6a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zM18.5 14.2a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2z' },
  { d: 'M5.1 9.9a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2z', accent: true },
])

const SidebarSubscriptionIcon = makeSidebarIcon([
  { d: 'M4.6 6.4h14.8c.55 0 1 .45 1 1v9.2c0 .55-.45 1-1 1H4.6c-.55 0-1-.45-1-1V7.4c0-.55.45-1 1-1zM3.8 9.7h16.4' },
  { d: 'M6.3 14.2h3.1', accent: true },
])

const SidebarAccountIcon = makeSidebarIcon([
  { d: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM3.9 12h16.2M12 3.5c2.15 2.25 3.2 5.1 3.2 8.5s-1.05 6.25-3.2 8.5M12 3.5C9.85 5.75 8.8 8.6 8.8 12s1.05 6.25 3.2 8.5' },
  { d: 'M18.2 7.2c1.2 1.35 1.9 3 1.9 4.8', accent: true },
])

const SidebarBellIcon = makeSidebarIcon([
  { d: 'M6.2 16.6h11.6l-1.3-1.8V10a4.5 4.5 0 0 0-9 0v4.8l-1.3 1.8zM10 19.1c.45.55 1.15.9 2 .9s1.55-.35 2-.9M12 4.3V3.4' },
  { d: 'M12 17.8v1.3', accent: true },
])

const SidebarProxyIcon = makeSidebarIcon([
  { d: 'M12 3.8 18.8 6v5.5c0 4.1-2.45 7-6.8 8.7-4.35-1.7-6.8-4.6-6.8-8.7V6L12 3.8z' },
  { d: 'M8.9 12h6.2M9.1 9.2v5.6M14.9 9.2v5.6', accent: true },
])

const SidebarTicketIcon = makeSidebarIcon([
  { d: 'M4.2 7.4h15.6c.55 0 1 .45 1 1v2.2a2.2 2.2 0 0 0 0 2.8v2.2c0 .55-.45 1-1 1H4.2c-.55 0-1-.45-1-1v-2.2a2.2 2.2 0 0 0 0-2.8V8.4c0-.55.45-1 1-1zM14.8 9.2h2.2M14.8 14.8h2.2' },
  { d: 'M9.4 8.7v6.6', accent: true },
])

const SidebarPromoIcon = makeSidebarIcon([
  { d: 'M4.4 10h15.2v8.4c0 .55-.45 1-1 1H5.4c-.55 0-1-.45-1-1V10zM3.8 7.2h16.4c.45 0 .8.35.8.8v2H3V8c0-.45.35-.8.8-.8z' },
  { d: 'M12 7.2v12.2M9.2 7.2c-.9-1-.9-2.2-.15-2.8.9-.7 2.25.15 2.95 2.8M14.8 7.2c.9-1 .9-2.2.15-2.8-.9-.7-2.25.15-2.95 2.8M9.2 15.8l5.6-4.6M9.8 11.3h.1M14.1 15.7h.1', accent: true },
])

const SidebarGiftIcon = makeSidebarIcon([
  { d: 'M4.4 10h15.2v8.4c0 .55-.45 1-1 1H5.4c-.55 0-1-.45-1-1V10zM3.8 7.2h16.4c.45 0 .8.35.8.8v2H3V8c0-.45.35-.8.8-.8z' },
  { d: 'M12 7.2v12.2M9.2 7.2c-.9-1-.9-2.2-.15-2.8.9-.7 2.25.15 2.95 2.8M14.8 7.2c.9-1 .9-2.2.15-2.8-.9-.7-2.25.15-2.95 2.8', accent: true },
])

const SidebarOrderIcon = makeSidebarIcon([
  { d: 'M7 3.8h10l1.2 1.4L19.4 4v16.2l-1.2-1.2-1.2 1.2-1.2-1.2-1.2 1.2-1.2-1.2-1.2 1.2-1.2-1.2-1.2 1.2-1.2-1.2-1.2 1.2V4l1.2 1.2L7 3.8zM8.5 10h7M8.5 15h4.5' },
  { d: 'M8.5 12.5h5.2', accent: true },
])

const SidebarUsageIcon = makeSidebarIcon([
  { d: 'M5.1 13.4h2.8c.35 0 .6.25.6.6v4.4c0 .35-.25.6-.6.6H5.1c-.35 0-.6-.25-.6-.6V14c0-.35.25-.6.6-.6zM10.6 9.6h2.8c.35 0 .6.25.6.6v8.2c0 .35-.25.6-.6.6h-2.8c-.35 0-.6-.25-.6-.6v-8.2c0-.35.25-.6.6-.6z' },
  { d: 'M16.1 5h2.8c.35 0 .6.25.6.6v12.8c0 .35-.25.6-.6.6h-2.8c-.35 0-.6-.25-.6-.6V5.6c0-.35.25-.6.6-.6z', accent: true },
])

const SidebarSettingsIcon = makeSidebarIcon([
  { d: 'M12 3.7 13.2 6c.45.15.85.35 1.25.55L17 5.8l1.5 2.6-1.8 1.7c.05.3.1.6.1.9s-.05.6-.1.9l1.8 1.7-1.5 2.6-2.55-.75c-.4.25-.8.4-1.25.55L12 20.3 10.8 18c-.45-.15-.85-.35-1.25-.55L7 18.2l-1.5-2.6 1.8-1.7c-.05-.3-.1-.6-.1-.9s.05-.6.1-.9L5.5 8.4 7 5.8l2.55.75c.4-.25.8-.4 1.25-.55L12 3.7z' },
  { d: 'M12 9.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z', accent: true },
])

const SidebarKeyIcon = makeSidebarIcon([
  { d: 'M14.8 8.2a3.9 3.9 0 1 1-2.1 3.45L5.2 19.2H3.5v-2.1h2.1V15h2.1l3.55-3.55' },
  { d: 'M16.3 7.1h.1', accent: true },
])

const SidebarDocsIcon = makeSidebarIcon([
  { d: 'M5.4 4.2h9.8c1.9 0 3.4 1.5 3.4 3.4v12.2H8.8a3.4 3.4 0 0 1-3.4-3.4V4.2zM8.8 19.8a3.4 3.4 0 0 1 0-6.8h9.8' },
  { d: 'M9 8.1h5.8M9 10.9h4.2', accent: true },
])

const SidebarSignalIcon = makeSidebarIcon([
  { d: 'M7.5 16.8a6.8 6.8 0 0 1 0-9.6M16.5 7.2a6.8 6.8 0 0 1 0 9.6M5 19.2a10.3 10.3 0 0 1 0-14.4M19 4.8a10.3 10.3 0 0 1 0 14.4' },
  { d: 'M12 12h.1', accent: true },
])

const SidebarRechargeIcon = makeSidebarIcon([
  { d: 'M5 6.3h14c.55 0 1 .45 1 1v9.4c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V7.3c0-.55.45-1 1-1zM4.2 9.4h15.6M8.4 14.7h4.8' },
  { d: 'm15.5 12.6 2 2-2 2M17.5 14.6h-3.8', accent: true },
])

const SidebarProfileIcon = makeSidebarIcon([
  { d: 'M12 11.1a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM4.7 20.1c.3-4.2 3.1-6.4 7.3-6.4 2.55 0 4.6.8 5.85 2.35' },
  { d: 'M19.3 20.1c-.15-1.75-.65-3.05-1.45-4.05', accent: true },
])

const SidebarAffiliateIcon = makeSidebarIcon([
  { d: 'M8.2 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 19.4c.25-3.1 1.9-4.9 4.2-4.9M15.8 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  { d: 'M19.9 19.4c-.25-3.1-1.9-4.9-4.1-4.9M8.2 14.5c2 0 3.25 1.1 3.8 3.2', accent: true },
])

const SidebarPriceTagIcon = makeSidebarIcon([
  { d: 'M4.2 5.3h6.1c.45 0 .85.18 1.15.48l8.05 8.05c.4.4.4 1.05 0 1.45l-4.2 4.2c-.4.4-1.05.4-1.45 0L5.8 11.45a1.6 1.6 0 0 1-.48-1.15V4.2' },
  { d: 'M8.2 8.2h.1', accent: true },
])

const ChevronDownIcon = {
  render: () =>
    h(
      'svg',
      { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          d: 'm19.5 8.25-7.5 7.5-7.5-7.5'
        })
      ]
    )
}

// buildSelfNavItems 构造用户自己的导航项（用户端主菜单和管理员的"我的账户"子菜单共享这组声明）。
// withDashboard=true 时包含用户仪表盘。管理员也是用户，所以个人区同样显示完整用户入口。
//
// 条目顺序：模型 → 密钥 → 用量 → 可用模型 → 模型状态 → 套餐/积分 → 兑换/资料。
// 可用模型紧挨模型状态之上，让用户先看自己能用什么，再看对应状态。
function buildSelfNavItems(withDashboard: boolean): NavItem[] {
  const items: NavItem[] = []
  if (withDashboard) {
    items.push({ path: '/dashboard', label: t('nav.dashboard'), icon: SidebarDashboardIcon })
  }
  items.push(
    { path: '/models', label: t('nav.modelPricing'), icon: SidebarPriceTagIcon, hideInSimpleMode: true },
    { path: '/keys', label: t('nav.apiKeys'), icon: SidebarKeyIcon },
    { path: '/usage', label: t('nav.usage'), icon: SidebarUsageIcon, hideInSimpleMode: true },
    { path: '/available-channels', label: t('nav.availableChannels'), icon: SidebarChannelIcon, hideInSimpleMode: true },
    { path: '/monitor', label: t('nav.channelStatus'), icon: SidebarSignalIcon },
    { path: '/subscriptions', label: t('nav.mySubscriptions'), icon: SidebarSubscriptionIcon, hideInSimpleMode: true },
    { path: '/purchase', label: t('nav.buySubscription'), icon: SidebarRechargeIcon, hideInSimpleMode: true },
    { path: '/orders', label: t('nav.myOrders'), icon: SidebarOrderIcon, hideInSimpleMode: true },
    { path: '/redeem', label: t('nav.redeem'), icon: SidebarGiftIcon, hideInSimpleMode: true },
    { path: '/affiliate', label: t('nav.affiliate'), icon: SidebarAffiliateIcon },
    { path: '/profile', label: t('nav.profile'), icon: SidebarProfileIcon },
    ...customMenuItemsForUser.value.map((item): NavItem => ({
      path: `/custom/${item.id}`,
      label: item.label,
      icon: null,
      iconSvg: item.icon_svg,
    })),
  )
  return items
}

// finalizeNav 只保留 simple 模式过滤。关键入口不再被功能开关隐藏，避免用户找不到页面。
function finalizeNav(items: NavItem[]): NavItem[] {
  return authStore.isSimpleMode ? items.filter(item => !item.hideInSimpleMode) : items
}

// User navigation items (for regular users)
const userNavItems = computed((): NavItem[] => finalizeNav(buildSelfNavItems(true)))

// Personal navigation items (for admin's "My Account" section).
// Admins are also users, so this mirrors the full user menu.
const personalNavItems = computed((): NavItem[] => finalizeNav(buildSelfNavItems(true)))

// Custom menu items filtered by visibility
const customMenuItemsForUser = computed(() => {
  const items = appStore.cachedPublicSettings?.custom_menu_items ?? []
  return items
    .filter((item) => item.visibility === 'user')
    .sort((a, b) => a.sort_order - b.sort_order)
})

const customMenuItemsForAdmin = computed(() => {
  return adminSettingsStore.customMenuItems
    .filter((item) => item.visibility === 'admin')
    .sort((a, b) => a.sort_order - b.sort_order)
})

// Admin navigation items
const adminNavItems = computed((): NavItem[] => {
  const baseItems: NavItem[] = [
    { path: '/admin/dashboard', label: t('nav.adminDashboard'), icon: SidebarDashboardIcon },
    { path: '/admin/ops', label: t('nav.ops'), icon: SidebarOpsIcon },
    { path: '/admin/users', label: t('nav.users'), icon: SidebarUsersIcon, hideInSimpleMode: true },
    { path: '/admin/groups', label: t('nav.groups'), icon: SidebarGroupIcon, hideInSimpleMode: true },
    { path: '/admin/models', label: t('nav.modelPricing'), icon: SidebarPriceTagIcon, hideInSimpleMode: true },
    {
      path: '/admin/channels',
      label: t('nav.channelManagement'),
      icon: SidebarChannelIcon,
      hideInSimpleMode: true,
      expandOnly: true,
      children: [
        { path: '/admin/channels/pricing', label: t('nav.channelPricing'), icon: SidebarPriceTagIcon },
        { path: '/admin/channels/monitor', label: t('nav.channelMonitor'), icon: SidebarSignalIcon },
      ],
    },
    { path: '/admin/subscriptions', label: t('nav.subscriptions'), icon: SidebarSubscriptionIcon, hideInSimpleMode: true },
    { path: '/admin/accounts', label: t('nav.accounts'), icon: SidebarAccountIcon },
    { path: '/admin/announcements', label: t('nav.announcements'), icon: SidebarBellIcon },
    { path: '/admin/proxies', label: t('nav.proxies'), icon: SidebarProxyIcon },
    { path: '/admin/risk-control', label: t('nav.riskControl'), icon: SidebarProxyIcon, hideInSimpleMode: true },
    { path: '/admin/redeem', label: t('nav.redeemCodes'), icon: SidebarTicketIcon, hideInSimpleMode: true },
    { path: '/admin/promo-codes', label: t('nav.promoCodes'), icon: SidebarPromoIcon, hideInSimpleMode: true },
    {
      path: '/admin/affiliates',
      label: t('nav.affiliateManagement'),
      icon: SidebarAffiliateIcon,
      hideInSimpleMode: true,
      expandOnly: true,
      children: [
        { path: '/admin/affiliates/invites', label: t('nav.affiliateInviteRecords'), icon: SidebarAffiliateIcon },
        { path: '/admin/affiliates/rebates', label: t('nav.affiliateRebateRecords'), icon: SidebarOrderIcon },
        { path: '/admin/affiliates/transfers', label: t('nav.affiliateTransferRecords'), icon: SidebarSubscriptionIcon },
      ],
    },
    {
      path: '/admin/orders',
      label: t('nav.orderManagement'),
      icon: SidebarOrderIcon,
      hideInSimpleMode: true,
      expandOnly: true,
      children: [
        { path: '/admin/orders/dashboard', label: t('nav.paymentDashboard'), icon: SidebarDashboardIcon },
        { path: '/admin/orders', label: t('nav.orderManagement'), icon: SidebarOrderIcon },
        { path: '/admin/orders/plans', label: t('nav.paymentPlans'), icon: SidebarSubscriptionIcon },
      ],
    },
    { path: '/admin/usage', label: t('nav.usage'), icon: SidebarUsageIcon }
  ]

  const visible = [...baseItems]

  // 简单模式下，在系统设置前插入 API密钥
  if (authStore.isSimpleMode) {
    const filtered = visible.filter(item => !item.hideInSimpleMode)
    filtered.push({ path: '/keys', label: t('nav.apiKeys'), icon: SidebarKeyIcon })
    filtered.push({ path: '/admin/settings', label: t('nav.settings'), icon: SidebarSettingsIcon })
    for (const cm of customMenuItemsForAdmin.value) {
      filtered.push({ path: `/custom/${cm.id}`, label: cm.label, icon: null, iconSvg: cm.icon_svg })
    }
    return filtered
  }

  visible.push({ path: '/admin/settings', label: t('nav.settings'), icon: SidebarSettingsIcon })
  for (const cm of customMenuItemsForAdmin.value) {
    visible.push({ path: `/custom/${cm.id}`, label: cm.label, icon: null, iconSvg: cm.icon_svg })
  }
  return visible
})

const sidebarTourIds: Record<string, string> = {
  '/models': 'sidebar-models',
  '/keys': 'sidebar-my-keys',
  '/usage': 'sidebar-usage',
  '/subscriptions': 'sidebar-subscriptions',
}

function getSidebarTourId(path: string): string | undefined {
  return sidebarTourIds[path]
}

function closeMobile() {
  appStore.setMobileOpen(false)
}

function handleMenuItemClick(itemPath: string) {
  if (mobileOpen.value) {
    setTimeout(() => {
      appStore.setMobileOpen(false)
    }, 150)
  }

  const pathToSelector = Object.fromEntries(
    Object.entries(sidebarTourIds).map(([path, tourId]) => [path, `[data-tour="${tourId}"]`])
  )

  const selector = pathToSelector[itemPath]
  if (selector && onboardingStore.isCurrentStep(selector)) {
    onboardingStore.nextStep(500)
  }
}

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

function isGroupActive(item: NavItem): boolean {
  if (!item.children) return false
  return item.children.some(child => route.path === child.path)
}

function isGroupExpanded(item: NavItem): boolean {
  return expandedGroups.value.has(item.path) || isGroupActive(item)
}

function toggleGroup(item: NavItem) {
  if (expandedGroups.value.has(item.path)) {
    expandedGroups.value.delete(item.path)
  } else {
    expandedGroups.value.add(item.path)
  }
}

/**
 * Click handler for collapsible parent items.
 * - When sidebar is collapsed: do nothing (children are not visible).
 * - When `expandOnly` is true: only toggle expand state.
 * - Otherwise (default, e.g. /admin/orders): navigate to the parent path
 *   (router-link semantics) and ensure the group is expanded.
 */
function handleGroupClick(item: NavItem) {
  if (sidebarCollapsed.value) return
  if (item.expandOnly) {
    toggleGroup(item)
    return
  }
  // Push to path and ensure expanded
  if (route.path !== item.path) {
    router.push(item.path)
  }
  if (!expandedGroups.value.has(item.path)) {
    expandedGroups.value.add(item.path)
  }
}

document.documentElement.classList.remove('dark')

// Fetch admin settings (for feature-gated nav items like Ops).
watch(
  isAdmin,
  (v) => {
    if (v) {
      adminSettingsStore.fetch()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (isAdmin.value) {
    adminSettingsStore.fetch()
  }
})
</script>

<style scoped>
.sidebar-logo {
  flex: 0 0 2.25rem;
  min-width: 2.25rem;
}

.sidebar-header-collapsed {
  gap: 0;
  padding-left: 1.125rem;
  padding-right: 1.125rem;
}

.sidebar-brand {
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  transition:
    max-width 0.22s ease,
    opacity 0.14s ease,
    transform 0.14s ease;
  max-width: 12rem;
}

.sidebar-brand-collapsed {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-4px);
  pointer-events: none;
}

.sidebar-brand-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-link-collapsed {
  gap: 0;
  padding-left: 0.875rem;
  padding-right: 0.875rem;
}

.sidebar-section-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 1.25rem;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-section-title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.sidebar-section-title::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  top: 50%;
  height: 1px;
  background: var(--bg-surface-alt);
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.18s ease;
}


.sidebar-section-title-text-collapsed {
  opacity: 0;
  transform: translateX(-4px);
}

.sidebar-section-title-collapsed::after {
  opacity: 1;
  transition-delay: 0.08s;
}

.sidebar-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    max-width 0.2s ease,
    opacity 0.12s ease,
    transform 0.12s ease;
  max-width: 12rem;
}

.sidebar-label-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sidebar-label-collapsed {
  max-width: 0;
  opacity: 0;
  transform: translateX(-4px);
  pointer-events: none;
}

.sidebar-link {
  border-radius: var(--radius-lg) !important;
}

/* Custom SVG icon in sidebar: constrain size without overriding uploaded SVG colors */
.sidebar-svg-icon {
  color: currentColor;
}

.sidebar-svg-icon :deep(svg) {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}

.sidebar-header {
  min-height: 4.5rem;
}

.sidebar-logo {
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 14px;
}

.sidebar-brand-title {
  background: none;
  background-clip: text;
  color: var(--accent) !important;
  font-weight: 900;
}

.sidebar-section {
  margin-bottom: 1rem;
  border-radius: 16px;
}

.sidebar-section + .sidebar-section {
  border-top: 1px solid var(--border-default);
  padding-top: 0.875rem;
}

.sidebar-link {
  min-height: 2.5rem;
  border: 1px solid transparent;
}

.sidebar-link-active {
  border-color: var(--border-focus);
}

.sidebar-link-active svg,
.sidebar-link-active .sidebar-svg-icon {
  filter: none;
}

.sidebar-footer {
  background: var(--bg-surface);
}


.sidebar {
  --sidebar-icon-main: #5A5148;
  --sidebar-icon-accent: #BB4D1B;
  border-right-color: var(--border-default) !important;
  background: var(--bg-surface) !important;
  color: var(--text-primary) !important;
  box-shadow: none;
}


.sidebar-header {
  min-height: 72px !important;
  border-bottom: 1px solid var(--border-default) !important;
  padding: 16px 24px !important;
}

.sidebar-logo {
  position: relative !important;
  flex: 0 0 36px !important;
  min-width: 36px !important;
  width: 36px !important;
  height: 36px !important;
  overflow: hidden !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none;
}

.sidebar-logo img {
  position: absolute !important;
  inset: 0 !important;
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: contain !important;
  object-position: center !important;
  transform: scale(1.18) !important;
  transform-origin: center center !important;
  mix-blend-mode: multiply;
}

.sidebar-brand-title {
  background: none !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  font-weight: 500 !important;
}

.sidebar-section {
  margin-bottom: 36px !important;
  border-radius: 0 !important;
}

.sidebar-section + .sidebar-section {
  border-top: 0 !important;
  padding-top: 0 !important;
}

.sidebar-section-title {
  margin-bottom: 10px !important;
  padding: 0 12px !important;
  color: var(--text-secondary) !important;
  font-size: 12px !important;
  font-weight: 400 !important;
}

.sidebar-section-title::after {
  background: var(--border-default) !important;
}

.sidebar-link {
  position: relative !important;
  min-height: 46px !important;
  border: 0 !important;
  border-radius: var(--radius-lg) !important;
  padding: 10px 12px 10px 16px !important;
  background: transparent !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  gap: 10px !important;
  box-shadow: none;
}

.sidebar-link::before {
  content: none;
  display: none;
}

.sidebar-link:hover {
  border: 0 !important;
  background: var(--bg-surface-alt) !important;
  color: var(--text-primary) !important;
}

.sidebar-link-active {
  border: 0 !important;
  background: var(--accent-soft) !important;
  color: var(--accent) !important;
  font-weight: 650 !important;
}

.sidebar-link-active::before {
  content: none;
  display: none;
}

.sidebar-link-active svg,
.sidebar-link-active .sidebar-svg-icon {
  filter: none !important;
}

.sidebar-footer,

.sidebar .sidebar-link-active,
.sidebar .sidebar-link-active.router-link-active,
.sidebar .sidebar-link-active.router-link-exact-active {
  border: 0 !important;
  background: var(--accent-soft) !important;
  color: var(--accent) !important;
  font-weight: 500 !important;
}


.sidebar .sidebar-link-active::before,
.sidebar .sidebar-link-active.router-link-active::before,
.sidebar .sidebar-link-active.router-link-exact-active::before {
  content: none !important;
  display: none !important;
}

.sidebar-footer .sidebar-doc-link,
.sidebar-footer .sidebar-doc-link.router-link-active,
.sidebar-footer .sidebar-doc-link.router-link-exact-active {
  --sidebar-icon-main: var(--accent-contrast);
  --sidebar-icon-accent: var(--accent-contrast);
  border: 1px solid var(--accent) !important;
  background: var(--accent) !important;
  color: var(--accent-contrast) !important;
  font-weight: 700 !important;
}

.sidebar-footer .sidebar-doc-link:hover {
  background: var(--accent-hover) !important;
  color: var(--accent-contrast) !important;
}

.sidebar-footer .sidebar-doc-link svg,
.sidebar-footer .sidebar-doc-link .sidebar-svg-icon {
  color: var(--accent-contrast) !important;
}
</style>
