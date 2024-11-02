import { useLocalSearchParams, Routes, RouteParams } from 'expo-router';

export const useTypedLocalSearchParams = <Route extends Routes>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  route: Route,
) => {
  return useLocalSearchParams<RouteParams<Route>>();
};
