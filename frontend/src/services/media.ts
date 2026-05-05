import { http } from './http'

export interface MediaImage {
  id: string
  title: string
  fileName: string
  fileUrl: string
  sortOrder: number
}

export interface MediaVideo {
  id: string
  title: string
  fileName: string
  fileUrl: string
  description: string | null
  duration: string | null
  sortOrder: number
}

function upload(url: string, file: File, fields: Record<string, string>) {
  const form = new FormData()
  form.append('file', file)
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  return http.post(url, form).then(r => r.data)
}

export const mediaApi = {
  listImages: () => http.get<MediaImage[]>('/media/images').then(r => r.data),
  createImage: (file: File, title: string) => upload('/media/images', file, { title }),
  updateImage: (id: string, file: File | null, title?: string) => {
    if (file) {
      const form = new FormData()
      form.append('file', file)
      if (title) form.append('title', title)
      return http.put(`/media/images/${id}`, form).then(r => r.data)
    }
    return http.put(`/media/images/${id}`, { title }).then(r => r.data)
  },
  deleteImage: (id: string) => http.delete(`/media/images/${id}`).then(r => r.data),

  listVideos: () => http.get<MediaVideo[]>('/media/videos').then(r => r.data),
  createVideo: (file: File, title: string, duration?: string, description?: string) =>
    upload('/media/videos', file, { title, duration: duration ?? '', description: description ?? '' }),
  updateVideo: (id: string, file: File | null, fields: Partial<MediaVideo>) => {
    if (file) {
      const form = new FormData()
      form.append('file', file)
      for (const [k, v] of Object.entries(fields)) if (v) form.append(k, String(v))
      return http.put(`/media/videos/${id}`, form).then(r => r.data)
    }
    return http.put(`/media/videos/${id}`, fields).then(r => r.data)
  },
  deleteVideo: (id: string) => http.delete(`/media/videos/${id}`).then(r => r.data),
}
