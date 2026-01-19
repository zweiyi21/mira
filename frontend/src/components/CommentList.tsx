import { useState, useEffect } from 'react'
import { List, Avatar, Input, Button, message, Popconfirm, Space, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Comment } from '../types'
import { commentService } from '../services/commentService'
import { useAuthStore } from '../stores/authStore'

dayjs.extend(relativeTime)

const { TextArea } = Input
const { Text } = Typography

interface CommentListProps {
  projectKey: string
  issueKey: string
}

export default function CommentList({ projectKey, issueKey }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const currentUser = useAuthStore((state) => state.user)

  useEffect(() => {
    loadComments()
  }, [projectKey, issueKey])

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await commentService.getComments(projectKey, issueKey)
      setComments(data)
    } catch (error) {
      message.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const comment = await commentService.createComment(projectKey, issueKey, newComment)
      setComments([...comments, comment])
      setNewComment('')
      message.success('Comment added')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (commentId: number) => {
    if (!editContent.trim()) return

    try {
      const updated = await commentService.updateComment(projectKey, issueKey, commentId, editContent)
      setComments(comments.map((c) => (c.id === commentId ? updated : c)))
      setEditingId(null)
      message.success('Comment updated')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update comment')
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await commentService.deleteComment(projectKey, issueKey, commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      message.success('Comment deleted')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete comment')
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  return (
    <div>
      <List
        loading={loading}
        dataSource={comments}
        locale={{ emptyText: 'No comments yet' }}
        renderItem={(comment) => (
          <List.Item
            style={{ alignItems: 'flex-start' }}
            actions={
              currentUser?.id === comment.author.id
                ? [
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => startEditing(comment)}
                    />,
                    <Popconfirm
                      title="Delete this comment?"
                      onConfirm={() => handleDelete(comment.id)}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              avatar={
                <Avatar src={comment.author.avatarUrl}>
                  {comment.author.name[0]}
                </Avatar>
              }
              title={
                <Space>
                  <Text strong>{comment.author.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(comment.createdAt).fromNow()}
                  </Text>
                  {comment.updatedAt !== comment.createdAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      (edited)
                    </Text>
                  )}
                </Space>
              }
              description={
                editingId === comment.id ? (
                  <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                    <TextArea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoSize={{ minRows: 2 }}
                      style={{ flex: 1 }}
                    />
                    <Button type="primary" onClick={() => handleUpdate(comment.id)}>
                      Save
                    </Button>
                    <Button onClick={() => setEditingId(null)}>Cancel</Button>
                  </Space.Compact>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                )
              }
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 16 }}>
        <TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={{ marginBottom: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!newComment.trim()}
        >
          Comment
        </Button>
      </div>
    </div>
  )
}
