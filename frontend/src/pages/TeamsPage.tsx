import { useEffect, useState } from 'react'
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Empty,
  Space,
  Avatar,
  Tag,
  Popconfirm,
  Select,
  Divider,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  TeamOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CrownOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { teamService } from '../services/teamService'
import { userService } from '../services/userService'
import { useAuthStore } from '../stores/authStore'
import type { Team, TeamMember, TeamInvitation, TeamRole } from '../types'

const { Text, Title } = Typography

function TeamsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [manageModalVisible, setManageModalVisible] = useState(false)

  const [createForm] = Form.useForm()
  const [inviteForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [teamList, invitationList] = await Promise.all([
        teamService.getTeams(),
        teamService.getPendingInvitations(),
      ])
      setTeams(teamList)
      setInvitations(invitationList)
    } catch (error) {
      message.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (values: { name: string; description?: string }) => {
    try {
      const newTeam = await teamService.createTeam(values)
      setTeams([...teams, newTeam])
      setCreateModalVisible(false)
      createForm.resetFields()
      message.success('Team created!')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create team')
    }
  }

  const handleDeleteTeam = async (teamId: number) => {
    try {
      await teamService.deleteTeam(teamId)
      setTeams(teams.filter((t) => t.id !== teamId))
      message.success('Team deleted')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete team')
    }
  }

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await teamService.acceptInvitation(invitationId)
      setInvitations(invitations.filter((i) => i.id !== invitationId))
      loadData() // Reload to get updated team list
      message.success('Invitation accepted!')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to accept invitation')
    }
  }

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      await teamService.declineInvitation(invitationId)
      setInvitations(invitations.filter((i) => i.id !== invitationId))
      message.success('Invitation declined')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to decline invitation')
    }
  }

  const openManageModal = async (team: Team) => {
    setSelectedTeam(team)
    setManageModalVisible(true)
    setMembersLoading(true)
    try {
      const members = await teamService.getMembers(team.id)
      setTeamMembers(members)
    } catch (error) {
      message.error('Failed to load members')
    } finally {
      setMembersLoading(false)
    }
  }

  const handleInvite = async (values: { email: string }) => {
    if (!selectedTeam) return
    try {
      await teamService.inviteToTeam(selectedTeam.id, values.email)
      inviteForm.resetFields()
      setInviteModalVisible(false)
      message.success('Invitation sent!')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to send invitation')
    }
  }

  const handleUpdateRole = async (memberId: number, role: TeamRole) => {
    if (!selectedTeam) return
    try {
      const updated = await teamService.updateMemberRole(selectedTeam.id, memberId, role)
      setTeamMembers(teamMembers.map((m) => (m.user.id === memberId ? updated : m)))
      message.success('Role updated')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedTeam) return
    try {
      await teamService.removeMember(selectedTeam.id, memberId)
      setTeamMembers(teamMembers.filter((m) => m.user.id !== memberId))
      message.success('Member removed')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleLeaveTeam = async (teamId: number) => {
    try {
      await teamService.leaveTeam(teamId)
      setTeams(teams.filter((t) => t.id !== teamId))
      message.success('Left team')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to leave team')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Teams
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          Create Team
        </Button>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card
          title="Pending Invitations"
          style={{ marginBottom: 24 }}
          bodyStyle={{ padding: '12px 24px' }}
        >
          <List
            dataSource={invitations}
            renderItem={(invitation) => (
              <List.Item
                actions={[
                  <Button type="primary" size="small" onClick={() => handleAcceptInvitation(invitation.id)}>
                    Accept
                  </Button>,
                  <Button size="small" onClick={() => handleDeclineInvitation(invitation.id)}>
                    Decline
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<TeamOutlined />} />}
                  title={invitation.team.name}
                  description={`Invited by ${invitation.inviter.name}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Team List */}
      {teams.length === 0 ? (
        <Empty description="No teams yet. Create one to get started!" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={teams}
          renderItem={(team) => (
            <List.Item>
              <Card
                actions={[
                  <SettingOutlined key="manage" onClick={() => openManageModal(team)} />,
                  team.owner.id === user?.id ? (
                    <Popconfirm
                      key="delete"
                      title="Delete this team?"
                      onConfirm={() => handleDeleteTeam(team.id)}
                    >
                      <DeleteOutlined />
                    </Popconfirm>
                  ) : (
                    <Popconfirm
                      key="leave"
                      title="Leave this team?"
                      onConfirm={() => handleLeaveTeam(team.id)}
                    >
                      <Text type="secondary">Leave</Text>
                    </Popconfirm>
                  ),
                ]}
              >
                <Card.Meta
                  avatar={<Avatar size={48} icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={
                    <Space>
                      {team.name}
                      {team.owner.id === user?.id && (
                        <Tag color="gold">
                          <CrownOutlined /> Owner
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <>
                      <div>{team.description || 'No description'}</div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">{team.memberCount} members</Text>
                      </div>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Create Team Modal */}
      <Modal
        title="Create Team"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateTeam}>
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: 'Please enter team name' }]}
          >
            <Input placeholder="My Team" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Manage Team Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            {selectedTeam?.name}
          </Space>
        }
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setInviteModalVisible(true)}
          >
            Invite Member
          </Button>
        </div>

        <Divider>Members</Divider>

        {membersLoading ? (
          <Spin />
        ) : (
          <List
            dataSource={teamMembers}
            renderItem={(member) => (
              <List.Item
                actions={
                  member.role !== 'OWNER' && selectedTeam?.owner.id === user?.id
                    ? [
                        <Select
                          key="role"
                          value={member.role}
                          onChange={(value) => handleUpdateRole(member.user.id, value)}
                          style={{ width: 100 }}
                          size="small"
                        >
                          <Select.Option value="ADMIN">Admin</Select.Option>
                          <Select.Option value="MEMBER">Member</Select.Option>
                        </Select>,
                        <Popconfirm
                          key="remove"
                          title="Remove this member?"
                          onConfirm={() => handleRemoveMember(member.user.id)}
                        >
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  avatar={<Avatar src={member.user.avatarUrl ? userService.getAvatarUrl(member.user.id) : undefined}>{member.user.name[0]}</Avatar>}
                  title={
                    <Space>
                      {member.user.name}
                      {member.role === 'OWNER' && (
                        <Tag color="gold">
                          <CrownOutlined /> Owner
                        </Tag>
                      )}
                      {member.role === 'ADMIN' && <Tag color="blue">Admin</Tag>}
                    </Space>
                  }
                  description={member.user.email}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        title="Invite Member"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInvite}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Send Invitation
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TeamsPage
