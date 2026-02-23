import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText
} from '@ionic/react';
import {
  peopleOutline,
  notificationsOutline,
  chatbubblesOutline,
  personOutline,
  schoolOutline,
  briefcaseOutline,
  trendingUpOutline,
  timeOutline
} from 'ionicons/icons';
import { userService, notificationService, messageService } from '../services/api';
import Sidebar from '../components/Sidebar';
import './Analytics.css';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalNotifications: 0,
    totalMessages: 0,
    activeNotifications: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [usersRes, notificationsRes, messagesRes] = await Promise.all([
        userService.getUsers(),
        notificationService.getNotifications(),
        messageService.getMessages()
      ]);

      const admins = usersRes.data.admins || [];
      const teachers = usersRes.data.teachers || [];
      const students = usersRes.data.students || [];
      const notifications = notificationsRes.data || [];
      const messages = messagesRes.data || [];

      const totalUsers = admins.length + teachers.length + students.length;
      const activeNotifs = notifications.filter((n: any) => n.isActive).length;
      const recentMessages = messages.filter((m: any) => {
        const msgDate = new Date(m.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return msgDate > dayAgo;
      }).length;

      setStats({
        totalUsers,
        totalAdmins: admins.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalNotifications: notifications.length,
        totalMessages: messages.length,
        activeNotifications: activeNotifs,
        recentActivity: recentMessages
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadAnalytics();
    event.detail.complete();
  };

  const StatCard = ({ title, value, icon, colorClass, subtitle }: any) => (
    <div className="stat-card">
      <div className="stat-info">
        <p className="stat-label">{title}</p>
        <h2 className={`stat-value ${colorClass}`}>
          {loading ? <IonSkeletonText animated style={{ width: '60px', height: '32px' }} /> : value}
        </h2>
        <p className="stat-subtitle">{subtitle}</p>
      </div>
      <div className={`stat-icon ${colorClass}`}>
        <IonIcon icon={icon} />
      </div>
    </div>
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
            <IonTitle>Analytics Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div className="analytics-container">
            {/* User Statistics */}
            <IonCard className="analytics-card">
              <IonCardHeader>
                <IonCardTitle>User Statistics</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="stats-grid">
                  <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={peopleOutline}
                    colorClass="primary"
                    subtitle="All registered users"
                  />
                  <StatCard
                    title="Students"
                    value={stats.totalStudents}
                    icon={schoolOutline}
                    colorClass="success"
                    subtitle="Active students"
                  />
                  <StatCard
                    title="Teachers"
                    value={stats.totalTeachers}
                    icon={briefcaseOutline}
                    colorClass="warning"
                    subtitle="Faculty members"
                  />
                  <StatCard
                    title="Admins"
                    value={stats.totalAdmins}
                    icon={personOutline}
                    colorClass="danger"
                    subtitle="System administrators"
                  />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Activity Statistics */}
            <IonCard className="analytics-card">
              <IonCardHeader>
                <IonCardTitle>Activity Statistics</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="stats-grid">
                  <StatCard
                    title="Total Notifications"
                    value={stats.totalNotifications}
                    icon={notificationsOutline}
                    colorClass="purple"
                    subtitle="All time"
                  />
                  <StatCard
                    title="Active Notifications"
                    value={stats.activeNotifications}
                    icon={trendingUpOutline}
                    colorClass="info"
                    subtitle="Currently active"
                  />
                  <StatCard
                    title="Total Messages"
                    value={stats.totalMessages}
                    icon={chatbubblesOutline}
                    colorClass="danger"
                    subtitle="All conversations"
                  />
                  <StatCard
                    title="Recent Activity"
                    value={stats.recentActivity}
                    icon={timeOutline}
                    colorClass="warning"
                    subtitle="Last 24 hours"
                  />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Quick Insights */}
            <IonCard className="analytics-card">
              <IonCardHeader>
                <IonCardTitle>Quick Insights</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="insights-list">
                  <div className="insight-row">
                    <span className="insight-label">User Distribution</span>
                    <div className="insight-badges">
                      <IonBadge color="success">{stats.totalStudents} Students</IonBadge>
                      <IonBadge color="warning">{stats.totalTeachers} Teachers</IonBadge>
                      <IonBadge color="danger">{stats.totalAdmins} Admins</IonBadge>
                    </div>
                  </div>

                  <div className="insight-row">
                    <span className="insight-label">Notification Status</span>
                    <div className="insight-badges">
                      <IonBadge color="primary">{stats.activeNotifications} Active</IonBadge>
                      <IonBadge color="medium">{stats.totalNotifications - stats.activeNotifications} Inactive</IonBadge>
                    </div>
                  </div>

                  <div className="insight-row">
                    <span className="insight-label">Message Activity</span>
                    <div className="insight-badges">
                      <IonBadge color="tertiary">{stats.recentActivity} Messages (24h)</IonBadge>
                      <IonBadge color="medium">{stats.totalMessages} Total</IonBadge>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Analytics;
