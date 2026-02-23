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
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonButton,
  useIonRouter
} from '@ionic/react';
import {
  peopleOutline,
  mailOutline,
  callOutline,
  schoolOutline,
  chatbubbleOutline,
  personCircleOutline
} from 'ionicons/icons';
import Sidebar from '../components/Sidebar';
import { userService, getMediaUrl } from '../services/api';
import './Students.css';

interface Student {
  id: number;
  username: string;
  email: string;
  phone: string;
  profilePicture?: string;
  course?: string;
  yearLevel?: number;
  onlineStatus: boolean;
}

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const router = useIonRouter();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchText]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getUsers();
      setStudents(response.data.students || []);
    } catch (error) {
      setToast({ show: true, message: 'Error loading students', color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchText) {
      filtered = filtered.filter(student =>
        student.username.toLowerCase().includes(searchText.toLowerCase()) ||
        student.email.toLowerCase().includes(searchText.toLowerCase()) ||
        student.course?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const handleRefresh = async (event: any) => {
    await loadStudents();
    event.detail.complete();
  };

  const handleMessageStudent = (username: string) => {
    // Navigate to messages with the student mentioned
    router.push(`/messages?mention=${encodeURIComponent(username)}`, 'forward', 'push');
  };

  const getProfilePictureUrl = (profilePicture: string | undefined) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    return getMediaUrl(profilePicture);
  };

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>My Students</IonTitle>
          </IonToolbar>
          <IonToolbar>
            <IonSearchbar
              value={searchText}
              onIonInput={(e: any) => setSearchText(e.target.value)}
              placeholder="Search by name, email, or course..."
              animated
            />
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <div className="students-container">
            {/* Summary Card */}
            <IonCard className="summary-card">
              <IonCardContent>
                <div className="summary-content">
                  <div className="summary-icon">
                    <IonIcon icon={peopleOutline} />
                  </div>
                  <div className="summary-info">
                    <h2>Total Students</h2>
                    <p className="count">{isLoading ? '...' : filteredStudents.length}</p>
                    <p className="subtitle">
                      {searchText
                        ? `Showing ${filteredStudents.length} of ${students.length} students`
                        : 'Active in your classes'
                      }
                    </p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Students List */}
            {isLoading ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, index) => (
                <IonCard key={index} className="skeleton-card">
                  <IonCardContent>
                    <div className="skeleton-content">
                      <IonSkeletonText animated style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <IonSkeletonText animated style={{ width: '50%', height: '20px', marginBottom: '10px' }} />
                        <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '6px' }} />
                        <IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            ) : filteredStudents.length === 0 ? (
              // Empty State
              <IonCard className="student-card">
                <IonCardContent>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <IonIcon icon={peopleOutline} />
                    </div>
                    <h2>No Students Found</h2>
                    <p>
                      {searchText
                        ? 'Try adjusting your search terms'
                        : 'No students are currently registered in the system'
                      }
                    </p>
                  </div>
                </IonCardContent>
              </IonCard>
            ) : (
              // Student Cards
              filteredStudents.map((student) => (
                <IonCard key={student.id} className="student-card">
                  <IonCardContent>
                    <div className="student-card-content">
                      {/* Avatar */}
                      <div className="student-avatar">
                        {student.profilePicture ? (
                          <img
                            src={getProfilePictureUrl(student.profilePicture)!}
                            alt={student.username}
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="student-avatar-placeholder"
                          style={{ display: student.profilePicture ? 'none' : 'flex' }}
                        >
                          {student.username[0].toUpperCase()}
                        </div>
                        {student.onlineStatus && <div className="online-indicator" />}
                      </div>

                      {/* Info */}
                      <div className="student-info">
                        <div className="student-name-row">
                          <h3 className="student-name">{student.username}</h3>
                          {student.onlineStatus && (
                            <IonBadge color="success" className="online-badge">Online</IonBadge>
                          )}
                        </div>

                        <div className="student-details">
                          {student.course && (
                            <div className="course-badge">
                              <IonIcon icon={schoolOutline} />
                              <span>
                                {student.course}
                                {student.yearLevel && ` - Year ${student.yearLevel}`}
                              </span>
                            </div>
                          )}

                          <div className="detail-row">
                            <IonIcon icon={mailOutline} />
                            <span>{student.email}</span>
                          </div>

                          <div className="detail-row">
                            <IonIcon icon={callOutline} />
                            <span>{student.phone || 'No phone number'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="student-actions">
                        <IonButton
                          fill="outline"
                          color="primary"
                          size="small"
                          onClick={() => handleMessageStudent(student.username)}
                        >
                          <IonIcon icon={chatbubbleOutline} slot="start" />
                          Message
                        </IonButton>
                      </div>
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
        </IonContent>
      </IonPage>
    </>
  );
};

export default Students;
