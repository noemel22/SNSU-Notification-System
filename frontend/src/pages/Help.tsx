import React from 'react';
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
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import {
  helpCircleOutline,
  mailOutline,
  callOutline,
  globeOutline,
  helpOutline,
  chatbubbleEllipsesOutline,
  informationCircleOutline
} from 'ionicons/icons';
import Sidebar from '../components/Sidebar';
import './Help.css';

const Help: React.FC = () => {
  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Change Password, enter your current password and then your new password twice to confirm.'
    },
    {
      question: 'How can I update my profile picture?',
      answer: 'Navigate to My Profile, then click the "Change Photo" button below your avatar to upload a new image.'
    },
    {
      question: 'How do I receive push notifications?',
      answer: 'Enable Push Notifications in Settings > Notifications. Make sure your device allows notifications from this app.'
    },
    {
      question: 'Who can I message in the app?',
      answer: 'You can send messages to all users in the system. Messages are visible to everyone in the group chat.'
    }
  ];

  const handleContactClick = (type: string, value: string) => {
    switch (type) {
      case 'email':
        window.location.href = `mailto:${value}`;
        break;
      case 'phone':
        window.location.href = `tel:${value}`;
        break;
      case 'web':
        window.open(`https://${value}`, '_blank');
        break;
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
            <IonTitle>Help & Support</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="help-container">
            {/* Main Help Card */}
            <IonCard className="help-card">
              <IonCardContent>
                {/* Header */}
                <div className="help-header">
                  <div className="help-icon-wrapper">
                    <IonIcon icon={helpCircleOutline} />
                  </div>
                  <h1>Need Help?</h1>
                  <p>
                    We're here to assist you! Browse our FAQs below or contact our support team through any of the following channels.
                  </p>
                </div>

                {/* Contact Options */}
                <IonList className="contact-list">
                  <IonItem
                    button
                    className="contact-item"
                    onClick={() => handleContactClick('email', 'support@snsu.edu.ph')}
                  >
                    <div className="contact-icon-wrapper email" slot="start">
                      <IonIcon icon={mailOutline} />
                    </div>
                    <IonLabel>
                      <h3>Email Support</h3>
                      <p>support@snsu.edu.ph</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem
                    button
                    className="contact-item"
                    onClick={() => handleContactClick('phone', '+639123456789')}
                  >
                    <div className="contact-icon-wrapper phone" slot="start">
                      <IonIcon icon={callOutline} />
                    </div>
                    <IonLabel>
                      <h3>Phone Support</h3>
                      <p>+63 912 345 6789</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem
                    button
                    className="contact-item"
                    onClick={() => handleContactClick('web', 'www.snsu.edu.ph')}
                  >
                    <div className="contact-icon-wrapper web" slot="start">
                      <IonIcon icon={globeOutline} />
                    </div>
                    <IonLabel>
                      <h3>Website</h3>
                      <p>www.snsu.edu.ph</p>
                    </IonLabel>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* FAQ Section */}
            <IonCard className="help-card faq-section">
              <IonCardContent>
                <div className="section-title">
                  <IonIcon icon={chatbubbleEllipsesOutline} />
                  <h2>Frequently Asked Questions</h2>
                </div>

                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div className="faq-question">
                      <IonIcon icon={helpOutline} />
                      <span>{faq.question}</span>
                    </div>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                ))}
              </IonCardContent>
            </IonCard>

            {/* App Info */}
            <div className="app-info">
              <span className="version">SNSU Notification System v1.0.0</span>
              <p>© 2024 Surigao del Norte State University</p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Help;
