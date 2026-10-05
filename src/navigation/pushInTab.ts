import type { NavigationProp, ParamListBase } from '@react-navigation/native';

type Nav = NavigationProp<ParamListBase>;

/**
 * Open a screen inside a tab stack with the list root underneath.
 * Prevents Back from leaving the tab (e.g. Add product → Home loop).
 */
export function pushInTab(
  navigation: Nav,
  tabName: string,
  listScreen: string,
  targetScreen: string,
  params?: Record<string, unknown>,
) {
  if (targetScreen === listScreen) {
    navigation.navigate(tabName, {
      screen: listScreen,
    } as never);
    return;
  }

  navigation.navigate(tabName, {
    state: {
      routes: [
        { name: listScreen },
        { name: targetScreen, params },
      ],
      index: 1,
    },
  } as never);
}

/**
 * Back within a stack: pop when possible, otherwise land on the list root
 * instead of bubbling out of the tab to Home.
 */
export function goBackInStack(
  navigation: {
    getState: () => { index?: number } | undefined;
    goBack: () => void;
    navigate: (screen: string) => void;
  },
  listScreen: string,
) {
  const index = navigation.getState()?.index ?? 0;
  if (index > 0) {
    navigation.goBack();
    return;
  }
  navigation.navigate(listScreen);
}

/** After create/edit, show detail with list under it. */
export function resetToDetail(
  navigation: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reset: (state: any) => void;
  },
  listScreen: string,
  detailScreen: string,
  params: object,
) {
  navigation.reset({
    index: 1,
    routes: [{ name: listScreen }, { name: detailScreen, params }],
  });
}
