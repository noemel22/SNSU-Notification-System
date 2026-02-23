import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonCard,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonToast,
  IonLoading,
  IonAlert
} from '@ionic/react';
import { createOutline, trashOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService, getMediaUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import './NotificationDetail.css';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  imagePath?: string;
  thumbnailPath?: string;
  timestamp: string;
  createdAt: string;
}

const NotificationDetail: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  useEffect(() => {
    loadNotification();
  }, [id]);

  const loadNotification = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotificationById(parseInt(id));
      setNotification(response.data);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error loading notification',
        color: 'danger'
      });
      setTimeout(() => history.push('/notifications'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await notificationService.deleteNotification(parseInt(id));
      setToast({ show: true, message: 'Notification deleted successfully', color: 'success' });
      setTimeout(() => history.push('/notifications'), 1500);
    } catch (error) {
      setToast({ show: true, message: 'Error deleting notification', color: 'danger' });
    }
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      info: 'primary',
      event: 'warning',
      emergency: 'danger',
      success: 'success',
      warning: 'warning'
    };
    return colors[type] || 'primary';
  };

  const shouldShowContentToggle = (content: string) => content.length > 500;

  const getDisplayContent = (content: string) => {
    if (shouldShowContentToggle(content) && !isContentExpanded) {
      return content.substring(0, 500) + '...';
    }
    return content;
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonBackButton defaultHref="/notifications" />
              </IonButtons>
              <IonTitle>Notification Details</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonLoading isOpen={true} message="Loading notification..." />
          </IonContent>
        </IonPage>
      </>
    );
  }

  if (!notification) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonBackButton defaultHref="/notifications" />
              </IonButtons>
              <IonTitle>Notification Not Found</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="empty-state">
              <h2>Notification not found</h2>
            </div>
          </IonContent>
        </IonPage>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/notifications" />
            </IonButtons>
            <IonTitle>Notification Details</IonTitle>
            {user?.role === 'admin' && (
              <IonButtons slot="end">
                <IonButton onClick={() => history.push(`/edit-notification/${notification.id}`)}>
                  <IonIcon slot="icon-only" icon={createOutline} />
                </IonButton>
                <IonButton onClick={() => setDeleteAlert(true)} color="danger">
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonButtons>
            )}
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="notification-detail-container">
            <IonCard className={`notification-detail-card notification-${notification.type}`}>
              <IonCardContent>
                {/* Header Section */}
                <div className="detail-header">
                  <div className="type-badge">
                    <span className="type-icon-large">{getNotificationIcon(notification.type)}</span>
                    <IonBadge color={getTypeColor(notification.type)} className="type-badge-large">
                      {notification.type.toUpperCase()}
                    </IonBadge>
                  </div>
                </div>

                {/* Title */}
                <h1 className="notification-title">{notification.title}</h1>

                {/* Metadata */}
                <div className="notification-meta">
                  <div className="meta-item">
                    <IonIcon icon={calendarOutline} />
                    <span>{formatDate(notification.createdAt)}</span>
                  </div>
                </div>

                {/* Image */}
                {notification.imagePath && (
                  <div className="notification-image-container">
                    <img
                      src={getMediaUrl(notification.imagePath)}
                      alt={notification.title}
                      className="notification-detail-image"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="notification-content-full">
                  <h3>Details</h3>
                  <p className="content-text">{getDisplayContent(notification.content)}</p>
                  {shouldShowContentToggle(notification.content) && (
                    <button
                      className="show-more-btn-detail"
                      onClick={() => setIsContentExpanded(!isContentExpanded)}
                    >
                      {isContentExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>

                {/* Action Buttons for Admin */}
                {user?.role === 'admin' && (
                  <div className="detail-actions">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => history.push(`/edit-notification/${notification.id}`)}
                    >
                      <IonIcon slot="start" icon={createOutline} />
                      Edit Notification
                    </IonButton>
                    <IonButton
                      expand="block"
                      fill="outline"
                      color="danger"
                      onClick={() => setDeleteAlert(true)}
                    >
                      <IonIcon slot="start" icon={trashOutline} />
                      Delete Notification
                    </IonButton>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>

          <IonToast
            isOpen={toast.show}
            message={toast.message}
            duration={3000}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, show: false })}
          />

          <IonAlert
            isOpen={deleteAlert}
            onDidDismiss={() => setDeleteAlert(false)}
            header="Delete Notification"
            message="Are you sure you want to delete this notification? This action cannot be undone."
            buttons={[
              { text: 'Cancel', role: 'cancel' },
              {
                text: 'Delete',
                role: 'destructive',
                handler: handleDelete
              }
            ]}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default NotificationDetail;
