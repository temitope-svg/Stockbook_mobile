import { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppTabs } from '../features/app/AppTabs';
import { ForgotPasswordScreen } from '../features/auth/ForgotPasswordScreen';
import { InviteAcceptScreen } from '../features/auth/InviteAcceptScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { SignUpScreen } from '../features/auth/SignUpScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { SplashScreen } from '../features/splash/SplashScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  const { session, profile, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  if (loading || !splashDone) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <SplashScreen isReady={!loading} onFinish={handleSplashFinish} />
      </>
    );
  }

  const isAuthed = !!session && !!profile;
  const needsOnboarding = !!session && !profile;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {isAuthed ? (
        <Stack.Screen name="AppHome" component={AppTabs} />
      ) : needsOnboarding ? (
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      ) : (
        <>
          <Stack.Screen name="Welcome">
            {({ navigation }) => (
              <HomeScreen
                onGetStarted={() => navigation.navigate('SignUp')}
                onSignIn={() => navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="InviteAccept" component={InviteAcceptScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
