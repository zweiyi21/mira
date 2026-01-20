package com.mira.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.UUID

@Service
class StorageService(
    @Value("\${storage.type:local}") private val storageType: String,
    @Value("\${storage.local.path:./uploads}") private val localPath: String
) {

    init {
        if (storageType == "local") {
            val uploadDir = Paths.get(localPath)
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir)
            }
        }
    }

    fun store(file: MultipartFile, projectKey: String, issueKey: String): String {
        val filename = "${UUID.randomUUID()}_${file.originalFilename}"
        val key = "$projectKey/$issueKey/$filename"

        return when (storageType) {
            "local" -> storeLocal(file, key)
            "s3" -> storeS3(file, key)
            else -> storeLocal(file, key)
        }
    }

    fun storeAvatar(file: MultipartFile, userId: Long): String {
        val extension = file.originalFilename?.substringAfterLast('.', "jpg") ?: "jpg"
        val filename = "${UUID.randomUUID()}.$extension"
        val key = "avatars/$userId/$filename"

        return when (storageType) {
            "local" -> storeLocal(file, key)
            "s3" -> storeS3(file, key)
            else -> storeLocal(file, key)
        }
    }

    fun getFileBytes(storageKey: String): ByteArray {
        return when (storageType) {
            "local" -> getLocalFileBytes(storageKey)
            "s3" -> getS3FileBytes(storageKey)
            else -> getLocalFileBytes(storageKey)
        }
    }

    fun delete(storageKey: String) {
        when (storageType) {
            "local" -> deleteLocal(storageKey)
            "s3" -> deleteS3(storageKey)
        }
    }

    private fun storeLocal(file: MultipartFile, key: String): String {
        val targetPath = Paths.get(localPath, key)
        Files.createDirectories(targetPath.parent)
        Files.copy(file.inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING)
        return key
    }

    private fun getLocalFileBytes(key: String): ByteArray {
        val path = Paths.get(localPath, key)
        return Files.readAllBytes(path)
    }

    private fun deleteLocal(key: String) {
        val path = Paths.get(localPath, key)
        Files.deleteIfExists(path)
    }

    // S3 implementation placeholder - to be implemented for production
    private fun storeS3(file: MultipartFile, key: String): String {
        throw UnsupportedOperationException("S3 storage not yet implemented")
    }

    private fun getS3FileBytes(key: String): ByteArray {
        throw UnsupportedOperationException("S3 storage not yet implemented")
    }

    private fun deleteS3(key: String) {
        throw UnsupportedOperationException("S3 storage not yet implemented")
    }
}
