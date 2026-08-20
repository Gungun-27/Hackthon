import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'trafficmitra-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'trafficmitra-refresh-secret-2026';



export class AuthController {
  /**
   * Stage 1: Register Citizen Account
   */
  public static async register(req: Request, res: Response) {
    try {
      const { full_name, phone, email, password } = req.body;

      if (!full_name || !phone || !email || !password) {
        return res.status(400).json({ error: 'All fields (full_name, phone, email, password) are required.' });
      }

      // Check for existing user
      const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR email = ?').get(phone, email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this phone number or email already exists.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const id = uuidv4();

      db.prepare(`
        INSERT INTO users (id, full_name, phone, email, password_hash, role, is_phone_verified, is_email_verified, is_identity_verified)
        VALUES (?, ?, ?, ?, ?, 'citizen', 1, 0, 0)
      `).run(id, full_name, phone, email, password_hash);

      // Issue tokens immediately — no OTP step
      const accessToken = jwt.sign(
        { id, email, phone, role: 'citizen', full_name, is_identity_verified: false },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      const refreshToken = jwt.sign(
        { id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account created successfully.',
        userId: id,
        phone,
        email,
        accessToken,
        refreshToken
      });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Internal server error during registration.' });
    }
  }



  /**
   * Verify Email Link
   */
  public static async verifyEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      db.prepare('UPDATE users SET is_email_verified = 1 WHERE email = ?').run(email);
      return res.json({ message: 'Email verified successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  /**
   * User Login (Citizen / Officer / Admin)
   */
  public static async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body; // identifier can be email or phone
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier (email/phone) and password are required.' });
      }

      const user = db.prepare(`
        SELECT u.*, o.badge_number, o.department_id, d.name as department_name, d.zone as department_zone
        FROM users u
        LEFT JOIN officers o ON o.user_id = u.id
        LEFT JOIN departments d ON d.id = o.department_id
        WHERE u.email = ? OR u.phone = ?
      `).get(identifier, identifier) as any;

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          full_name: user.full_name,
          is_identity_verified: Boolean(user.is_identity_verified),
          badge_number: user.badge_number,
          department_name: user.department_name
        },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      const { password_hash, ...safeUser } = user;

      return res.json({
        message: 'Login successful.',
        accessToken,
        refreshToken,
        user: {
          ...safeUser,
          is_phone_verified: Boolean(user.is_phone_verified),
          is_email_verified: Boolean(user.is_email_verified),
          is_identity_verified: Boolean(user.is_identity_verified)
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  /**
   * Refresh Token
   */
  public static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required.' });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone, role: user.role, full_name: user.full_name, is_identity_verified: Boolean(user.is_identity_verified) },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({ accessToken: newAccessToken });
    } catch {
      return res.status(403).json({ error: 'Invalid or expired refresh token.' });
    }
  }

  /**
   * Stage 2: Initiate DigiLocker OAuth Verification Sandbox
   */
  public static async digilockerInit(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to initiate DigiLocker verification.' });
      }

      const state = uuidv4();
      const redirectUri = `/api/auth/digilocker/callback?state=${state}&userId=${userId}`;

      return res.json({
        provider: 'DigiLocker Government Sandbox API (OAuth 2.0)',
        authEndpoint: redirectUri,
        scope: 'org.gov.in.transport:DL, org.gov.in.transport:RC',
        clientRef: 'NMC-TRAFFICMITRA-SANDBOX-AUTH-2026',
        state
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to initiate DigiLocker sandbox.' });
    }
  }

  /**
   * Stage 2 Callback: Complete DigiLocker Sandbox Verification
   */
  public static async digilockerCallback(req: Request, res: Response) {
    try {
      const { userId, docType = 'DRIVING_LICENSE', docNumber = 'MH31-2021-0089241' } = req.query as any;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId in DigiLocker callback.' });
      }

      const docRefToken = `DL-VERIFIED-${docType}-${Date.now().toString(36).toUpperCase()}-${docNumber}`;

      db.prepare(`
        UPDATE users 
        SET is_identity_verified = 1,
            digilocker_doc_ref = ?
        WHERE id = ?
      `).run(docRefToken, userId);

      const user = db.prepare('SELECT id, full_name, phone, email, role, is_phone_verified, is_identity_verified, digilocker_doc_ref FROM users WHERE id = ?').get(userId) as any;

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone, role: user.role, full_name: user.full_name, is_identity_verified: true },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        success: true,
        message: 'Government Identity Verified successfully via DigiLocker Sandbox.',
        verifiedBadge: 'VERIFIED_CITIZEN',
        documentRef: docRefToken,
        verifiedDocumentType: docType,
        user: {
          ...user,
          is_identity_verified: true
        },
        accessToken: newAccessToken
      });
    } catch (err: any) {
      console.error('DigiLocker callback error:', err);
      return res.status(500).json({ error: 'DigiLocker verification failed.' });
    }
  }

  /**
   * Get Current User Profile
   */
  public static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = db.prepare(`
        SELECT u.id, u.full_name, u.phone, u.email, u.role, u.is_phone_verified, u.is_email_verified, u.is_identity_verified, u.digilocker_doc_ref, u.created_at,
               o.badge_number, o.department_id, d.name as department_name, d.zone as department_zone
        FROM users u
        LEFT JOIN officers o ON o.user_id = u.id
        LEFT JOIN departments d ON d.id = o.department_id
        WHERE u.id = ?
      `).get(req.user.id) as any;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        ...user,
        is_phone_verified: Boolean(user.is_phone_verified),
        is_email_verified: Boolean(user.is_email_verified),
        is_identity_verified: Boolean(user.is_identity_verified)
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }
}
