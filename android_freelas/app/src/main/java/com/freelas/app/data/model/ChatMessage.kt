package com.freelas.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class ChatMessage(
    val id: String,
    val serviceId: String,
    val senderId: String,
    val content: String,
    val timestamp: Long,
    val isRead: Boolean = false,
    val messageType: MessageType = MessageType.TEXT
) : Parcelable

enum class MessageType {
    TEXT,
    IMAGE,
    LOCATION,
    SYSTEM
}

@Parcelize
data class ChatRoom(
    val id: String,
    val serviceId: String,
    val clientId: String,
    val providerId: String,
    val lastMessage: ChatMessage?,
    val unreadCount: Int = 0,
    val createdAt: Long,
    val updatedAt: Long
) : Parcelable



