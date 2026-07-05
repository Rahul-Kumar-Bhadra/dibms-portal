/**
 * Safe date parsing utility to prevent timezone parsing discrepancies
 * between local time and UTC database timestamps.
 */
export const safeDate = (dateVal: string | Date | undefined | null): Date => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;

  if (typeof dateVal === 'string') {
    // If it is a timezone-naive ISO string (e.g. "2026-07-05T05:16:28"), 
    // append 'Z' to force Javascript to parse it as UTC rather than local time.
    if (!dateVal.endsWith('Z') && !dateVal.includes('+') && !/-\d{2}:\d{2}$/.test(dateVal)) {
      return new Date(`${dateVal}Z`);
    }
  }
  return new Date(dateVal);
};
