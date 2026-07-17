export interface AnniversaryRange {
  start: Date;
  end: Date;
  years: number;
}

export function getAnniversaryRange(fechaIngreso: Date): AnniversaryRange {
  const now = new Date();
  let years = now.getFullYear() - fechaIngreso.getFullYear();
  const anniversaryThisYear = new Date(now.getFullYear(), fechaIngreso.getMonth(), fechaIngreso.getDate());
  
  let start: Date;
  let end: Date;
  
  if (now >= anniversaryThisYear) {
    start = anniversaryThisYear;
    end = new Date(now.getFullYear() + 1, fechaIngreso.getMonth(), fechaIngreso.getDate());
  } else {
    years--;
    start = new Date(now.getFullYear() - 1, fechaIngreso.getMonth(), fechaIngreso.getDate());
    end = anniversaryThisYear;
  }
  
  return { start, end, years };
}

export function calculateTotalVacationDays(years: number): number {
  if (years < 1) return 0;
  // 1 año = 6 días, 2 años = 8 días, 3 años = 10 días, 4 años = 12 días, etc.
  return 6 + (years - 1) * 2;
}
