import { Alert } from 'react-native';

export function alertNeedsConnection(action = 'This action') {
  Alert.alert(
    'Needs a connection',
    `${action} requires internet. Try again when you’re back online.`,
  );
}
