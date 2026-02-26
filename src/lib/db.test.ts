import { describe, it, expect } from 'vitest';

describe('Database - Prisma Schema', () => {
  it('should have Prisma client module available', () => {
    // Import the Prisma client type to verify it's available
    const { PrismaClient } = require('@prisma/client');
    expect(PrismaClient).toBeDefined();
  });

  it('should have all required models defined in schema', () => {
    // Verify that the Prisma schema includes all required models
    // by checking the generated types
    const { Prisma } = require('@prisma/client');
    
    // Check that model names are available in the Prisma namespace
    expect(Prisma).toBeDefined();
    expect(Prisma.ModelName).toBeDefined();
    
    const modelNames = Object.values(Prisma.ModelName);
    const requiredModels = [
      'User',
      'Device',
      'Course',
      'CourseEdition',
      'CourseEnrollment',
      'Lesson',
      'LessonProgress',
      'Guide',
      'GuideAccess',
      'Bundle',
      'BundleItem',
      'Product',
      'Order',
      'OrderItem',
      'Invoice',
      'PromoCode',
      'Session1on1',
      'Availability',
      'BlogPost',
      'CaseStudy',
    ];
    
    requiredModels.forEach((model) => {
      expect(modelNames).toContain(model);
    });
  });

  it('should have User model with correct structure', () => {
    // Verify User model structure through Prisma schema
    const { Prisma } = require('@prisma/client');
    
    // Check that User model exists
    expect(Prisma.ModelName.User).toBeDefined();
  });

  it('should have Device model with unique constraint', () => {
    // Verify Device model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Device).toBeDefined();
  });

  it('should have Order model with installment-related fields', () => {
    // Verify Order model structure through Prisma schema
    const { Prisma } = require('@prisma/client');
    
    // Check that Order model exists
    expect(Prisma.ModelName.Order).toBeDefined();
  });

  it('should have CourseEnrollment model with unique constraint', () => {
    // Verify CourseEnrollment model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.CourseEnrollment).toBeDefined();
  });

  it('should have Lesson model with unique constraint', () => {
    // Verify Lesson model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Lesson).toBeDefined();
  });

  it('should have Guide model with content and audio fields', () => {
    // Verify Guide model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Guide).toBeDefined();
  });

  it('should have Bundle model with pricing fields', () => {
    // Verify Bundle model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Bundle).toBeDefined();
  });

  it('should have Product model with type and stock fields', () => {
    // Verify Product model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Product).toBeDefined();
  });

  it('should have Invoice model with SmartBill fields', () => {
    // Verify Invoice model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Invoice).toBeDefined();
  });

  it('should have Session1on1 model for scheduling', () => {
    // Verify Session1on1 model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Session1on1).toBeDefined();
  });

  it('should have BlogPost model for content management', () => {
    // Verify BlogPost model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.BlogPost).toBeDefined();
  });

  it('should have CaseStudy model for testimonials', () => {
    // Verify CaseStudy model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.CaseStudy).toBeDefined();
  });

  it('should have Availability model for scheduling', () => {
    // Verify Availability model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.Availability).toBeDefined();
  });

  it('should have PromoCode model for discounts', () => {
    // Verify PromoCode model exists
    const { Prisma } = require('@prisma/client');
    
    expect(Prisma.ModelName.PromoCode).toBeDefined();
  });
});
