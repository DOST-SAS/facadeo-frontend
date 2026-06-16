import { supabase } from "@/api/api";

const extractStoragePath = (publicUrl: string) => {
  const parts = publicUrl.split("/object/public/")
  if (parts.length !== 2) return null
  return parts[1]
}



const deleteAndUpload = async (
  bucket: "avatars" | "logos" | "signatures" | "deviPdf" | "facadesSemulation",
  file: File,
  userId: string,
  oldFileUrl?: string | null
) => {
  try {
    if (oldFileUrl) {
      const oldPath = extractStoragePath(oldFileUrl)
      console.log("oldPath ", oldPath)
      if (oldPath) {
        const { data, error } = await supabase.storage.from(bucket).remove([oldPath])
        if (error) throw error
        console.log("File deleted successfully", data)
      }
    }

    const timestamp = Date.now()
    const fileExt = file.name.split(".").pop()
    const filePath = `${userId}_${timestamp}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
      })

    if (error) throw error

    // 3. public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (err) {
    console.error("Upload error:", err)
    return null
  }
}


export const uploadAvatar = (
  file: File,
  userId: string,
  oldAvatarUrl?: string | null
) => deleteAndUpload("avatars", file, userId, oldAvatarUrl)


export const uploadLogo = (
  file: File,
  userId: string,
  oldLogoUrl?: string | null
) => deleteAndUpload("logos", file, userId, oldLogoUrl)


export const uploadSignature = (
  file: File,
  userId: string,
  oldSignatureUrl?: string | null
) => deleteAndUpload("signatures", file, userId, oldSignatureUrl)

export const uploadDocument = (
  file: File,
  userId: string,
  oldDocumentUrl?: string | null
) => deleteAndUpload("deviPdf", file, userId, oldDocumentUrl)


export const uploadFacade = (
  file: File,
  userId: string,
  oldFacadeUrl?: string | null
) => deleteAndUpload("facadesSemulation", file, userId, oldFacadeUrl)




