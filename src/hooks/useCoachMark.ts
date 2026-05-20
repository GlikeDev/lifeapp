import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useCoachMark(key: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`coachmark_${key}`).then(val => {
      if (!val) setVisible(true);
    });
  }, [key]);

  function complete() {
    setVisible(false);
    AsyncStorage.setItem(`coachmark_${key}`, '1');
  }

  function reset() {
    AsyncStorage.removeItem(`coachmark_${key}`);
    setVisible(true);
  }

  return { visible, complete, reset };
}
