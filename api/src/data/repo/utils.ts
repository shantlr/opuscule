import { ACCURACY } from 'config/constants';

export const shouldUpdateTextWithAccuracy = (
  [existingText, existingAccuracy]: [
    text: string | undefined | null,
    accuracy: number | undefined | null,
  ],
  [inputText, inputAccuracy]: [
    text: string | undefined | null,
    accuracy: number | undefined | null,
  ],
) => {
  if (!inputText) {
    return false;
  }

  return (
    existingText !== inputText &&
    (inputAccuracy ?? ACCURACY.LOW) >= (existingAccuracy ?? ACCURACY.LOW)
  );
};
