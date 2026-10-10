import type {
    BaseBlock,
    SavedPage,
} from './types'

import { validateDocument } from './validate'

// 判断是不是可以读取属性的对象
function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    )
}



// 检查整个节点树
// 1. 组件树必须是数组
// 2. 节点必须是对象，ID必须为字符串 + 不为空 + 不能重复，物料code必须是字符串，物料名称必须是字符串，物料图标必须是字符串，formData必须是对象
// 3. column 组件必须是嵌套的，其他组件不能嵌套
// 4. 检查子节点，如果有子节点必须是数组，继续递归每一列内的节点数组
function isBlockList(
    value: unknown,
    ids = new Set<string>(),
): value is BaseBlock[] {
    if (!Array.isArray(value)) return false

    for (const node of value) {
        if (
            !isRecord(node) ||
            typeof node.id !== 'string' ||
            !node.id.trim() ||
            ids.has(node.id) ||
            typeof node.code !== 'string' ||
            typeof node.name !== 'string' ||
            typeof node.icon !== 'string' ||
            !isRecord(node.formData) || !['text', 'image', 'blank', 'column', 'orderedList', 'unorderedList', 'button', 'divider', 'highlight', 'codeBlock', 'backgroundContainer'].includes(node.code)
        ) {
            return false
        }

        ids.add(node.id)

        const isContainer =
            node.code === 'column' ||
            node.code === 'backgroundContainer'
        if (isContainer) {
            if (node.nested !== true) return false
        } else if (
            node.nested !== undefined &&
            node.nested !== false
        ) {
            return false
        }

        if (node.children !== undefined) {
            if (!Array.isArray(node.children)) return false

            for (const children of node.children) {
                if (!isBlockList(children, ids)) return false
            }
        }
    }

    return true
}





function isSavedPage(value: unknown): value is SavedPage {
    // 1. 检查顶层结构：  记录是对象，版本是数字1，页面名称是字符串，content是对象
    if (
        !isRecord(value) ||
        value.version !== 1 ||
        typeof value.pageName !== 'string' ||
        !isRecord(value.content)
    ) {
        return false
    }

    const content = value.content

    // 2. 检查 content 内的 block 和 page
    if (
        !isBlockList(content.block) ||
        !isRecord(content.page)
    ) {
        return false
    }

    const background = content.page.background

    // 3. 检查页面背景，要求背景是个对象，且里面 desktop和mobile两个属性的值 都为字符串（代表两个颜色）
    return (
        isRecord(background) &&
        typeof background.desktop === 'string' &&
        typeof background.mobile === 'string'
    )
}


// 只负责解析和校验，不读取存储，也不修改页面。
export function parsePage(raw: string): SavedPage {
    let value: unknown

    try {
        value = JSON.parse(raw)
    } catch {
        throw new Error('页面文档不是有效的 JSON')
    }

    if (!isSavedPage(value)) {
        throw new Error('页面文档版本或结构不正确')
    }

    const issue = validateDocument(
        value.content.block,
        value.content.page,
        value.pageName,
    )

    if (issue) {
        const location = issue.nodeId
            ? `节点 ${issue.nodeId}`
            : '页面设置'

        throw new Error(
            `页面文档校验失败：${issue.message}（${location}）`,
        )
    }

    return value
}


// validateDocument
// 复用上一小步的整页校验：
// - 页面名称是否满足要求。
// - 双列是否位于根画布、是否包含两列。
// - 物料类型是否受支持。
// - 文本、字号、图片地址等双端属性是否符合 Schema。