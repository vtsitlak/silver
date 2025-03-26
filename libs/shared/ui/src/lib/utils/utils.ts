export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function deleteCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const issuedAt = decodedPayload.iat;
    const oneDayInSeconds = 24 * 60 * 60;

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime - issuedAt > oneDayInSeconds;
  } catch (error) {
    console.error('Invalid token format:', error);
    return true;
  }
}

export function checkToken(token: string): boolean {
  if (token) {
    if (isTokenExpired(token)) {

      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

export function parseCookie(): unknown {
  const cookieName = 'userInfo';
  let userInfo;
  try {
    userInfo = JSON.parse(getCookie(cookieName) || '{}');
  } catch (e) {
    return undefined;
  }

  if(checkToken(userInfo.token)) {
    return userInfo;
  } else {
    deleteCookie(cookieName);
    return undefined;
  }
}
