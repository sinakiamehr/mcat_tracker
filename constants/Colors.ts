/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#007AFF';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#fff',
    border: '#E5E5E7',
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1C1C1E',
    border: '#38383A',
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
};

export const MCATSubjects = {
  BIOLOGY: 'Biology',
  CHEMISTRY: 'Chemistry',
  PHYSICS: 'Physics',
  CARS: 'Critical Analysis and Reasoning Skills',
  PSYCHOLOGY: 'Psychology/Sociology',
} as const;

export const ExamTypes = {
  FULL_LENGTH: 'Full Length',
  SECTION_PRACTICE: 'Section Practice',
  QUESTION_BANK: 'Question Bank',
} as const;