import { defineStore, acceptHMRUpdate } from 'pinia'
import type { BaseBlock, Viewport, PageConfig, SavedPage } from '@/types/edit'
import { findNodeById } from '@/components/edit/nested'
import { loadPage } from '@/utils/storage'

interface EditState {
  blockConfig: BaseBlock[]
  viewport: Viewport
  currentSelectId: string
  pageName: string
  pageConfig: PageConfig
  hasRestored: boolean
  configPanelShow: boolean
  serverPageId: number | null
}

export const useEditStore = defineStore('edit', {
  state: (): EditState => ({
    blockConfig: [
      {
        id: 'image-001',
        code: 'image',
        name: '图片',
        icon: 'image',
        formData: {
          src: {
            desktop: '/images/logo.svg',
            mobile: '/images/logo.svg',
          },
          width: {
            desktop: '100%',
            mobile: '100%',
          },
          height: {
            desktop: '295px',
            mobile: '180px',
          },
        },
      },
      {
        id: 'blank-001',
        code: 'blank',
        name: '留白',
        icon: 'blank',
        formData: {
          height: {
            desktop: 32,
            mobile: 20,
          },
        },
      },
      {
        id: 'text-001',
        code: 'text',
        name: '文本',
        icon: 'text',
        formData: {
          text: {
            desktop: '把灵感，带进生活。',
            mobile: '把灵感，带进生活。',
          },
          fontSize: {
            desktop: 28,
            mobile: 22,
          },
          color: {
            desktop: '#1f2329',
            mobile: '#1f2329',
          },
        },
      },
    ],
    viewport: 'desktop',
    currentSelectId: '',

    pageName: '未命名页面',
    pageConfig: {
      background: {
        desktop: '#ffffff',
        mobile: '#ffffff',
      },
    },
    hasRestored: false,
    configPanelShow: false,
    serverPageId: null,
  }),

  // edit.currentSelect   从 blockConfig 中找到的节点
  getters: {
    currentSelect: (state): BaseBlock | undefined => {
      return findNodeById(
        state.blockConfig,
        state.currentSelectId,
      )
    },
  },
  actions: {
    setBlockConfig(value: BaseBlock[]) {
      this.blockConfig = value
    },

    setViewport(value: Viewport) {
      this.viewport = value
    },

    // edit.currentSelectId  选中节点的 ID
    setCurrentSelect(id: string) {
      this.currentSelectId = id
      if (id) {
        this.setConfigPanelShow(true)
      }
    },

    setConfigPanelShow(value: boolean) {
      this.configPanelShow = value
    },


    // 调用方必须先完成文档校验。
    applyDocument(record: SavedPage, serverPageId: number | null = null) {
      this.$patch({
        blockConfig: record.content.block,
        pageConfig: record.content.page,
        pageName: record.pageName,
        currentSelectId: '',
        viewport: 'desktop',
        hasRestored: true,
        configPanelShow: false,
        serverPageId
      })
    },
    // 存储整页
    restoreDocument() {
      if (this.hasRestored) return

      this.hasRestored = true

      const record = loadPage()

      if (!record) return

      // this.$patch({
      //   blockConfig: record.content.block,
      //   pageConfig: record.content.page,
      //   pageName: record.pageName,
      //   currentSelectId: '',
      //   viewport: 'desktop',
      // })
      this.applyDocument(record)
    },

    createBlankDocument() {
      this.applyDocument({
        version: 1,
        pageName: '未命名页面',
        content: {
          block: [],
          page: {
            background: {
              desktop: '#ffffff',
              mobile: '#ffffff',
            },
          },
        },
      })
    },
  },

})

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useEditStore, import.meta.hot),
  )
}