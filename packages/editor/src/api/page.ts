import { parsePage } from '@learn-moten/materials/document'
import type { SavedPage } from '@/types/edit'
import { authenticatedRequest } from './request'

// 列表中一条页面记录的结构。
export interface PageListItem {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// 列表接口成功时返回的业务数据。
export interface PageListData {
  list: PageListItem[]
  total: number
  page: number
  size: number
}

export async function getPageList(
  page = 1,
  size = 10,
): Promise<PageListData> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  const result = await authenticatedRequest<PageListData>(
    `/api/pages?${params}`,
    {},
    '获取页面列表失败',
  )

  if (!result.data) {
    throw new Error('接口缺少页面列表数据')
  }

  return result.data
}


// {
//   message: '页面列表查询成功',
//   data: {
//     list: [
//       {
//         id: 2,
//         name: '活动介绍页',
//         createdAt: '……',
//         updatedAt: '……',
//       },
//     ],
//     total: 1,
//     page: 1,
//     size: 10,
//   },
// }


// 通过校验后，交给编辑页使用的数据。
export interface PageDetailData {
  id: number
  document: SavedPage
}

// 接口返回的文档先视为未知数据，校验后才能使用。
interface RawPageDetail {
  id: number
  document: unknown
}

export async function getPageById(
  id: number,
): Promise<PageDetailData> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('页面 ID 必须是正整数')
  }

  const result = await authenticatedRequest<RawPageDetail>(
    `/api/pages/${id}`,
    {},
    '获取页面详情失败',
  )

  if (!result.data || result.data.id !== id) {
    throw new Error('接口返回的页面信息不正确')
  }

  const raw = JSON.stringify(result.data.document)

  if (typeof raw !== 'string') {
    throw new Error('接口缺少页面文档')
  }

  return {
    id: result.data.id,
    document: parsePage(raw),
  }
}


// 文件保存服务器
export interface PageSaveData {
  id: number
  pageName: string
}

export async function savePageToServer(
  record: SavedPage,
  id: number | null = null,
): Promise<PageSaveData> {
  if (
    id !== null &&
    (!Number.isSafeInteger(id) || id <= 0)
  ) {
    throw new Error('页面 ID 必须是正整数')
  }

  const isCreate = id === null

  const result = await authenticatedRequest<PageSaveData>(
    isCreate ? '/api/pages' : `/api/pages/${id}`,
    {
      method: isCreate ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    },
    '保存页面失败',
  )

  const data = result.data

  if (
    !data ||
    !Number.isSafeInteger(data.id) ||
    data.id <= 0 ||
    typeof data.pageName !== 'string'
  ) {
    throw new Error('接口返回的保存结果不正确')
  }

  if (id !== null && data.id !== id) {
    throw new Error('接口返回的页面 ID 不一致')
  }

  return data
}


// 删除页面。
export async function deletePage(
  id: number,
): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('页面 ID 必须是正整数')
  }

  const result = await authenticatedRequest<{ id: number }>(
    `/api/pages/${id}`,
    { method: 'DELETE' },
    '删除页面失败',
  )

  if (result.data?.id !== id) {
    throw new Error('接口返回的删除结果不正确')
  }
}
