import React, { useState } from 'react';
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
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonToast,
  IonAlert,
  IonInput,
  IonNote
} from '@ionic/react';
import {
  lockClosedOutline,
  logOutOutline,
  keyOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import Sidebar from '../components/Sidebar';
import './Settings.css';

const Settings: React.FC = () => {
  const history = useHistory();
  const { logout } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<any>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const handleLogout = () => {
    logout();
    history.replace('/login');
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordChange = () => {
    const errors: any = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword && passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordChange()) {
      setToast({ show: true, message: 'Please fix all errors', color: 'danger' });
      return;
    }

    setIsChangingPassword(true);

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setToast({ show: true, message: 'Password changed successfully!', color: 'success' });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error changing password',
        color: 'danger'
      });
    } finally {
      setIsChangingPassword(false);
    }
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
            <IonTitle>Settings</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="settings-container">
            {/* Password Change */}
            <IonCard>
              <IonCardContent>
                <div className="settings-section-title">
                  <IonIcon icon={keyOutline} />
                  <h2>Change Password</h2>
                </div>
                <IonList>
                  <IonItem className={passwordErrors.currentPassword ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Current Password *</IonLabel>
                    <IonInput
                      type="password"
                      value={passwordData.currentPassword}
                      onIonInput={(e: any) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </IonItem>
                  {passwordErrors.currentPassword && (
                    <IonNote color="danger" style={{ display: 'block', padding: '4px 16px' }}>
                      {passwordErrors.currentPassword}
                    </IonNote>
                  )}

                  <IonItem className={passwordErrors.newPassword ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">New Password *</IonLabel>
                    <IonInput
                      type="password"
                      value={passwordData.newPassword}
                      onIonInput={(e: any) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </IonItem>
                  {passwordErrors.newPassword && (
                    <IonNote color="danger" style={{ display: 'block', padding: '4px 16px' }}>
                      {passwordErrors.newPassword}
                    </IonNote>
                  )}

                  <IonItem className={passwordErrors.confirmPassword ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Confirm New Password *</IonLabel>
                    <IonInput
                      type="password"
                      value={passwordData.confirmPassword}
                      onIonInput={(e: any) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </IonItem>
                  {passwordErrors.confirmPassword && (
                    <IonNote color="danger" style={{ display: 'block', padding: '4px 16px' }}>
                      {passwordErrors.confirmPassword}
                    </IonNote>
                  )}
                </IonList>
                <IonButton
                  expand="block"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  style={{ marginTop: '16px' }}
                >
                  <IonIcon slot="start" icon={lockClosedOutline} />
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </IonButton>
              </IonCardContent>
            </IonCard>

            {/* Account Actions */}
            <IonCard>
              <IonCardContent>
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={() => setShowLogoutAlert(true)}
                >
                  <IonIcon slot="start" icon={logOutOutline} />
                  Logout
                </IonButton>
              </IonCardContent>
            </IonCard>

            {/* App Info */}
            <div className="app-info">
              <p>SNSU Notification System</p>
              <p>Version 1.0.0</p>
              <p>© 2025 SNSU. All rights reserved.</p>
            </div>
          </div>

          <IonToast
            isOpen={toast.show}
            message={toast.message}
            duration={2000}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, show: false })}
          />

          <IonAlert
            isOpen={showLogoutAlert}
            onDidDismiss={() => setShowLogoutAlert(false)}
            header="Logout"
            message="Are you sure you want to logout?"
            buttons={[
              { text: 'Cancel', role: 'cancel' },
              { text: 'Logout', role: 'destructive', handler: handleLogout }
            ]}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Settings;
