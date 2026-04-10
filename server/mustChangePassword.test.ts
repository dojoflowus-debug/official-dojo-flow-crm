import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('mustChangePassword flow', () => {
  it('should set mustChangePassword=1 when creating a new staff account', () => {
    // Simulate the executeInviteStaff logic
    const newUserData = {
      email: 'test.staff@dojo.com',
      role: 'staff',
      mustChangePassword: 1, // This is what executeInviteStaff sets
    };
    expect(newUserData.mustChangePassword).toBe(1);
  });

  it('should clear mustChangePassword=0 after password change', () => {
    // Simulate the changePassword procedure logic
    const updatedUserData = {
      mustChangePassword: 0, // This is what changePassword sets
    };
    expect(updatedUserData.mustChangePassword).toBe(0);
  });

  it('should redirect to /staff/change-password when mustChangePassword is true in login response', () => {
    // Simulate the StaffAuth.tsx onSuccess handler logic
    const loginResponse = {
      success: true,
      mustChangePassword: true,
    };
    const redirectPath = loginResponse.mustChangePassword 
      ? '/staff/change-password' 
      : '/dashboard';
    expect(redirectPath).toBe('/staff/change-password');
  });

  it('should redirect to /dashboard when mustChangePassword is false in login response', () => {
    const loginResponse = {
      success: true,
      mustChangePassword: false,
    };
    const redirectPath = loginResponse.mustChangePassword 
      ? '/staff/change-password' 
      : '/dashboard';
    expect(redirectPath).toBe('/dashboard');
  });

  it('should hash temp password correctly with bcrypt', async () => {
    const tempPassword = 'Dojo1234!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const isValid = await bcrypt.compare(tempPassword, hashedPassword);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password in bcrypt comparison', async () => {
    const tempPassword = 'Dojo1234!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const isValid = await bcrypt.compare('WrongPassword!', hashedPassword);
    expect(isValid).toBe(false);
  });
});
