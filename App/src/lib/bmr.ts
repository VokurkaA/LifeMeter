export function harrisBenedict(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  if (sex === 'male') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

export function mifflinStJeor(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export function katchMcArdle(leanMassKg: number): number {
  return 370 + 21.6 * leanMassKg;
}

export function cunningham(leanMassKg: number): number {
  return 500 + 22 * leanMassKg;
}

export function schofield(sex: 'male' | 'female', weightKg: number, ageYears: number): number {
  if (sex === 'male') {
    if (ageYears < 18) return 17.686 * weightKg + 658.2;
    if (ageYears < 30) return 15.057 * weightKg + 692.2;
    if (ageYears < 60) return 11.472 * weightKg + 873.1;
    return 11.711 * weightKg + 587.7;
  }

  if (ageYears < 18) return 13.384 * weightKg + 692.6;
  if (ageYears < 30) return 14.818 * weightKg + 486.6;
  if (ageYears < 60) return 8.126 * weightKg + 845.6;
  return 9.082 * weightKg + 658.5;
}

export function owen(sex: 'male' | 'female', weightKg: number): number {
  return sex === 'male' ? 879 + 10.2 * weightKg : 795 + 7.18 * weightKg;
}

export default mifflinStJeor;