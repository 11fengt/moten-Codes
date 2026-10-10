import type { Component } from 'vue'
import TextBlock from './components/TextBlock.vue'
import ImageBlock from './components/ImageBlock.vue'
import BlankBlock from './components/BlankBlock.vue'
import ColumnBlock from './components/ColumnBlock.vue'

import OrderedListBlock from './components/OrderedListBlock.vue'
import UnorderedListBlock from './components/UnorderedListBlock.vue'
import ButtonBlock from './components/ButtonBlock.vue'
import DividerBlock from './components/DividerBlock.vue'
import HighlightBlock from './components/HighlightBlock.vue'
import CodeBlock from './components/CodeBlock.vue'
import BackgroundContainerBlock from './components/BackgroundContainerBlock.vue'

export const componentMap: Record<string, Component> = {
  text: TextBlock,
  image: ImageBlock,
  blank: BlankBlock,

  orderedList: OrderedListBlock,
  unorderedList: UnorderedListBlock,
  button: ButtonBlock,
  divider: DividerBlock,
  highlight: HighlightBlock,
  codeBlock: CodeBlock,
}

export {
  ColumnBlock,
  BackgroundContainerBlock,
}