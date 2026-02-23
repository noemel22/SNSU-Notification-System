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
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonModal
} from '@ionic/react';
import {
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  timeOutline
} from 'ionicons/icons';
import Sidebar from '../components/Sidebar';
import { notificationService } from '../services/api';
import { useHistory } from 'react-router-dom';
import './Calendar.css';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  eventDate?: string;
  timestamp: string;
  imagePath?: string;
  thumbnailPath?: string;
}

const Calendar: React.FC = () => {
  const history = useHistory();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Notification[]>([]);
  const [showEventsModal, setShowEventsModal] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    // Filter events for the current month - include ALL notifications with eventDate
    const monthEvents = notifications.filter(n => {
      if (!n.eventDate) return false; // Only need eventDate, remove type === 'event' restriction
      const eventDate = new Date(n.eventDate);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
    setEvents(monthEvents);
  }, [notifications, currentDate]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setToast({ show: true, message: 'Error loading calendar events', color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadNotifications();
    event.detail.complete();
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (day: number) => {
    return events.filter(event => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      return eventDate.getDate() === day;
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents = getEventsForDate(day);
    setSelectedDate(clickedDate);
    setSelectedEvents(dayEvents);
    if (dayEvents.length > 0) {
      setShowEventsModal(true);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'event': 'success',
      'info': 'primary',
      'emergency': 'danger',
      'success': 'success',
      'warning': 'warning'
    };
    return colors[type] || 'medium';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const upcomingEvents = notifications
    .filter(n => n.type === 'event' && n.eventDate && new Date(n.eventDate) >= new Date())
    .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
    .slice(0, 5);

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Calendar</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <div className="calendar-page-container">
            {/* Month Navigation */}
            <IonCard className="calendar-card">
              <IonCardContent>
                <div className="calendar-header">
                  <IonButton fill="clear" onClick={() => navigateMonth(-1)}>
                    <IonIcon icon={chevronBackOutline} />
                  </IonButton>
                  <div className="calendar-title">
                    <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                    <IonButton fill="clear" size="small" onClick={goToToday}>
                      Today
                    </IonButton>
                  </div>
                  <IonButton fill="clear" onClick={() => navigateMonth(1)}>
                    <IonIcon icon={chevronForwardOutline} />
                  </IonButton>
                </div>

                {/* Calendar Grid */}
                {isLoading ? (
                  <div className="calendar-skeleton">
                    <IonSkeletonText animated style={{ height: '300px' }} />
                  </div>
                ) : (
                  <>
                    <div className="calendar-weekdays">
                      {dayNames.map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>
                    <div className="calendar-grid">
                      {calendarDays.map((day, index) => {
                        const dayEvents = day ? getEventsForDate(day) : [];
                        return (
                          <div
                            key={index}
                            className={`calendar-day ${day ? 'active' : 'empty'} ${day && isToday(day) ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                            onClick={() => day && handleDateClick(day)}
                          >
                            {day && (
                              <>
                                <span className="day-number">{day}</span>
                                {dayEvents.length > 0 && (
                                  <div className="event-dots">
                                    {dayEvents.slice(0, 3).map((event, i) => (
                                      <span
                                        key={i}
                                        className={`event-dot ${getTypeColor(event.type)}`}
                                      />
                                    ))}
                                    {dayEvents.length > 3 && (
                                      <span className="more-events">+{dayEvents.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </IonCardContent>
            </IonCard>

            {/* Upcoming Events */}
            <IonCard>
              <IonCardContent>
                <h3 className="section-title">
                  <IonIcon icon={calendarOutline} />
                  Upcoming Events
                </h3>
                {upcomingEvents.length === 0 ? (
                  <div className="no-events">
                    <IonIcon icon={calendarOutline} />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  <div className="upcoming-events-list">
                    {upcomingEvents.map(event => (
                      <div
                        key={event.id}
                        className="upcoming-event-item"
                        onClick={() => history.push(`/notification/${event.id}`)}
                      >
                        <div className="event-date-badge">
                          <span className="event-month">
                            {new Date(event.eventDate!).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="event-day">
                            {new Date(event.eventDate!).getDate()}
                          </span>
                        </div>
                        <div className="event-info">
                          <h4>{event.title}</h4>
                          <p>
                            <IonIcon icon={timeOutline} />
                            {formatEventTime(event.eventDate!)}
                          </p>
                        </div>
                        <IonBadge color={getTypeColor(event.type)}>{event.type}</IonBadge>
                      </div>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>

          {/* Events Modal */}
          <IonModal isOpen={showEventsModal} onDidDismiss={() => setShowEventsModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>
                  {selectedDate ? formatDate(selectedDate) : 'Events'}
                </IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowEventsModal(false)}>
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div className="events-modal-content">
                {selectedEvents.length === 0 ? (
                  <div className="no-events-modal">
                    <IonIcon icon={calendarOutline} />
                    <p>No events on this day</p>
                  </div>
                ) : (
                  selectedEvents.map(event => (
                    <IonCard
                      key={event.id}
                      button
                      onClick={() => {
                        setShowEventsModal(false);
                        history.push(`/notification/${event.id}`);
                      }}
                    >
                      <IonCardContent>
                        <div className="modal-event-item">
                          <div className="modal-event-header">
                            <h3>{event.title}</h3>
                            <IonBadge color={getTypeColor(event.type)}>{event.type}</IonBadge>
                          </div>
                          <p className="modal-event-time">
                            <IonIcon icon={timeOutline} />
                            {formatEventTime(event.eventDate!)}
                          </p>
                          <p className="modal-event-content">
                            {event.content.length > 100
                              ? `${event.content.substring(0, 100)}...`
                              : event.content}
                          </p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))
                )}
              </div>
            </IonContent>
          </IonModal>

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

export default Calendar;
