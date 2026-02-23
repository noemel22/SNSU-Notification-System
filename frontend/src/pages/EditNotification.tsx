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
  IonBackButton
} from '@ionic/react';
import { saveOutline, imageOutline, trashOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { notificationService, getMediaUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import './CreateNotification.css';

const EditNotification: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info'
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImage, setExistingImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    loadNotification();
  }, [id]);

  const loadNotification = async () => {
    try {
      setIsLoadingData(true);
      const response = await notificationService.getNotificationById(parseInt(id));
      const notification = response.data;

      setFormData({
        title: notification.title,
        content: notification.content,
        type: notification.type
      });

      if (notification.thumbnailPath) {
        setExistingImage(getMediaUrl(notification.thumbnailPath));
      }
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error loading notification',
        color: 'danger'
      });
      setTimeout(() => history.push('/notifications'), 2000);
    } finally {
      setIsLoadingData(false);
    }
  };

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
      setExistingImage('');
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview('');
    setExistingImage('');
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.content.length < 10) newErrors.content = 'Content must be at least 10 characters';

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
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('type', formData.type);
      if (image) {
        formDataToSend.append('image', image);
      }

      await notificationService.updateNotification(parseInt(id), formDataToSend);
      setToast({ show: true, message: 'Notification updated successfully!', color: 'success' });
      setTimeout(() => history.push('/notifications'), 1500);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.error || 'Error updating notification',
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Edit Notification</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonLoading isOpen={true} message="Loading notification..." />
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
            <IonTitle>Edit Notification</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="create-notification-container">
            <IonCard>
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

                  {/* Content */}
                  <div className="form-field">
                    <IonLabel className="field-label">Content *</IonLabel>
                    <IonItem className={`input-item ${errors.content ? 'error' : ''}`} lines="none">
                      <IonTextarea
                        value={formData.content}
                        onIonInput={(e: any) => handleChange('content', e.target.value)}
                        placeholder="Enter notification content..."
                        rows={6}
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

                    {/* Existing Image */}
                    {existingImage && !imagePreview && (
                      <div className="image-preview">
                        <img src={existingImage} alt="Current" />
                        <IonButton
                          fill="clear"
                          color="danger"
                          size="small"
                          onClick={handleRemoveImage}
                        >
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonButton>
                      </div>
                    )}

                    {/* New Image Preview */}
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <IonButton
                          fill="clear"
                          color="danger"
                          size="small"
                          onClick={handleRemoveImage}
                        >
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonButton>
                      </div>
                    )}

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
                      >
                        <IonIcon slot="start" icon={imageOutline} />
                        {existingImage || imagePreview ? 'Change Image' : 'Upload Image'}
                      </IonButton>
                    </div>
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
                    <IonIcon slot="start" icon={saveOutline} />
                    Update Notification
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => history.push('/notifications')}
                    disabled={isLoading}
                  >
                    Cancel
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          </div>

          <IonLoading isOpen={isLoading} message="Updating notification..." />
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

export default EditNotification;
