import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../lib/Auth';

export const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);
};
