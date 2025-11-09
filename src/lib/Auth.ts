/**
 * 인증 관리 클래스
 * sessionStorage를 사용하여 인증 상태를 관리합니다.
 */
class Auth {
  private static readonly CORRECT_PASSWORD = '070-7431-5617';
  private static readonly AUTH_KEY = 'tongkidari_auth';

  /**
   * 비밀번호를 확인하고 인증 상태를 저장합니다.
   * @param password - 입력된 비밀번호
   * @returns 인증 성공 여부
   */
  static login(password: string): boolean {
    if (password === this.CORRECT_PASSWORD) {
      sessionStorage.setItem(this.AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  /**
   * 인증 상태를 확인합니다.
   * @returns 인증 여부
   */
  static isAuthenticated(): boolean {
    return sessionStorage.getItem(this.AUTH_KEY) === 'true';
  }

  /**
   * 로그아웃 처리 (세션 스토리지 삭제)
   */
  static logout(): void {
    sessionStorage.removeItem(this.AUTH_KEY);
  }
}

export default Auth;
