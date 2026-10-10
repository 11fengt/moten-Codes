import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import type { BaseBlock } from '@/types/edit'

export const dragGroup = 'blocks'
export const nestedClass = 'nested-container'

// 深拷贝一次，再给整棵子树生成新 ID。
export function clone(block: BaseBlock): BaseBlock {
  const result = cloneDeep(block)

  resetIds(result)

  return result
}

function resetIds(node: BaseBlock) {
  node.id = nanoid(8)

  for (const list of node.children ?? []) {
    for (const child of list) {
      resetIds(child)
    }
  }
}

// 从根节点开始，查找根数组和每一列中的节点。
export function findNodeById(
  list: BaseBlock[],
  id: string,
): BaseBlock | undefined {
  for (const node of list) {
    if (node.id === id) return node

    for (const children of node.children ?? []) {
      const result = findNodeById(children, id)

      if (result) return result
    }
  }

  return undefined
}

interface DragMoveEvent {
  to: HTMLElement
  draggedContext: {
    element: BaseBlock
  }
}

// 容器只能放在根画布，不能放进列内。
// 容器只能放在根画布，不能放进任何容器内部。
export function move(event: DragMoveEvent): boolean {
  const isContainer = event.draggedContext.element.nested
  const insideContainer = event.to.classList.contains(nestedClass)

  return !(isContainer && insideContainer)
}