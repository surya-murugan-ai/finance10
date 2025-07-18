import { RequestHandler } from "express";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "local-development-secret";

export interface LocalAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenantRole: string;
}

// Local authentication middleware for development
export const localAuth: RequestHandler = async (req, res, next) => {
  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Try JWT token first
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.userId && decoded.email) {
        // Look up user in database
        const user = await storage.getUserById(decoded.userId);
        
        if (user && user.isActive) {
          // Attach user info to request in expected format
          req.user = {
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName
            },
            tenant_id: user.tenantId,
            id: user.id,
            email: user.email
          };
          return next();
        }
      }
    } catch (error) {
      // Try base64 decode as fallback
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const userData = JSON.parse(decoded);
        
        if (userData.userId && userData.email) {
          // Look up user in database
          const user = await storage.getUserById(userData.userId);
          
          if (user && user.isActive) {
            // Attach user info to request
            req.user = {
              claims: {
                sub: user.id,
                email: user.email,
                first_name: user.firstName,
                last_name: user.lastName
              },
              tenant_id: user.tenantId,
              id: user.id,
              email: user.email
            };
            return next();
          }
        }
      } catch (base64Error) {
        console.error('Token decode error:', base64Error);
      }
    }
  }

  return res.status(401).json({ message: "Unauthorized" });
};

// Local login endpoint
export const localLogin = async (req: any, res: any) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  
  try {
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        tenant_id: user.tenantId,
        tenant_role: user.tenantRole,
        is_active: user.isActive
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Local registration endpoint
export const localRegister = async (req: any, res: any) => {
  const { email, password, firstName, lastName, companyName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }
  
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create tenant first
    const tenant = await storage.createTenant({
      companyName: companyName || `${firstName} ${lastName} Company`,
      subscriptionPlan: 'starter',
      maxUsers: 10,
      isActive: true
    });
    
    // Create user
    const user = await storage.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'admin',
      tenantId: tenant.id,
      tenantRole: 'admin',
      isActive: true
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        tenant_id: user.tenantId,
        tenant_role: user.tenantRole,
        is_active: user.isActive
      },
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get current user info
export const getCurrentUser = async (req: any, res: any) => {
  try {
    const userClaims = req.user?.claims;
    
    if (!userClaims) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Look up full user info
    const user = await storage.getUserById(userClaims.sub);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        company_name: user.companyName || "Local Development",
        role: user.role,
        tenant_id: user.tenantId,
        tenant_role: user.tenantRole,
        is_active: user.isActive
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};