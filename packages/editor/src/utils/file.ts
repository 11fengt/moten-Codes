import type { SavedPage } from '@/types/edit'

export function downloadPageJSON(record: SavedPage) {
  // 转换成 JSON 字符串，使用两个空格缩进，方便打开文件阅读
  const raw = JSON.stringify(record, null, 2)
  
  // Blob：把字符串装成浏览器可以处理的文件数据
  const blob = new Blob([raw], {
    type: 'application/json;charset=utf-8',
  })

  // URL.createObjectURL(blob)：为这份数据生成临时地址，供下载链接使用。这个地址没有上传到服务器
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'moten-page.json'
  link.style.display = 'none'

  try {
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }
}

// savedPage 结构示例：
// {
//   version: 1,
//   pageName: '活动页面',
//   content: {
//     block: [...],
//     page: {...},
//   },
// }