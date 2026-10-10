import { Type, type TSchema } from '@sinclair/typebox'
export function schemaAllViewport<T extends TSchema>(schema: T) {
  return Type.Object({
    desktop: schema,
    mobile: schema,
  })
}

export const fontSizeSchema = Type.Number({
  code: 'config-slider',
  title: '字号大小（px）',
  minimum: 12,
  maximum: 52,
})

export const blankHeightSchema = Type.Number({
  code: 'config-slider',
  title: '留白高度（px）',
  minimum: 8,
  maximum: 200,
})

export const textContentSchema = Type.String({
  code: 'config-input',
  title: '文本内容',
  placeholder: '请输入文本内容',
  multiline: true,
  minLength: 1,
})

export const textColorSchema = Type.String({
  code: 'config-color',
  title: '文字颜色',
  default: '#1f2329',
})

// 组合文字组件配置的 schema
// export const textSchema = Type.Object({
//   text: textContentSchema,
//   fontSize: fontSizeSchema,
//   color: textColorSchema,
// })
// 改为：
// 组合文字组件配置的 schema，支持多端配置
export const textSchema = Type.Object({
  text: schemaAllViewport(textContentSchema),
  fontSize: schemaAllViewport(fontSizeSchema),
  color: schemaAllViewport(textColorSchema),
})

export const blankSchema = Type.Object({
  height: schemaAllViewport(blankHeightSchema),
})


const imageWidthSchema = Type.String({
  code: 'config-input',
  title: '宽度',
  placeholder: '250px 或 100%',
  minLength: 1,
})

const imageHeightSchema = Type.String({
  code: 'config-input',
  title: '高度',
  placeholder: '250px',
  minLength: 1,
})

const imageSrcSchema = Type.String({
  code: 'config-files',
  title: '图片',
  placeholder: '图片 URL 或 /images/logo.svg',
  minLength: 1,
})

export const imageSchema = Type.Object({
  width: schemaAllViewport(imageWidthSchema),
  height: schemaAllViewport(imageHeightSchema),
  src: schemaAllViewport(imageSrcSchema),
})


const listSchema = Type.Object({
  text: schemaAllViewport(
    Type.String({
      code: 'config-input',
      title: '列表内容（每行一项）',
      placeholder: '选择物料\n拖入画布\n修改属性',
      multiline: true,
      minLength: 1,
      pattern: '\\S',
    }),
  ),
  fontSize: schemaAllViewport(fontSizeSchema),
  color: schemaAllViewport(textColorSchema),
})

// 定义按钮Schema
const buttonSchema = Type.Object({
  text: schemaAllViewport(
    Type.String({
      code: 'config-input',
      title: '按钮文字',
      placeholder: '例如：查看详情',
      minLength: 1,
      pattern: '\\S',
    }),
  ),
  href: schemaAllViewport(
    Type.String({
      code: 'config-input',
      title: '跳转地址',
      placeholder: 'https://example.com',
      minLength: 1,
      pattern: '^https?://\\S+$',
    }),
  ),
  fontSize: schemaAllViewport(fontSizeSchema),
  color: schemaAllViewport(
    Type.String({
      code: 'config-color',
      title: '文字颜色',
      default: '#ffffff',
    }),
  ),
})

// 定义分割线Schema
const dividerSchema = Type.Object({
  color: schemaAllViewport(
    Type.String({
      code: 'config-color',
      title: '线条颜色',
      default: '#dee0e3',
    }),
  ),
  thickness: schemaAllViewport(
    Type.Number({
      code: 'config-slider',
      title: '线条粗细（px）',
      minimum: 1,
      maximum: 8,
    }),
  ),
  lineStyle: schemaAllViewport(
    Type.String({
      code: 'config-select',
      title: '线条样式',
      enum: ['solid', 'dashed', 'dotted'],
      options: [
        { label: '实线', value: 'solid' },
        { label: '虚线', value: 'dashed' },
        { label: '点线', value: 'dotted' },
      ],
    }),
  ),
  spacing: schemaAllViewport(
    Type.Number({
      code: 'config-slider',
      title: '上下间距（px）',
      minimum: 0,
      maximum: 80,
    }),
  ),
})

//定义高亮块Schema
const highlightSchema = Type.Object({
  text: schemaAllViewport(
    Type.String({
      code: 'config-input',
      title: '提示内容',
      placeholder: '请输入需要强调的内容',
      multiline: true,
      minLength: 1,
      pattern: '\\S',
    }),
  ),
  fontSize: schemaAllViewport(fontSizeSchema),
  color: schemaAllViewport(textColorSchema),
  background: schemaAllViewport(
    Type.String({
      code: 'config-color',
      title: '背景颜色',
      default: '#ecf5ff',
    }),
  ),
  borderColor: schemaAllViewport(
    Type.String({
      code: 'config-color',
      title: '强调线颜色',
      default: '#409eff',
    }),
  ),
})

// 定义代码块
const codeBlockSchema = Type.Object({
  text: schemaAllViewport(
    Type.String({
      code: 'config-input',
      title: '代码内容',
      placeholder: '请输入代码，保留原有缩进和换行',
      multiline: true,
      minLength: 1,
      pattern: '\\S',
    }),
  ),
  fontSize: schemaAllViewport(fontSizeSchema),
  color: schemaAllViewport(
    Type.String({
      code: 'config-color',
      title: '代码文字颜色',
      default: '#e6edf3',
    }),
  ),
  background: schemaAllViewport(
    Type.String({
      code: 'config-color',
      title: '背景颜色',
      default: '#1f2329',
    }),
  ),
})

// 定义背景容器
const backgroundContainerSchema = Type.Object({
  src: schemaAllViewport(
    Type.String({
      code: 'config-files',
      title: '背景图片',
      placeholder: '图片 URL，也可以选择本地图片',
    }),
  ),
  minHeight: schemaAllViewport(
    Type.Number({
      code: 'config-slider',
      title: '最小高度（px）',
      minimum: 160,
      maximum: 800,
    }),
  ),
  padding: schemaAllViewport(
    Type.Number({
      code: 'config-slider',
      title: '内容内边距（px）',
      minimum: 0,
      maximum: 48,
    }),
  ),
})

export const blockSchema = {
  text: textSchema,
  blank: blankSchema,
  image: imageSchema,
  orderedList: listSchema,
  unorderedList: listSchema,
  button: buttonSchema,
  divider: dividerSchema,
  highlight: highlightSchema,
  codeBlock: codeBlockSchema,
  backgroundContainer: backgroundContainerSchema,
}

export type BlockSchema =
  (typeof blockSchema)[keyof typeof blockSchema]


const pageBackgroundSchema = Type.String({
  code: 'config-color',
  title: '页面背景',
  default: '#ffffff',
})
export const pageSchema = Type.Object({
  background: schemaAllViewport(pageBackgroundSchema),
})

export type ConfigSchema = BlockSchema | typeof pageSchema