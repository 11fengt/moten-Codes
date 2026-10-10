import type { BaseBlock } from '@/types/edit'


export const baseBlocks: BaseBlock[] = [
    // 保留现有三个物料对象
    {
        id: '',
        name: '图片',
        code: 'image',
        icon: 'image',
        formData: {
            src: {
                desktop: '/images/logo.svg',
                mobile: '/images/logo.svg',
            },
            width: {
                desktop: '250px',
                mobile: '200px',
            },
            height: {
                desktop: '250px',
                mobile: '200px',
            },
        },
    },
    {
        id: '',
        name: '文本',
        code: 'text',
        icon: 'text',
        formData: {
            text: {
                desktop: '请输入文本',
                mobile: '请输入文本',
            },
            fontSize: {
                desktop: 24,
                mobile: 20,
            },
            color: {
                desktop: '#1f2329',
                mobile: '#1f2329',
            },
        },
    },
    {
        id: '',
        name: '留白',
        code: 'blank',
        icon: 'blank',
        formData: {
            height: {
                desktop: 32,
                mobile: 20,
            },
        },
    },

    {
        id: '',
        code: 'button',
        name: '按钮／链接',
        icon: 'button',
        formData: {
            text: {
                desktop: '查看详情',
                mobile: '查看详情',
            },
            href: {
                desktop: 'https://example.com',
                mobile: 'https://example.com',
            },
            fontSize: {
                desktop: 16,
                mobile: 14,
            },
            color: {
                desktop: '#ffffff',
                mobile: '#ffffff',
            },
        },
    },
    {
        id: '',
        code: 'divider',
        name: '分割线',
        icon: 'divider',
        formData: {
            color: {
                desktop: '#dee0e3',
                mobile: '#dee0e3',
            },
            thickness: {
                desktop: 1,
                mobile: 1,
            },
            lineStyle: {
                desktop: 'solid',
                mobile: 'solid',
            },
            spacing: {
                desktop: 16,
                mobile: 16,
            },
        },
    },
]

export const seniorBlocks: BaseBlock[] = [
    {
        id: '',
        name: '双列布局',
        code: 'column',
        icon: 'column',
        nested: true,
        children: [[], []],
        formData: {},
    },
    {
        id: '',
        code: 'backgroundContainer',
        name: '背景容器',
        icon: 'backgroundContainer',
        nested: true,
        children: [[]],
        formData: {
            src: {
                desktop: '',
                mobile: '',
            },
            minHeight: {
                desktop: 280,
                mobile: 280,
            },
            padding: {
                desktop: 20,
                mobile: 20,
            },
        },
    },
]


const defaultCode = `const page = {
  name: '我的页面',
  blocks: [],
}
console.log(page)`

export const markdownBlocks: BaseBlock[] = [
    {
        id: '',
        code: 'orderedList',
        name: '有序列表',
        icon: 'orderedList',
        formData: {
            text: {
                desktop: '选择物料\n拖入画布\n修改属性',
                mobile: '选择物料\n拖入画布\n修改属性',
            },
            fontSize: {
                desktop: 20,
                mobile: 18,
            },
            color: {
                desktop: '#1f2329',
                mobile: '#1f2329',
            },
        },
    },
    {
        id: '',
        code: 'unorderedList',
        name: '无序列表',
        icon: 'unorderedList',
        formData: {
            text: {
                desktop: '支持物料拖拽\n支持属性配置\n支持页面预览',
                mobile: '支持物料拖拽\n支持属性配置\n支持页面预览',
            },
            fontSize: {
                desktop: 20,
                mobile: 18,
            },
            color: {
                desktop: '#1f2329',
                mobile: '#1f2329',
            },
        },
    },
    {
        id: '',
        code: 'highlight',
        name: '高亮块',
        icon: 'highlight',
        formData: {
            text: {
                desktop: '提示：编辑完成后，请先保存，再打开预览。',
                mobile: '提示：编辑完成后，请先保存，再打开预览。',
            },
            fontSize: {
                desktop: 16,
                mobile: 16,
            },
            color: {
                desktop: '#1f2329',
                mobile: '#1f2329',
            },
            background: {
                desktop: '#ecf5ff',
                mobile: '#ecf5ff',
            },
            borderColor: {
                desktop: '#409eff',
                mobile: '#409eff',
            },
        },
    },
    {
        id: '',
        code: 'codeBlock',
        name: '代码块',
        icon: 'codeBlock',
        formData: {
            text: {
                desktop: defaultCode,
                mobile: defaultCode,
            },
            fontSize: {
                desktop: 14,
                mobile: 14,
            },
            color: {
                desktop: '#e6edf3',
                mobile: '#e6edf3',
            },
            background: {
                desktop: '#1f2329',
                mobile: '#1f2329',
            },
        },
    },
]