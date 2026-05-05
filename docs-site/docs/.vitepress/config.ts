import { defineConfig } from 'vitepress'

export default defineConfig({
  // 默认语言
  lang: 'zh-CN',
  
  // 站点元数据
  title: 'OwnAPI',
  titleTemplate: ':title - OwnAPI Docs',
  description: 'OwnAPI 开发者文档 - AI API 中转与配额管理平台',

  // Favicon
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],

  // 最后更新时间
  lastUpdated: true,
  
  // 清理 URL（去掉 .html 后缀）
  cleanUrls: true,
  
  // 忽略死链检查（构建时）
  ignoreDeadLinks: true,
  
  // 多语言配置
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: navZh(),
        sidebar: sidebarZh(),
        outline: {
          label: '本页目录',
        },
        docFooter: {
          prev: '上一页',
          next: '下一页',
        },
        lastUpdated: {
          text: '最后更新于',
        },
        langMenuLabel: '切换语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: navEn(),
        sidebar: sidebarEn(),
        outline: {
          label: 'On this page',
        },
        docFooter: {
          prev: 'Previous page',
          next: 'Next page',
        },
        lastUpdated: {
          text: 'Last updated',
        },
      },
    },
  },
  
  themeConfig: {
    // Logo
    logo: '/logo.png',
    
    // 站点标题
    siteTitle: 'OwnAPI',
    
    // 搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/therealemery/sub2api-ownapi' },
    ],
    
    // 页脚
    footer: {
      message: 'Released under the <a href="https://www.gnu.org/licenses/lgpl-3.0.html" target="_blank">LGPLv3 License</a>.',
      copyright: 'Copyright © 2026 OwnAPI',
    },
    
    // 编辑链接
    editLink: {
      pattern: 'https://github.com/therealemery/sub2api-ownapi/edit/main/docs-site/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
  },
  
  // Markdown 配置
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // 可以在这里添加自定义 markdown-it 插件
    },
  },
  
  // Vite 配置
  vite: {
    // 自定义 vite 配置
  },
})

// 中文导航
function navZh() {
  return [
    { text: '指南', link: '/zh/guide/getting-started', activeMatch: '/zh/guide/' },
    { text: 'API 参考', link: '/zh/api/openai', activeMatch: '/zh/api/' },
    { text: 'ownapi.dev', link: 'https://ownapi.dev' },
  ]
}

// 中文侧边栏
function sidebarZh() {
  return {
    '/zh/guide/': [
      {
        text: '开始',
        items: [
          { text: '快速开始', link: '/zh/guide/getting-started' },
          { text: '认证', link: '/zh/guide/authentication' },
        ],
      },
    ],
    '/zh/api/': [
      {
        text: 'API 参考',
        items: [
          { text: 'OpenAI 兼容', link: '/zh/api/openai' },
          { text: 'Claude 兼容', link: '/zh/api/claude' },
          { text: 'Gemini 兼容', link: '/zh/api/gemini' },
          { text: '模型列表', link: '/zh/api/models' },
          { text: '错误码', link: '/zh/api/errors' },
        ],
      },
    ],
  }
}

// 英文导航
function navEn() {
  return [
    { text: 'Guide', link: '/en/guide/getting-started', activeMatch: '/en/guide/' },
    { text: 'API Reference', link: '/en/api/openai', activeMatch: '/en/api/' },
    { text: 'ownapi.dev', link: 'https://ownapi.dev' },
  ]
}

// 英文侧边栏
function sidebarEn() {
  return {
    '/en/guide/': [
      {
        text: 'Getting Started',
        items: [
          { text: 'Quick Start', link: '/en/guide/getting-started' },
          { text: 'Authentication', link: '/en/guide/authentication' },
        ],
      },
    ],
    '/en/api/': [
      {
        text: 'API Reference',
        items: [
          { text: 'OpenAI Compatible', link: '/en/api/openai' },
          { text: 'Claude Compatible', link: '/en/api/claude' },
          { text: 'Gemini Compatible', link: '/en/api/gemini' },
          { text: 'Model List', link: '/en/api/models' },
          { text: 'Error Codes', link: '/en/api/errors' },
        ],
      },
    ],
  }
}
