import { useAppSelector } from './useRedux';

export const useAuth = () => {
  const { user, token } = useAppSelector((state) => state.auth);

  return {
    user,
    userToken: token,
    isAuthenticated: !!token,
  };
};
