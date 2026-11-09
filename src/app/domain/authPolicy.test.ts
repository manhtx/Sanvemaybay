import { describe, expect, it } from 'vitest';
import {
  PASSWORD_MAX_LENGTH,
  safeAuthError,
  SIGN_UP_PASSWORD_MIN_LENGTH,
  validateAuthCredentials,
} from './authPolicy';

describe('Auth Policy & Credential Security Invariants (FLY-SEC-003, REQ-SEC-002, NC-025, NC-029)', () => {
  describe('Email Format & RFC 5321 Boundaries', () => {
    it('accepts valid standard and international email addresses', () => {
      const validEmails = [
        'user@example.com',
        'first.last+promo@sub.domain.co.uk',
        'traveler@vietnamairlines.com.vn',
        'flyer123@tokyo.travel.jp',
        'customer_care@airasia.co.th',
      ];

      for (const email of validEmails) {
        expect(validateAuthCredentials(email, 'validPassword123', 'sign-up')).toBeUndefined();
      }
    });

    it('trims leading and trailing whitespace from email input before validating', () => {
      expect(validateAuthCredentials('  user@example.com  ', 'validPassword123', 'sign-up')).toBeUndefined();
      expect(validateAuthCredentials('\tuser@example.com\n', 'validPassword123', 'sign-in')).toBeUndefined();
    });

    it('rejects empty, missing, or whitespace-only email strings', () => {
      expect(validateAuthCredentials('', 'validPassword123', 'sign-up')).toBe('Nhập địa chỉ email hợp lệ.');
      expect(validateAuthCredentials('   ', 'validPassword123', 'sign-up')).toBe('Nhập địa chỉ email hợp lệ.');
      expect(validateAuthCredentials('\t\n', 'validPassword123', 'sign-in')).toBe('Nhập địa chỉ email hợp lệ.');
    });

    it('strictly enforces RFC 5321 254-character maximum email length', () => {
      // 254 chars: 242 local + @ + example.com (11 chars) = 254 chars
      const atLimitLocal = 'a'.repeat(242);
      const validAtLimit = `${atLimitLocal}@example.com`;
      expect(validAtLimit.length).toBe(254);
      expect(validateAuthCredentials(validAtLimit, 'validPassword123', 'sign-up')).toBeUndefined();

      // 255 chars: 243 local + @ + example.com (11 chars) = 255 chars -> REJECTED
      const overLimitLocal = 'a'.repeat(243);
      const invalidOverLimit = `${overLimitLocal}@example.com`;
      expect(invalidOverLimit.length).toBe(255);
      expect(validateAuthCredentials(invalidOverLimit, 'validPassword123', 'sign-up')).toBe('Nhập địa chỉ email hợp lệ.');
    });

    it('rejects malformed email formats and injection attempts', () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-domain@',
        'missing-tld@domain',
        'spaces in@local.com',
        'user@spaces in domain.com',
        'user name@domain.com',
      ];

      for (const email of invalidEmails) {
        expect(validateAuthCredentials(email, 'validPassword123', 'sign-up')).toBe('Nhập địa chỉ email hợp lệ.');
        expect(validateAuthCredentials(email, 'validPassword123', 'sign-in')).toBe('Nhập địa chỉ email hợp lệ.');
      }
    });

    it('handles complex email local parts and subdomains complying with standard RFC formatting', () => {
      const complexValidEmails = [
        'traveler.pro+deal-finder@sub.booking.domain.vn',
        'a_b-c.d+e@domain-provider.co.uk',
        'flyer.asia@sg-hub.airline.travel',
      ];

      for (const email of complexValidEmails) {
        expect(validateAuthCredentials(email, 'validPassword123', 'sign-up')).toBeUndefined();
        expect(validateAuthCredentials(email, 'validPassword123', 'sign-in')).toBeUndefined();
      }
    });

    it('validates email length boundary at exactly 254 chars after trimming external whitespace', () => {
      const atLimitLocal = 'a'.repeat(242);
      const paddedAtLimit = `   ${atLimitLocal}@example.com   `;
      expect(validateAuthCredentials(paddedAtLimit, 'validPassword123', 'sign-up')).toBeUndefined();

      const overLimitLocal = 'a'.repeat(243);
      const paddedOverLimit = `   ${overLimitLocal}@example.com   `;
      expect(validateAuthCredentials(paddedOverLimit, 'validPassword123', 'sign-up')).toBe('Nhập địa chỉ email hợp lệ.');
    });
  });

  describe('Password Security & Boundary Constraints', () => {
    it('rejects empty or missing passwords in both authentication modes', () => {
      expect(validateAuthCredentials('user@example.com', '', 'sign-in')).toBe('Mật khẩu không hợp lệ.');
      expect(validateAuthCredentials('user@example.com', '', 'sign-up')).toBe('Mật khẩu không hợp lệ.');
    });

    it('enforces 128-character maximum upper bound in both modes', () => {
      const atLimit = 'p'.repeat(PASSWORD_MAX_LENGTH);
      const overLimit = 'p'.repeat(PASSWORD_MAX_LENGTH + 1);

      expect(validateAuthCredentials('user@example.com', atLimit, 'sign-up')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', atLimit, 'sign-in')).toBeUndefined();

      expect(validateAuthCredentials('user@example.com', overLimit, 'sign-up')).toBe('Mật khẩu không hợp lệ.');
      expect(validateAuthCredentials('user@example.com', overLimit, 'sign-in')).toBe('Mật khẩu không hợp lệ.');
    });

    it('enforces 12-character minimum strictly on sign-up mode', () => {
      const elevenChars = 'x'.repeat(SIGN_UP_PASSWORD_MIN_LENGTH - 1);
      const twelveChars = 'x'.repeat(SIGN_UP_PASSWORD_MIN_LENGTH);

      expect(validateAuthCredentials('user@example.com', elevenChars, 'sign-up')).toBe(
        `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`
      );
      expect(validateAuthCredentials('user@example.com', twelveChars, 'sign-up')).toBeUndefined();
    });

    it('evaluates exact password length boundary conditions around 12 characters', () => {
      const tenChars = 'x'.repeat(10);
      const elevenChars = 'x'.repeat(11);
      const twelveChars = 'x'.repeat(12);
      const thirteenChars = 'x'.repeat(13);

      expect(validateAuthCredentials('user@example.com', tenChars, 'sign-up')).toBe(
        `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`
      );
      expect(validateAuthCredentials('user@example.com', elevenChars, 'sign-up')).toBe(
        `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`
      );
      expect(validateAuthCredentials('user@example.com', twelveChars, 'sign-up')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', thirteenChars, 'sign-up')).toBeUndefined();

      // All remain valid for sign-in
      expect(validateAuthCredentials('user@example.com', tenChars, 'sign-in')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', elevenChars, 'sign-in')).toBeUndefined();
    });

    it('evaluates exact password length boundary conditions around 128 characters', () => {
      const at127 = 'y'.repeat(127);
      const at128 = 'y'.repeat(128);
      const at129 = 'y'.repeat(129);

      expect(validateAuthCredentials('user@example.com', at127, 'sign-up')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', at128, 'sign-up')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', at129, 'sign-up')).toBe('Mật khẩu không hợp lệ.');

      expect(validateAuthCredentials('user@example.com', at127, 'sign-in')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', at128, 'sign-in')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', at129, 'sign-in')).toBe('Mật khẩu không hợp lệ.');
    });

    it('permits legacy shorter passwords on sign-in mode to prevent account lockout', () => {
      // Legacy passwords shorter than 12 chars remain valid for sign-in
      expect(validateAuthCredentials('user@example.com', 'legacy6', 'sign-in')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', 'short', 'sign-in')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', '12345678', 'sign-in')).toBeUndefined();
    });

    it('handles Unicode and multi-byte characters in passwords accurately', () => {
      const vietnamesePw = 'MậtKhẩuBảoMật2026!';
      expect(validateAuthCredentials('user@example.com', vietnamesePw, 'sign-up')).toBeUndefined();
      expect(validateAuthCredentials('user@example.com', vietnamesePw, 'sign-in')).toBeUndefined();

      const shortUnicode = 'BảoMật'; // 6 characters
      expect(validateAuthCredentials('user@example.com', shortUnicode, 'sign-up')).toBe(
        `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`
      );
      expect(validateAuthCredentials('user@example.com', shortUnicode, 'sign-in')).toBeUndefined();
    });

    it('differentiates sign-up vs sign-in rejection messages precisely for sub-12 char passwords', () => {
      const candidatePass = 'SafePass8';
      const signUpResult = validateAuthCredentials('user@example.com', candidatePass, 'sign-up');
      const signInResult = validateAuthCredentials('user@example.com', candidatePass, 'sign-in');

      expect(signUpResult).toBe(`Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`);
      expect(signInResult).toBeUndefined();
    });
  });

  describe('Safe Auth Error Sanitization (NC-025, NC-029)', () => {
    it('returns sanitized user-friendly Vietnamese messages without user enumeration clues', () => {
      const signInMsg = safeAuthError('sign-in');
      const signUpMsg = safeAuthError('sign-up');

      expect(signInMsg).toBe(
        'Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản.'
      );
      expect(signUpMsg).toBe(
        'Không thể tạo tài khoản với thông tin này. Hãy kiểm tra lại hoặc thử sau.'
      );
    });

    it('never discloses vendor names, database internals, SQL keywords, or technical exception traces', () => {
      const prohibitedTokens = [
        'supabase',
        'postgres',
        'postgresql',
        'sql',
        'exception',
        'already exists',
        'not found',
        'relation',
        'column',
        'schema',
        'table',
        'null',
        'undefined',
        'jwt',
        'bearer',
      ];

      const signIn = safeAuthError('sign-in').toLowerCase();
      const signUp = safeAuthError('sign-up').toLowerCase();

      for (const token of prohibitedTokens) {
        expect(signIn).not.toContain(token);
        expect(signUp).not.toContain(token);
      }
    });

    it('safeAuthError produces deterministic, non-empty, localized security responses for both modes', () => {
      for (let i = 0; i < 50; i++) {
        expect(safeAuthError('sign-in')).toBe(
          'Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản.'
        );
        expect(safeAuthError('sign-up')).toBe(
          'Không thể tạo tài khoản với thông tin này. Hãy kiểm tra lại hoặc thử sau.'
        );
      }
    });
  });

  describe('High-Volume Performance & Immutability', () => {
    it('validates 10,000 credential pairs in sub-50ms', () => {
      const start = performance.now();
      let validCount = 0;
      for (let i = 0; i < 10000; i++) {
        const email = `traveler_${i % 100}@example.com`;
        const pass = `PasswordValid${i % 100}Exceeding12`;
        const result = validateAuthCredentials(email, pass, 'sign-up');
        if (result === undefined) validCount++;
      }
      const elapsed = performance.now() - start;

      expect(validCount).toBe(10000);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate input strings or environment state', () => {
      const originalEmail = '  user@domain.com  ';
      const originalPass = 'ValidSecretPassword123';

      const res = validateAuthCredentials(originalEmail, originalPass, 'sign-in');
      expect(res).toBeUndefined();
      expect(originalEmail).toBe('  user@domain.com  ');
      expect(originalPass).toBe('ValidSecretPassword123');
    });
  });
});
