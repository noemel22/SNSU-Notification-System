import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonSkeletonText,
  IonToast,
  IonAlert
} from '@ionic/react';
import {
  refreshOutline,
  trashOutline,
  searchOutline,
  createOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService, getMediaUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import './Notifications.css';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  imagePath?: string;
  thumbnailPath?: string;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [deleteAlert, setDeleteAlert] = useState({ show: false, id: 0 });
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchText, filterType]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      setToast({ show: true, message: 'Error loading notifications', color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchText.toLowerCase()) ||
        n.content.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      setToast({ show: true, message: 'Notification deleted', color: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Error deleting notification', color: 'danger' });
    }
  };

  const handleRefresh = async (event: any) => {
    await loadNotifications();
    event.detail.complete();
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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const toggleExpanded = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isExpanded = (id: number) => expandedNotifications.has(id);

  const shouldShowToggle = (content: string) => content.length > 150;

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Notifications</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={loadNotifications}>
                <IonIcon icon={refreshOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>

          <IonToolbar>
            <IonSearchbar
              value={searchText}
              onIonInput={(e: any) => setSearchText(e.target.value)}
              placeholder="Search notifications..."
              animated
            />
          </IonToolbar>

          <IonToolbar>
            <IonSegment value={filterType} onIonChange={(e: any) => setFilterType(e.detail.value)}>
              <IonSegmentButton value="all">
                <IonLabel>All</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="info">
                <IonLabel>Info</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="event">
                <IonLabel>Events</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="emergency">
                <IonLabel>Emergency</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <div className="notifications-container">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <IonCard key={index}>
                  <IonCardContent>
                    <IonSkeletonText animated style={{ width: '40%', height: '20px' }} />
                    <IonSkeletonText animated style={{ width: '100%', height: '60px', marginTop: '10px' }} />
                  </IonCardContent>
                </IonCard>
              ))
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={searchOutline} size="large" />
                <h2>No notifications found</h2>
                <p>
                  {searchText || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No notifications yet'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <IonCard
                  key={notif.id}
                  className={`notification-card notification-${notif.type}`}
                  button
                  onClick={() => history.push(`/notification/${notif.id}`)}
                >
                  <IonCardContent>
                    <div className="notification-header">
                      <div className="notification-type">
                        <span className="type-icon">{getNotificationIcon(notif.type)}</span>
                        <IonBadge color={notif.type === 'emergency' ? 'danger' : 'primary'}>
                          {notif.type}
                        </IonBadge>
                      </div>
                      {user?.role === 'admin' && (
                        <div className="notification-actions">
                          <IonButton
                            fill="clear"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              history.push(`/edit-notification/${notif.id}`);
                            }}
                          >
                            <IonIcon slot="icon-only" icon={createOutline} />
                          </IonButton>
                          <IonButton
                            fill="clear"
                            color="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteAlert({ show: true, id: notif.id });
                            }}
                          >
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonButton>
                        </div>
                      )}
                    </div>

                    <h2>{notif.title}</h2>
                    <div className="notification-content">
                      <p>
                        {isExpanded(notif.id)
                          ? notif.content
                          : `${notif.content.substring(0, 150)}${shouldShowToggle(notif.content) ? '...' : ''}`
                        }
                      </p>
                      {shouldShowToggle(notif.content) && (
                        <button
                          className="show-more-btn"
                          onClick={(e) => toggleExpanded(notif.id, e)}
                        >
                          {isExpanded(notif.id) ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>

                    {notif.thumbnailPath && (
                      <img
                        src={getMediaUrl(notif.thumbnailPath)}
                        alt={notif.title}
                        className="notification-image"
                      />
                    )}

                    <div className="notification-footer">
                      <small>{formatDate(notif.createdAt)}</small>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>

          <IonToast
            isOpen={toast.show}
            message={toast.message}
            duration={3000}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, show: false })}
          />

          <IonAlert
            isOpen={deleteAlert.show}
            onDidDismiss={() => setDeleteAlert({ show: false, id: 0 })}
            header="Delete Notification"
            message="Are you sure you want to delete this notification?"
            buttons={[
              { text: 'Cancel', role: 'cancel' },
              {
                text: 'Delete',
                role: 'destructive',
                handler: () => handleDelete(deleteAlert.id)
              }
            ]}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Notifications;
