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
  IonSearchbar,
  IonBadge,
  IonAvatar,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonFab,
  IonFabButton,
  IonToggle
} from '@ionic/react';
import {
  addOutline,
  refreshOutline,
  createOutline,
  personOutline,
  checkmarkCircleOutline,
  banOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { userService, getMediaUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import './ManageUsers.css';

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  department?: string;
  course?: string;
  yearLevel?: number;
  profilePicture?: string;
  createdAt: string;
  isActive?: boolean;
}

const ManageUsers: React.FC = () => {
  const history = useHistory();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchText, filterRole]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getAllUsers();
      console.log('Users loaded:', response.data);

      // API returns {teachers: [], students: [], admins: []}
      // Combine them into one array, default isActive to true if not set
      const allUsers = [
        ...(response.data.admins || []).map((u: User) => ({ ...u, isActive: u.isActive !== false })),
        ...(response.data.teachers || []).map((u: User) => ({ ...u, isActive: u.isActive !== false })),
        ...(response.data.students || []).map((u: User) => ({ ...u, isActive: u.isActive !== false }))
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setToast({ show: true, message: 'Error loading users', color: 'danger' });
      setUsers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    // Ensure users is an array
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    if (searchText) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      // Update locally for instant feedback (optimistic update)
      setUsers(users.map(u =>
        u.id === userId ? { ...u, isActive: !currentStatus } : u
      ));

      // TODO: Add API call to persist status change
      // await userService.updateUserStatus(userId, !currentStatus);

      setToast({
        show: true,
        message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        color: 'success'
      });
    } catch (error) {
      // Revert on error
      setUsers(users.map(u =>
        u.id === userId ? { ...u, isActive: currentStatus } : u
      ));
      setToast({ show: true, message: 'Error updating user status', color: 'danger' });
    }
  };

  const handleRefresh = async (event: any) => {
    await loadUsers();
    event.detail.complete();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      admin: 'danger',
      teacher: 'primary',
      student: 'success'
    };
    return colors[role] || 'medium';
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
            <IonTitle>Manage Users</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={loadUsers}>
                <IonIcon icon={refreshOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>

          <IonToolbar>
            <IonSearchbar
              value={searchText}
              onIonInput={(e: any) => setSearchText(e.target.value)}
              placeholder="Search users..."
              animated
            />
          </IonToolbar>

          <IonToolbar>
            <IonSegment value={filterRole} onIonChange={(e: any) => setFilterRole(e.detail.value)}>
              <IonSegmentButton value="all">
                <IonLabel>All ({Array.isArray(users) ? users.length : 0})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="admin">
                <IonLabel>Admins ({Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="teacher">
                <IonLabel>Teachers ({Array.isArray(users) ? users.filter(u => u.role === 'teacher').length : 0})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="student">
                <IonLabel>Students ({Array.isArray(users) ? users.filter(u => u.role === 'student').length : 0})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <div className="users-container">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <IonCard key={index}>
                  <IonCardContent>
                    <div className="user-card-loading">
                      <IonSkeletonText animated style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <IonSkeletonText animated style={{ width: '60%', height: '20px' }} />
                        <IonSkeletonText animated style={{ width: '80%', height: '16px', marginTop: '8px' }} />
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={personOutline} size="large" />
                <h2>No users found</h2>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <IonCard key={user.id} className="user-card">
                  <IonCardContent>
                    <div className="user-card-content">
                      <IonAvatar className="user-avatar">
                        {user.profilePicture ? (
                          <img src={getMediaUrl(user.profilePicture)} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </IonAvatar>

                      <div className="user-info">
                        <div className="user-name-row">
                          <h3>{user.username}</h3>
                          <IonBadge color={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </IonBadge>
                        </div>
                        <p className="user-email">{user.email}</p>
                        <p className="user-phone">{user.phone}</p>
                        {user.role === 'teacher' && user.department && (
                          <p className="user-meta">📚 {user.department}</p>
                        )}
                        {user.role === 'student' && user.course && (
                          <p className="user-meta">🎓 {user.course} - Year {user.yearLevel}</p>
                        )}
                      </div>

                      <div className="user-actions">
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => history.push(`/edit-user/${user.id}`)}
                        >
                          <IonIcon slot="icon-only" icon={createOutline} />
                        </IonButton>
                        <div className="status-toggle">
                          <IonToggle
                            checked={user.isActive !== false}
                            onIonChange={() => toggleUserStatus(user.id, user.isActive !== false)}
                            color={user.isActive !== false ? 'success' : 'medium'}
                          />
                          <span className={`status-label ${user.isActive !== false ? 'active' : 'inactive'}`}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>

          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/create-user')}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>

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

export default ManageUsers;
