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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAvatar,
  IonToast,
  IonLoading,
  IonNote,
  IonBadge
} from '@ionic/react';
import {
  saveOutline,
  cameraOutline,
  personOutline,
  mailOutline,
  callOutline,
  schoolOutline,
  briefcaseOutline
} from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { userService, getMediaUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    department: '',
    course: '',
    yearLevel: '',
    bio: ''
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        course: user.course || '',
        yearLevel: user.yearLevel?.toString() || '',
        bio: user.bio || ''
      });
      if (user.profilePicture) {
        setPreviewUrl(getMediaUrl(user.profilePicture));
      }
    }
  }, [user]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) {
        setToast({ show: true, message: 'Image must be less than 5MB', color: 'warning' });
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!/^\+639\d{9}$/.test(formData.phone)) newErrors.phone = 'Phone format: +639XXXXXXXXX';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setToast({ show: true, message: 'Please fix all errors', color: 'danger' });
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);

      if (user?.role === 'teacher' && formData.department) {
        formDataToSend.append('department', formData.department);
      }
      if (user?.role === 'student') {
        if (formData.course) formDataToSend.append('course', formData.course);
        if (formData.yearLevel) formDataToSend.append('yearLevel', formData.yearLevel);
      }
      if (formData.bio) formDataToSend.append('bio', formData.bio);
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      const response = await userService.updateProfile(formDataToSend);

      // Update auth context with new user data including profile picture
      if (updateUser && response.data.user) {
        updateUser(response.data.user);

        // Also update localStorage to persist the profile picture
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setToast({ show: true, message: 'Profile updated successfully!', color: 'success' });

      // Force component to re-render by updating preview
      if (response.data.user?.profilePicture) {
        setPreviewUrl(response.data.user.profilePicture.startsWith('http')
          ? response.data.user.profilePicture
          : getMediaUrl(response.data.user.profilePicture)
        );
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error updating profile',
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
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
            <IonTitle>My Profile</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="profile-container">
            {/* Profile Header */}
            <IonCard className="profile-header-card">
              <IonCardContent>
                <div className="profile-header">
                  <div className="profile-avatar-section">
                    <IonAvatar className="profile-avatar-large">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Profile" />
                      ) : (
                        <div className="avatar-placeholder-large">
                          {user?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </IonAvatar>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      id="profile-picture-upload"
                      style={{ display: 'none' }}
                    />
                    <IonButton
                      size="small"
                      onClick={() => document.getElementById('profile-picture-upload')?.click()}
                      className="change-photo-btn"
                    >
                      <IonIcon slot="start" icon={cameraOutline} />
                      Change Photo
                    </IonButton>
                  </div>
                  <div className="profile-header-info">
                    <h2>{user?.username}</h2>
                    <IonBadge color={user?.role === 'admin' ? 'danger' : user?.role === 'teacher' ? 'primary' : 'success'}>
                      {user?.role}
                    </IonBadge>
                    {user?.role === 'teacher' && user?.department && (
                      <p className="profile-meta">{user.department}</p>
                    )}
                    {user?.role === 'student' && user?.course && (
                      <p className="profile-meta">{user.course} - Year {user.yearLevel}</p>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Profile Form */}
            <IonCard>
              <IonCardContent>
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h3>Personal Information</h3>

                    {/* Username */}
                    <div className="form-field">
                      <IonLabel className="field-label">
                        <IonIcon icon={personOutline} /> Username *
                      </IonLabel>
                      <IonItem className={`input-item ${errors.username ? 'error' : ''}`} lines="none">
                        <IonInput
                          value={formData.username}
                          onIonInput={(e: any) => handleChange('username', e.target.value)}
                          placeholder="Enter username"
                        />
                      </IonItem>
                      {errors.username && (
                        <IonNote color="danger" className="error-message">{errors.username}</IonNote>
                      )}
                    </div>

                    {/* Email */}
                    <div className="form-field">
                      <IonLabel className="field-label">
                        <IonIcon icon={mailOutline} /> Email *
                      </IonLabel>
                      <IonItem className={`input-item ${errors.email ? 'error' : ''}`} lines="none">
                        <IonInput
                          type="email"
                          value={formData.email}
                          onIonInput={(e: any) => handleChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          inputmode="email"
                        />
                      </IonItem>
                      {errors.email && (
                        <IonNote color="danger" className="error-message">{errors.email}</IonNote>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="form-field">
                      <IonLabel className="field-label">
                        <IonIcon icon={callOutline} /> Phone *
                      </IonLabel>
                      <IonItem className={`input-item ${errors.phone ? 'error' : ''}`} lines="none">
                        <IonInput
                          type="tel"
                          value={formData.phone}
                          onIonInput={(e: any) => handleChange('phone', e.target.value)}
                          placeholder="+639XXXXXXXXX"
                          inputmode="tel"
                        />
                      </IonItem>
                      {errors.phone ? (
                        <IonNote color="danger" className="error-message">{errors.phone}</IonNote>
                      ) : (
                        <IonNote className="helper-text">Philippine mobile format</IonNote>
                      )}
                    </div>
                  </div>

                  {/* Role-specific fields */}
                  {user?.role === 'teacher' && (
                    <div className="form-section">
                      <h3>Professional Information</h3>
                      <div className="form-field">
                        <IonLabel className="field-label">
                          <IonIcon icon={briefcaseOutline} /> Department
                        </IonLabel>
                        <IonItem className="input-item" lines="none">
                          <IonInput
                            value={formData.department}
                            onIonInput={(e: any) => handleChange('department', e.target.value)}
                            placeholder="e.g., Computer Science"
                          />
                        </IonItem>
                      </div>
                    </div>
                  )}

                  {user?.role === 'student' && (
                    <div className="form-section">
                      <h3>Academic Information</h3>
                      <div className="form-field">
                        <IonLabel className="field-label">
                          <IonIcon icon={schoolOutline} /> Course
                        </IonLabel>
                        <IonItem className="input-item" lines="none">
                          <IonInput
                            value={formData.course}
                            onIonInput={(e: any) => handleChange('course', e.target.value)}
                            placeholder="e.g., BS Computer Science"
                          />
                        </IonItem>
                      </div>
                      <div className="form-field">
                        <IonLabel className="field-label">Year Level</IonLabel>
                        <IonItem className="input-item" lines="none">
                          <IonInput
                            type="number"
                            value={formData.yearLevel}
                            onIonInput={(e: any) => handleChange('yearLevel', e.target.value)}
                            placeholder="1-4"
                            min="1"
                            max="4"
                          />
                        </IonItem>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  <div className="form-section">
                    <h3>About Me</h3>
                    <div className="form-field">
                      <IonLabel className="field-label">Bio</IonLabel>
                      <IonItem className="input-item" lines="none">
                        <IonTextarea
                          value={formData.bio}
                          onIonInput={(e: any) => handleChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                      </IonItem>
                      <IonNote className="helper-text">Optional</IonNote>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <IonButton
                    expand="block"
                    type="submit"
                    className="save-button"
                    disabled={isLoading}
                  >
                    <IonIcon slot="start" icon={saveOutline} />
                    Save Changes
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          </div>

          <IonLoading isOpen={isLoading} message="Updating profile..." />
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

export default Profile;
