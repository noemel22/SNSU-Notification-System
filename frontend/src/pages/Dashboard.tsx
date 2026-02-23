import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonFab,
  IonFabButton,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonMenuButton
} from '@ionic/react';
import {
  addOutline,
  peopleOutline,
  notificationsOutline,
  refreshOutline,
  calendarOutline,
  chatbubblesOutline,
  schoolOutline,
  briefcaseOutline,
  statsChartOutline,
  timeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService, userService, messageService, getMediaUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  imagePath?: string;
  thumbnailPath?: string;
  timestamp: string;
  createdAt?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any>({ teachers: [], students: [], admins: [] });
  const [messageCount, setMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const promises: Promise<any>[] = [
        notificationService.getNotifications()
      ];

      // Admin loads all users
      if (user?.role === 'admin') {
        promises.push(userService.getUsers());
      }
      // Teacher loads students
      else if (user?.role === 'teacher') {
        promises.push(userService.getUsers());
      }

      // Load messages for message count
      try {
        const msgResponse = await messageService.getMessages();
        setMessageCount(msgResponse.data?.length || 0);
      } catch (e) {
        console.log('Could not load messages');
      }

      const responses = await Promise.all(promises);
      setNotifications(responses[0].data || []);

      if (responses[1]) {
        setUsers(responses[1].data || { teachers: [], students: [], admins: [] });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ show: true, message: 'Error loading data', color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadData();
    event.detail.complete();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getNotificationIcon = (type: string) => {
    const icons: any = {
      info: '📢',
      event: '📅',
      emergency: '🚨',
      success: '✅',
      warning: '⚠️'
    };
    return icons[type] || '📢';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUpcomingEvents = () => {
    return notifications
      .filter(n => n.type === 'event')
      .slice(0, 3);
  };

  // Render Admin Stats
  const renderAdminStats = () => (
    <IonGrid>
      <IonRow>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/manage-users')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={briefcaseOutline} className="stat-icon primary" />
              <h3>{users.teachers?.length || 0}</h3>
              <p>Teachers</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/manage-users')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={schoolOutline} className="stat-icon success" />
              <h3>{users.students?.length || 0}</h3>
              <p>Students</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/notifications')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={notificationsOutline} className="stat-icon warning" />
              <h3>{notifications.length}</h3>
              <p>Notifications</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/analytics')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={statsChartOutline} className="stat-icon info" />
              <h3>{users.admins?.length || 0}</h3>
              <p>Admins</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );

  // Render Teacher Stats
  const renderTeacherStats = () => (
    <IonGrid>
      <IonRow>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/students')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={schoolOutline} className="stat-icon success" />
              <h3>{users.students?.length || 0}</h3>
              <p>Students</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/notifications')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={notificationsOutline} className="stat-icon warning" />
              <h3>{notifications.length}</h3>
              <p>Announcements</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/calendar')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={calendarOutline} className="stat-icon primary" />
              <h3>{getUpcomingEvents().length}</h3>
              <p>Events</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="3">
          <IonCard className="stat-card" button onClick={() => history.push('/messages')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={chatbubblesOutline} className="stat-icon info" />
              <h3>{messageCount}</h3>
              <p>Messages</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );

  // Render Student Stats
  const renderStudentStats = () => (
    <IonGrid>
      <IonRow>
        <IonCol size="6" sizeMd="4">
          <IonCard className="stat-card" button onClick={() => history.push('/notifications')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={notificationsOutline} className="stat-icon warning" />
              <h3>{notifications.length}</h3>
              <p>Announcements</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="6" sizeMd="4">
          <IonCard className="stat-card" button onClick={() => history.push('/calendar')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={calendarOutline} className="stat-icon primary" />
              <h3>{getUpcomingEvents().length}</h3>
              <p>Upcoming Events</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
        <IonCol size="12" sizeMd="4">
          <IonCard className="stat-card" button onClick={() => history.push('/messages')}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={chatbubblesOutline} className="stat-icon info" />
              <h3>{messageCount}</h3>
              <p>Messages</p>
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>
              <div className="header-brand">
                <img src="/assets/logos/snsu-logo-white.png" alt="SNSU" className="header-logo" />
                <span className="header-text">Dashboard</span>
              </div>
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={loadData}>
                <IonIcon icon={refreshOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <div className="dashboard-container">
            {/* Welcome Card */}
            <IonCard className="welcome-card">
              <IonCardContent>
                <div className="user-info">
                  <div className="user-avatar">
                    {user?.profilePicture ? (
                      <img
                        src={getMediaUrl(user.profilePicture)}
                        alt="Profile"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="avatar-placeholder" style={{ display: user?.profilePicture ? 'none' : 'flex' }}>
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="user-details">
                    <p className="greeting" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{getGreeting()},</p>
                    <h2 style={{ color: 'white' }}>{user?.username}</h2>
                    <div className="user-meta">
                      <IonBadge color={user?.role === 'admin' ? 'danger' : user?.role === 'teacher' ? 'primary' : 'success'}>
                        {user?.role}
                      </IonBadge>
                      {user?.role === 'teacher' && user?.department && (
                        <span className="department" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{user.department}</span>
                      )}
                      {user?.role === 'student' && user?.course && (
                        <span className="course" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{user.course} - Year {user.yearLevel}</span>
                      )}
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Role-Specific Stats */}
            {isLoading ? (
              <IonGrid>
                <IonRow>
                  {[1, 2, 3, 4].map(i => (
                    <IonCol key={i} size="6" sizeMd="3">
                      <IonCard className="stat-card">
                        <IonCardContent className="ion-text-center">
                          <IonSkeletonText animated style={{ width: '40px', height: '40px', margin: '0 auto 8px' }} />
                          <IonSkeletonText animated style={{ width: '30px', height: '24px', margin: '0 auto 4px' }} />
                          <IonSkeletonText animated style={{ width: '60px', height: '14px', margin: '0 auto' }} />
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            ) : (
              <>
                {user?.role === 'admin' && renderAdminStats()}
                {user?.role === 'teacher' && renderTeacherStats()}
                {user?.role === 'student' && renderStudentStats()}
              </>
            )}

            {/* Recent Notifications */}
            <IonCard className="notifications-card">
              <IonCardHeader>
                <div className="card-header-content">
                  <IonCardTitle>
                    <IonIcon icon={notificationsOutline} className="section-icon" />
                    Recent Announcements
                  </IonCardTitle>
                  <IonButton fill="clear" size="small" onClick={() => history.push('/notifications')}>
                    View All
                  </IonButton>
                </div>
              </IonCardHeader>
              <IonCardContent>
                {isLoading ? (
                  <>
                    <IonSkeletonText animated style={{ height: '80px', marginBottom: '12px' }} />
                    <IonSkeletonText animated style={{ height: '80px', marginBottom: '12px' }} />
                  </>
                ) : notifications.length === 0 ? (
                  <div className="empty-state">
                    <IonIcon icon={notificationsOutline} />
                    <p>No announcements yet</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item notification-${notif.type}`}
                        onClick={() => history.push(`/notification/${notif.id}`)}
                      >
                        <div className="notification-icon">{getNotificationIcon(notif.type)}</div>
                        <div className="notification-content">
                          <h3>{notif.title}</h3>
                          <p>{notif.content.length > 80 ? notif.content.substring(0, 80) + '...' : notif.content}</p>
                          <small>
                            <IonIcon icon={timeOutline} />
                            {formatDate(notif.timestamp || notif.createdAt || '')}
                          </small>
                        </div>
                        {notif.thumbnailPath && (
                          <img
                            src={`http://localhost:5000/uploads/${notif.thumbnailPath}`}
                            alt={notif.title}
                            className="notification-thumbnail"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {/* Upcoming Events (for teachers and students) */}
            {(user?.role === 'teacher' || user?.role === 'student') && getUpcomingEvents().length > 0 && (
              <IonCard className="events-card">
                <IonCardHeader>
                  <div className="card-header-content">
                    <IonCardTitle>
                      <IonIcon icon={calendarOutline} className="section-icon" />
                      Upcoming Events
                    </IonCardTitle>
                    <IonButton fill="clear" size="small" onClick={() => history.push('/calendar')}>
                      View Calendar
                    </IonButton>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <div className="events-list">
                    {getUpcomingEvents().map((event) => (
                      <div
                        key={event.id}
                        className="event-item"
                        onClick={() => history.push(`/notification/${event.id}`)}
                      >
                        <div className="event-date">
                          <span className="day">{new Date(event.timestamp || event.createdAt || '').getDate()}</span>
                          <span className="month">{new Date(event.timestamp || event.createdAt || '').toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="event-info">
                          <h4>{event.title}</h4>
                          <p>{event.content.substring(0, 60)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            )}
          </div>

          {user?.role === 'admin' && (
            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton onClick={() => history.push('/create-notification')}>
                <IonIcon icon={addOutline} />
              </IonFabButton>
            </IonFab>
          )}

          <IonToast
            isOpen={toast.show}
            message={toast.message}
            duration={3000}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, show: false })}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Dashboard;
