import React, { useState } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonBadge,
  IonAvatar,
  IonButton,
  IonText
} from '@ionic/react';
import {
  homeOutline,
  notificationsOutline,
  chatbubblesOutline,
  peopleOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
  addCircleOutline,
  statsChartOutline,
  calendarOutline,
  helpCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../services/api';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Admin Navigation Items
  const adminNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: homeOutline },
    { title: 'Notifications', path: '/notifications', icon: notificationsOutline },
    { title: 'Create Notification', path: '/create-notification', icon: addCircleOutline },
    { title: 'Calendar', path: '/calendar', icon: calendarOutline },
    { title: 'Manage Users', path: '/manage-users', icon: peopleOutline },
    { title: 'Messages', path: '/messages', icon: chatbubblesOutline },
    { title: 'Analytics', path: '/analytics', icon: statsChartOutline },
  ];

  // Teacher Navigation Items
  const teacherNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: homeOutline },
    { title: 'Notifications', path: '/notifications', icon: notificationsOutline },
    { title: 'Calendar', path: '/calendar', icon: calendarOutline },
    { title: 'Students', path: '/students', icon: peopleOutline },
    { title: 'Messages', path: '/messages', icon: chatbubblesOutline },
  ];

  // Student Navigation Items
  const studentNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: homeOutline },
    { title: 'Notifications', path: '/notifications', icon: notificationsOutline },
    { title: 'Calendar', path: '/calendar', icon: calendarOutline },
    { title: 'Messages', path: '/messages', icon: chatbubblesOutline },
  ];

  const getNavigationItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems;
      case 'teacher':
        return teacherNavItems;
      case 'student':
        return studentNavItems;
      default:
        return studentNavItems;
    }
  };

  const navItems = getNavigationItems();

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonMenuToggle slot="end" autoHide={false}>
            <IonButton fill="clear" color="light">
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonMenuToggle>
          <IonTitle>
            <div className="sidebar-header">
              <img src="/assets/logos/snsu-logo-white.png" alt="SNSU" className="sidebar-logo" />
              <div className="sidebar-title">
                <span className="sidebar-brand">SNSU</span>
                <span className="sidebar-subtitle">Notification System</span>
              </div>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#1a1a2e', '--ion-background-color': '#1a1a2e' } as React.CSSProperties}>
        {/* User Profile Section */}
        <div className="sidebar-profile">
          <IonAvatar className="profile-avatar" key={user?.profilePicture || 'no-picture'}>
            {user?.profilePicture ? (
              <>
                <img
                  src={getMediaUrl(user.profilePicture)}
                  alt="Profile"
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e: any) => {
                    console.log('Image failed to load:', user.profilePicture);
                    e.target.style.display = 'none';
                    const placeholder = e.target.parentElement?.querySelector('.avatar-placeholder');
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }}
                  onLoad={(e: any) => {
                    console.log('Image loaded successfully:', user.profilePicture);
                    e.target.style.display = 'block';
                    const placeholder = e.target.parentElement?.querySelector('.avatar-placeholder');
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'none';
                    }
                  }}
                />
                <div
                  className="avatar-placeholder"
                  style={{ display: 'none' }}
                >
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              </>
            ) : (
              <div
                className="avatar-placeholder"
                style={{ display: 'flex' }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </IonAvatar>
          <div className="profile-info">
            <IonText>
              <h3>{user?.username}</h3>
            </IonText>
            <IonBadge color={user?.role === 'admin' ? 'danger' : user?.role === 'teacher' ? 'primary' : 'success'}>
              {user?.role}
            </IonBadge>
            {user?.role === 'teacher' && user?.department && (
              <p className="profile-detail">{user.department}</p>
            )}
            {user?.role === 'student' && user?.course && (
              <p className="profile-detail">{user.course} - Year {user.yearLevel}</p>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <IonList className="sidebar-nav">
          {navItems.map((item, index) => (
            <IonMenuToggle key={index} auto-hide="false">
              <IonItem
                button
                detail={false}
                className={isActive(item.path) ? 'nav-item active' : 'nav-item'}
                onClick={() => history.push(item.path)}
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel>{item.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>

        {/* Settings & Logout */}
        <IonList className="sidebar-footer">
          <IonMenuToggle auto-hide="false">
            <IonItem
              button
              detail={false}
              className={isActive('/profile') ? 'nav-item active' : 'nav-item'}
              onClick={() => history.push('/profile')}
            >
              <IonIcon slot="start" icon={personOutline} />
              <IonLabel>My Profile</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle auto-hide="false">
            <IonItem
              button
              detail={false}
              className={isActive('/settings') ? 'nav-item active' : 'nav-item'}
              onClick={() => history.push('/settings')}
            >
              <IonIcon slot="start" icon={settingsOutline} />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle auto-hide="false">
            <IonItem
              button
              detail={false}
              className="nav-item"
              onClick={() => history.push('/help')}
            >
              <IonIcon slot="start" icon={helpCircleOutline} />
              <IonLabel>Help & Support</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle auto-hide="false">
            <IonItem
              button
              detail={false}
              className="nav-item logout-item"
              onClick={handleLogout}
              lines="none"
            >
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Logout</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>

        {/* Version Info */}
        <div className="sidebar-version">
          <IonText color="medium">
            <small>SNSU System v1.0.0</small>
          </IonText>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default Sidebar;
