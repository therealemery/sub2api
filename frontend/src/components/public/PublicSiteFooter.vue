<template>
  <footer class="public-footer">
    <div class="footer-brand">
      <router-link to="/home">
        <img :src="siteLogo" alt="" />
        <strong>{{ siteName }}</strong>
      </router-link>
      <p>{{ t('home.heroDescription') }}</p>
    </div>
    <div class="footer-directory">
      <div><strong>{{ t('home.footer.product') }}</strong><router-link to="/models">{{ t('home.models') }}</router-link><router-link to="/monitor">{{ t('home.status') }}</router-link></div>
      <div><strong>{{ t('home.footer.resources') }}</strong><router-link to="/docs">{{ t('home.docs') }}</router-link><router-link to="/key-usage">{{ t('keyUsage.title') }}</router-link></div>
      <div><strong>{{ t('home.footer.company') }}</strong><router-link to="/agent-recruitment">{{ t('home.agentRecruitment') }}</router-link><a href="mailto:support@ownapi.dev">{{ t('home.footer.support') }}</a></div>
    </div>
    <div class="footer-bottom">
      <span><i></i>{{ t('home.stories.operational') }}</span>
      <p>&copy; {{ new Date().getFullYear() }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import { DEFAULT_SITE_LOGO, resolveSiteLogoPath, resolveSiteName } from '@/constants/branding'

const { t } = useI18n()
const appStore = useAppStore()
const siteName = computed(() => resolveSiteName(appStore.cachedPublicSettings?.site_name || appStore.siteName))
const siteLogo = computed(() => resolveSiteLogoPath(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || DEFAULT_SITE_LOGO))
</script>

<style scoped>
.public-footer{display:grid;grid-template-columns:1.2fr 2fr;gap:80px;width:min(100% - 48px,1392px);margin:0 auto;padding:64px 0 24px;border-top:1px solid #e5e5e5}.footer-brand>a{display:inline-flex;align-items:center;gap:10px;color:#171717;text-decoration:none}.footer-brand img{width:26px;height:26px;object-fit:contain;mix-blend-mode:multiply}.footer-brand strong{font-size:16px}.footer-brand p{max-width:360px;margin:20px 0 0;color:#666;font-size:13px;line-height:1.65}.footer-directory{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}.footer-directory>div{display:grid;align-content:start;gap:12px;font-size:13px}.footer-directory strong{margin-bottom:4px}.footer-directory a{color:#666;text-decoration:none}.footer-directory a:hover{color:#000}.footer-bottom{display:flex;grid-column:1/-1;align-items:center;justify-content:space-between;margin-top:50px;padding-top:22px;border-top:1px solid #e5e5e5}.footer-bottom>span{display:inline-flex;align-items:center;gap:7px;border-radius:999px;background:#f1f8f3;padding:6px 9px;color:#16794b;font-size:11px}.footer-bottom i{width:7px;height:7px;border-radius:50%;background:#27a866}.footer-bottom p{margin:0;color:#8f8f8f;font-size:12px}
@media(max-width:767px){.public-footer{grid-template-columns:1fr;width:calc(100% - 32px);gap:54px}.footer-directory{grid-template-columns:repeat(2,1fr)}.footer-bottom{align-items:flex-start;flex-direction:column;gap:18px}}
</style>
