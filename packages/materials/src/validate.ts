// 这个文件负责把 Schema 转成校验函数，并把错误转换为面板提示

import Ajv, { type ValidateFunction } from 'ajv'
import { blockSchema, pageSchema } from './schema'
import type { BaseBlock, PageConfig, Viewport } from './types'

const ajv = new Ajv({
  allErrors: true,
})

// 这些字段用于配置界面，不参与数据校验。
ajv.addKeyword({
  keyword: ['code', 'placeholder', 'multiline', 'options'],
})

// 将规则转换成可执行的校验函数, 编译一次，后续重复调用这个函数检查数据。
const validators: Record<string, ValidateFunction> = {
  text: ajv.compile(blockSchema.text),
  blank: ajv.compile(blockSchema.blank),
  image: ajv.compile(blockSchema.image),
  orderedList: ajv.compile(blockSchema.orderedList),
  unorderedList: ajv.compile(blockSchema.unorderedList),
  button: ajv.compile(blockSchema.button),
  divider: ajv.compile(blockSchema.divider),
  highlight: ajv.compile(blockSchema.highlight),
  codeBlock: ajv.compile(blockSchema.codeBlock),
  backgroundContainer: ajv.compile(blockSchema.backgroundContainer),
}
const checkPageConfig = ajv.compile(pageSchema)

const fieldTitles: Record<string, string> = {
  text: '文本内容',
  fontSize: '字号',
  color: '文字颜色',
  height: '高度',
  width: '宽度',
  src: '图片地址',
  background: '背景颜色',
  href: '跳转地址',
  thickness: '线条粗细',
  lineStyle: '线条样式',
  spacing: '上下间距',
  borderColor: '强调线颜色',
  minHeight: '最小高度',
  padding: '内容内边距',
}

function readErrors(
  check: ValidateFunction,
  data: unknown,
): FieldIssue[] {
  const valid = check(data)

  if (valid) return []

  return (check.errors ?? []).map((error) => {
    let path = error.instancePath

    // 缺少属性时，AJV 将属性名放在 params 中。
    if (error.keyword === 'required') {
      path += `/${error.params.missingProperty}`
    }

    const [field, rawViewport] = path.split('/').filter(Boolean)

    const viewport =
      rawViewport === 'desktop' || rawViewport === 'mobile'
        ? rawViewport
        : undefined

    const title = fieldTitles[field ?? ''] ?? '组件属性'
    const port =
      viewport === 'desktop'
        ? '桌面端'
        : viewport === 'mobile'
          ? '移动端'
          : '双端配置'

    let reason = '属性值不符合规则'

    switch (error.keyword) {
      case 'minLength':
        reason = `至少输入 ${error.params.limit} 个字符`
        break
      case 'minimum':
        reason = `不能小于 ${error.params.limit}`
        break
      case 'maximum':
        reason = `不能大于 ${error.params.limit}`
        break
      case 'required':
        reason = '缺少必填属性'
        break
      case 'type':
        reason = '属性值的类型不正确'
        break
      case 'pattern':
        reason = field === 'href'
          ? '请输入以 http:// 或 https:// 开头且不含空格的地址'
          : '至少输入一个非空白字符'
        break
      case 'enum':
        reason = `只能选择 ${error.params.allowedValues.join('、')}`
        break
    }

    return {
      viewport,
      message: `${title}（${port}）：${reason}`,
    }
  })
}

export function validateBlock(
  code: string,
  data: unknown,
): string[] {
  const check = validators[code]

  if (!check) return []

  return readErrors(check, data).map(issue => issue.message)
}

interface FieldIssue {
  viewport?: Viewport
  message: string
}

export interface DocumentIssue extends FieldIssue {
  nodeId: string
}




export function validateDocument(
  block: BaseBlock[],
  page: PageConfig,
  pageName: string,
): DocumentIssue | undefined {
  const name = pageName.trim()

  if (!name || name.length > 40) {
    return {
      nodeId: '',
      message: '页面名称需要填写 1～40 个字符',
    }
  }

  const pageIssue = readErrors(checkPageConfig, page)[0]

  if (pageIssue) {
    return {
      ...pageIssue,
      nodeId: '',
    }
  }

  function visit(
    list: BaseBlock[],
    level = 0,
  ): DocumentIssue | undefined {
    for (const node of list) {
      const isColumn = node.code === 'column'
      const isBackground = node.code === 'backgroundContainer'
      const isContainer = isColumn || isBackground

      if (isContainer) {
        const expectedGroups = isColumn ? 2 : 1

        if (
          level > 0 ||
          node.nested !== true ||
          !Array.isArray(node.children) ||
          node.children.length !== expectedGroups ||
          node.children.some(group => !Array.isArray(group))
        ) {
          return {
            nodeId: node.id,
            message: isColumn
              ? '双列布局需要放在根画布，并包含两列'
              : '背景容器需要放在根画布，并包含一个内容区域',
          }
        }
      } else if (
        node.nested === true ||
        node.children?.length
      ) {
        return {
          nodeId: node.id,
          message: '基础物料不能包含子节点',
        }
      }

      // 双列目前没有属性表单，其它物料都检查 formData。
      if (!isColumn) {
        const check = validators[node.code]

        if (!check) {
          return {
            nodeId: node.id,
            message: `无法检查物料：${node.name}`,
          }
        }

        const issue = readErrors(check, node.formData)[0]

        if (issue) {
          return {
            ...issue,
            nodeId: node.id,
          }
        }
      }

      // 容器结构和自身属性检查后，继续检查内部节点。
      for (const children of node.children ?? []) {
        const issue = visit(children, level + 1)

        if (issue) return issue
      }
    }

    return undefined
  }

  return visit(block)
}