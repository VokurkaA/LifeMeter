import { RootParamList } from '@/types/types';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<RootParamList>();

type NavArgs<RouteName extends keyof RootParamList> = undefined extends RootParamList[RouteName]
  ? [routeName: RouteName] | [routeName: RouteName, params: RootParamList[RouteName]]
  : [routeName: RouteName, params: RootParamList[RouteName]];

export function navigate<RouteName extends keyof RootParamList>(...args: NavArgs<RouteName>) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(...(args as any));
  }
}
