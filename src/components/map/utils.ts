export const getCapacityPercent = (used: number, capacity: number) => {
  if (capacity === 0) {
    return 0;
  }

  return Math.round((used / capacity) * 100);
};

export const getCapacityFill = (used: number, capacity: number) => {
  const percent = getCapacityPercent(used, capacity);

  if (percent >= 90) {
    return "#C4454D"; // brand-brick
  }

  if (percent >= 75) {
    return "#D4A026"; // brand-amber
  }

  return "#3D8B7A"; // brand-sage
};

export const getCapacityLabel = (used: number, capacity: number) => {
  const percent = getCapacityPercent(used, capacity);

  if (percent >= 90) {
    return "High";
  }

  if (percent >= 75) {
    return "Medium";
  }

  return "Good";
};
