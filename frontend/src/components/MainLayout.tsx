import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd'
import {
  ProjectOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  CameraOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import { userService } from '../services/userService'
import NotificationBell from './NotificationBell'
import AvatarUploadModal from './AvatarUploadModal'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const avatarUrl = user?.avatarUrl ? userService.getAvatarUrl(user.id) : undefined

  const userMenu = {
    items: [
      {
        key: 'avatar',
        icon: <CameraOutlined />,
        label: 'Change Avatar',
        onClick: () => setAvatarModalOpen(true),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout,
      },
    ],
  }

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/teams')) return 'teams'
    return 'projects'
  }

  const sideMenuItems = [
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
      onClick: () => navigate('/projects'),
    },
    {
      key: 'teams',
      icon: <TeamOutlined />,
      label: 'Teams',
      onClick: () => navigate('/teams'),
    },
  ]

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#001529',
        }}
      >
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          MIRA
        </div>
        <Space size="middle">
          <NotificationBell />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" style={{ color: '#fff' }}>
              <Avatar
                icon={!avatarUrl && <UserOutlined />}
                src={avatarUrl}
                size="small"
                style={{ marginRight: 8 }}
              />
              {user?.name}
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0 }}
            items={sideMenuItems}
          />
        </Sider>
        <Content
          style={{
            padding: 24,
            margin: 0,
            background: '#f0f2f5',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <AvatarUploadModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
    </Layout>
  )
}

export default MainLayout
