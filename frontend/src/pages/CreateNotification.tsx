import React, { useState } from 'react';
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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonLoading,
  IonIcon,
  IonNote,
  IonDatetime,
  IonModal
} from '@ionic/react';
import { sendOutline, imageOutline, calendarOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { notificationService } from '../services/api';
import Sidebar from '../components/Sidebar';
import './CreateNotification.css';

const CreateNotification: React.FC = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    eventDate: ''
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [errors, setErrors] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.content.length < 10) newErrors.content = 'Content must be at least 10 characters';
    if (formData.type === 'event' && !formData.eventDate) {
      newErrors.eventDate = 'Event date is required for events';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('type', formData.type);
      if (formData.eventDate) {
        formDataToSend.append('eventDate', formData.eventDate);
      }
      if (image) {
        formDataToSend.append('image', image);
      }

      await notificationService.createNotification(formDataToSend);
      setToast({ show: true, message: 'Notification created successfully!', color: 'success' });
      setTimeout(() => history.push('/notifications'), 1500);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error creating notification',
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearEventDate = () => {
    handleChange('eventDate', '');
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
            <IonTitle>Create Notification</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="create-notification-container">
            <IonCard className="notification-form-card">
              <IonCardContent>
                <form onSubmit={handleSubmit}>
                  {/* Title */}
                  <div className="form-field">
                    <IonLabel className="field-label">Title *</IonLabel>
                    <IonItem className={`input-item ${errors.title ? 'error' : ''}`} lines="none">
                      <IonInput
                        value={formData.title}
                        onIonInput={(e: any) => handleChange('title', e.target.value)}
                        placeholder="Enter notification title"
                        required
                      />
                    </IonItem>
                    {errors.title && (
                      <IonNote color="danger" className="error-message">{errors.title}</IonNote>
                    )}
                  </div>

                  {/* Type */}
                  <div className="form-field">
                    <IonLabel className="field-label">Type *</IonLabel>
                    <IonItem className="input-item" lines="none">
                      <IonSelect
                        value={formData.type}
                        onIonChange={(e) => handleChange('type', e.detail.value)}
                        interface="action-sheet"
                      >
                        <IonSelectOption value="info">📢 Information</IonSelectOption>
                        <IonSelectOption value="event">📅 Event</IonSelectOption>
                        <IonSelectOption value="emergency">🚨 Emergency</IonSelectOption>
                        <IonSelectOption value="success">✅ Success</IonSelectOption>
                        <IonSelectOption value="warning">⚠️ Warning</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    <IonNote className="helper-text">
                      Choose the notification type
                    </IonNote>
                  </div>

                  {/* Event Date - Always visible */}
                  <div className="form-field">
                    <IonLabel className="field-label">
                      Schedule Date & Time {formData.type === 'event' ? '*' : '(Optional)'}
                    </IonLabel>
                    <IonItem
                      className={`input-item date-picker-item ${errors.eventDate ? 'error' : ''}`}
                      lines="none"
                      button
                      onClick={() => setShowDatePicker(true)}
                    >
                      <IonIcon icon={calendarOutline} slot="start" color="primary" />
                      <IonLabel className={formData.eventDate ? '' : 'placeholder'}>
                        {formData.eventDate
                          ? formatDisplayDate(formData.eventDate)
                          : 'Select date and time'}
                      </IonLabel>
                      {formData.eventDate && (
                        <IonButton
                          fill="clear"
                          slot="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearEventDate();
                          }}
                        >
                          <IonIcon icon={closeOutline} />
                        </IonButton>
                      )}
                    </IonItem>
                    {errors.eventDate && (
                      <IonNote color="danger" className="error-message">{errors.eventDate}</IonNote>
                    )}
                    <IonNote className="helper-text">
                      {formData.type === 'event'
                        ? 'When will this event take place?'
                        : 'Optional: Schedule when this notification should apply'}
                    </IonNote>

                    <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
                      <IonHeader>
                        <IonToolbar>
                          <IonTitle>Select Date & Time</IonTitle>
                          <IonButtons slot="end">
                            <IonButton onClick={() => setShowDatePicker(false)}>Done</IonButton>
                          </IonButtons>
                        </IonToolbar>
                      </IonHeader>
                      <IonContent className="date-picker-content">
                        <IonDatetime
                          presentation="date-time"
                          value={formData.eventDate || undefined}
                          onIonChange={(e) => {
                            handleChange('eventDate', e.detail.value);
                          }}
                          min={new Date().toISOString()}
                          className="date-picker-datetime"
                        />
                      </IonContent>
                    </IonModal>
                  </div>

                  {/* Content */}
                  <div className="form-field">
                    <IonLabel className="field-label">Content *</IonLabel>
                    <IonItem className={`input-item textarea-item ${errors.content ? 'error' : ''}`} lines="none">
                      <IonTextarea
                        value={formData.content}
                        onIonInput={(e: any) => handleChange('content', e.target.value)}
                        placeholder="Enter notification content..."
                        rows={5}
                        required
                      />
                    </IonItem>
                    {errors.content && (
                      <IonNote color="danger" className="error-message">{errors.content}</IonNote>
                    )}
                    <IonNote className="helper-text">
                      Minimum 10 characters
                    </IonNote>
                  </div>

                  {/* Image Upload */}
                  <div className="form-field">
                    <IonLabel className="field-label">Image (Optional)</IonLabel>
                    <div className="image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        id="image-upload"
                        style={{ display: 'none' }}
                      />
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="upload-button"
                      >
                        <IonIcon slot="start" icon={imageOutline} />
                        {image ? 'Change Image' : 'Upload Image'}
                      </IonButton>
                    </div>
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <IonButton
                          fill="clear"
                          size="small"
                          className="remove-image-btn"
                          onClick={() => {
                            setImage(null);
                            setImagePreview('');
                          }}
                        >
                          <IonIcon icon={closeOutline} />
                        </IonButton>
                      </div>
                    )}
                    <IonNote className="helper-text">
                      Max size: 5MB. Formats: JPG, PNG, GIF
                    </IonNote>
                  </div>

                  {/* Submit Button */}
                  <IonButton
                    expand="block"
                    type="submit"
                    className="submit-button"
                    disabled={isLoading}
                  >
                    <IonIcon slot="start" icon={sendOutline} />
                    Send Notification
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => history.goBack()}
                    disabled={isLoading}
                    className="cancel-button"
                  >
                    Cancel
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          </div>

          <IonLoading isOpen={isLoading} message="Creating notification..." />
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

export default CreateNotification;
