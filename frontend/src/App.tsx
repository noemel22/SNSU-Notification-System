import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import CreateNotification from './pages/CreateNotification';
import EditNotification from './pages/EditNotification';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ManageUsers from './pages/ManageUsers';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Help from './pages/Help';
import Calendar from './pages/Calendar';
import Students from './pages/Students';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Responsive styles */
import './styles/responsive.css';

/* Dark mode visibility fixes */
import './styles/dark-mode-fix.css';

setupIonicReact();

const PrivateRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

const AppRoutes: React.FC = () => {
  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />
        <PrivateRoute exact path="/dashboard" component={Dashboard} />
        <PrivateRoute exact path="/notifications" component={Notifications} />
        <PrivateRoute exact path="/notification/:id" component={NotificationDetail} />
        <PrivateRoute exact path="/create-notification" component={CreateNotification} />
        <PrivateRoute exact path="/edit-notification/:id" component={EditNotification} />
        <PrivateRoute exact path="/profile" component={Profile} />
        <PrivateRoute exact path="/settings" component={Settings} />
        <PrivateRoute exact path="/manage-users" component={ManageUsers} />
        <PrivateRoute exact path="/create-user" component={CreateUser} />
        <PrivateRoute exact path="/edit-user/:id" component={EditUser} />
        <PrivateRoute path="/messages" component={Messages} />
        <PrivateRoute exact path="/analytics" component={Analytics} />
        <PrivateRoute exact path="/help" component={Help} />
        <PrivateRoute exact path="/calendar" component={Calendar} />
        <PrivateRoute exact path="/students" component={Students} />
        <Route exact path="/">
          <Redirect to="/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </IonApp>
);

export default App;
