export {
  componentMap,
  ColumnBlock,
  BackgroundContainerBlock,
} from './registry'

export type {
  BaseBlock,
  BlockFormData,
  Viewport,
  ViewportValue,
  PageConfig,
  SavedPage,
} from './types'

export {
  blockSchema,
  pageSchema,
  schemaAllViewport,
} from './schema'

export type {
  BlockSchema,
  ConfigSchema,
} from './schema'

export {
  default as PageRender,
} from './render/page-render.vue'

// 对外导出校验能力
export {
  validateBlock,
  validateDocument,
} from './validate'
export type {
  DocumentIssue,
} from './validate'


export { parsePage } from './document'