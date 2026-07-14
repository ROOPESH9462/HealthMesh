import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

import authService from '../modules/auth/auth.service';
import { restrictTo, AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';
import { Response, NextFunction } from 'express';

describe('Authentication & Authorization Tests', () => {
  
  describe('JWT Token Service', () => {
    beforeEach(() => {
      (jwt.sign as jest.Mock).mockReturnValue('mocked_token_string');
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'mock_user_123', role: 'PATIENT' });
    });

    it('should correctly generate access tokens', () => {
      const token = authService.generateAccessToken({
        userId: 'mock_user_123',
        role: UserRole.PATIENT
      });
      expect(token).toBe('mocked_token_string');
    });

    it('should correctly verify valid access tokens', () => {
      const decoded = authService.verifyAccessToken('mocked_token_string');
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('mock_user_123');
    });
  });

  describe('Role-Based Access Control Middleware (RBAC)', () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should block access if req.user is undefined', () => {
      const middleware = restrictTo(UserRole.ADMIN);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const errorCalled = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorCalled.message).toContain('You are not logged in');
    });

    it('should block access if user role does not match restricted roles', () => {
      mockReq.user = {
        role: UserRole.PATIENT,
        id: 'patient_123'
      } as any;

      const middleware = restrictTo(UserRole.DOCTOR, UserRole.ADMIN);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const errorCalled = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorCalled.message).toContain('You do not have permission');
    });

    it('should allow access if user role matches allowed roles', () => {
      mockReq.user = {
        role: UserRole.DOCTOR,
        id: 'doctor_123'
      } as any;

      const middleware = restrictTo(UserRole.DOCTOR, UserRole.ADMIN);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
