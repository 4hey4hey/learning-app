import { useContext } from 'react';
import { StudyContext } from '../contexts/StudyContext';

export const useStudyPlan = () => {
  return useContext(StudyContext);
};
