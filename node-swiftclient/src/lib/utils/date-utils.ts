/* eslint-disable @typescript-eslint/no-unused-vars */
function extractUTCOffset(dateString): number {
  try {
    if (dateString.endsWith('Z')) {
      return 0;
    }
    // Regular expressions to match timezone offset formats
    const offsetRegex = /([+-])(\d{2}):?(\d{2})?/;

    // Try to extract explicit timezone offset
    const match = dateString.match(offsetRegex);

    if (match) {
      // Extract hours and minutes from the match
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;

      // Calculate total offset in minutes
      return sign * (hours * 60 + minutes);
    }

    // Handle GMT format
    if (dateString.includes('GMT')) {
      const gmtRegex = /GMT([+-]\d{2}):?(\d{2})?/;
      const gmtMatch = dateString.match(gmtRegex);

      if (gmtMatch) {
        const sign = gmtMatch[1][0] === '+' ? 1 : -1;
        const hours = parseInt(gmtMatch[1].slice(1), 10);
        const minutes = gmtMatch[2] ? parseInt(gmtMatch[2], 10) : 0;

        return sign * (hours * 60 + minutes);
      }
    }
    // If no explicit offset found, return null
  } catch (error) {
    /** noop */
  }
  // Handle Z (Zulu time / UTC)
  return 0;
}

export function getServerDateTimeOffset(response: Response) {
  try {
    const serverDateTimeStr: string | null =
      (response.headers.get('Date') || response.headers.get('Last-Modified')) ??
      null;
    const timezoneOffsetMinutes = serverDateTimeStr
      ? extractUTCOffset(serverDateTimeStr)
      : new Date().getTimezoneOffset();

    const sign = timezoneOffsetMinutes <= 0 ? '+' : '-';
    const absOffset = Math.abs(timezoneOffsetMinutes);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    const timezoneOffset = `${sign}${hours}:${minutes}`; // e.g., "+02:00"

    return timezoneOffset;
  } catch (error) {
    return '+00:00';
  }
}

export function parseDateWithServerTimezone(
  dateString: string,
  serverTimezoneOffset: string
) {
  try {
    if (hasTimezone(dateString)) {
      return new Date(dateString);
    }
    const dateWithSameTZ = `${dateString}${serverTimezoneOffset}`;
    return new Date(dateWithSameTZ);
  } catch (error) {
    return new Date();
  }
}

function hasTimezone(dateString: string): boolean {
  const timezoneRegex = /(Z|[+-]\d{2}:\d{2}|UTC|GMT)/i;
  return timezoneRegex.test(dateString);
}
