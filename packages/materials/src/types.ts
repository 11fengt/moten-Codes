export type Viewport = 'desktop' | 'mobile'

export type ViewportValue<T> = Record<Viewport, T>

export interface BlockFormData {
  text?: ViewportValue<string>
  fontSize?: ViewportValue<number>
  color?: ViewportValue<string>

  src?: ViewportValue<string>
  width?: ViewportValue<string>
  height?: ViewportValue<string | number>

  href?: ViewportValue<string>

  thickness?: ViewportValue<number>
  lineStyle?: ViewportValue<string>
  spacing?: ViewportValue<number>

  background?: ViewportValue<string>
  borderColor?: ViewportValue<string>

  minHeight?: ViewportValue<number>
  padding?: ViewportValue<number>
}

export interface BaseBlock {
  id: string
  code: string
  name: string
  icon: string
  formData: BlockFormData
  nested?: boolean
  children?: BaseBlock[][]
  parent?: string
}

export interface PageConfig {
  background: ViewportValue<string>
}

export interface SavedPage {
  version: 1
  pageName: string
  content: {
    block: BaseBlock[]
    page: PageConfig
  }
}