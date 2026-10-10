// 设置类型

import type {
  BlockFormData,
  PageConfig,
} from '@learn-moten/materials'

export type {
  BaseBlock,
  BlockFormData,
  Viewport,
  ViewportValue,
  PageConfig,
  SavedPage,
} from '@learn-moten/materials'


// 通用属性表单允许接收物料属性或页面属性。
export type ConfigFormData = Partial<BlockFormData & PageConfig>


// // 定义页面配置的数据类型
// export interface PageConfig {
//   background: ViewportValue<string>
// }

// export interface SavedPage {
//   version: 1
//   pageName: string
//   content: {
//     block: BaseBlock[]
//     page: PageConfig
//   }
// }