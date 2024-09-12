export const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const chooseRandomEnum = <T>(anEnum: T): T[keyof T] => {
  const enumValues = Object.values(anEnum);
  const randomIndex = randomNumber(0, enumValues.length - 1);
  return enumValues[randomIndex] as T[keyof T];
};
