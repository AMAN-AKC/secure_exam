import multer from 'multer';
import csv from 'csv-parser';
import { User } from '../models/User.js';
import { hashPassword } from '../middlewares/auth.js';
import { AuditLog } from '../models/AuditLog.js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { Readable } from 'stream';

// Configure multer for file upload (CSV only, max 5MB)
export const bulkImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Email transporter (configure with your email service)
let emailTransporter = null;

function getEmailTransporter() {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return emailTransporter;
}

/**
 * Send credentials email to newly created student
 */
async function sendCredentialsEmail(student) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured - skipping email send');
      return true;
    }

    const transporter = getEmailTransporter();
    const htmlContent = `
      <h2>Welcome to Secure Exam Platform</h2>
      <p>Hello ${student.name},</p>
      <p>Your account has been created in the Secure Exam Platform.</p>
      <h3>Login Credentials:</h3>
      <ul>
        <li><strong>Email:</strong> ${student.email}</li>
        <li><strong>Password:</strong> ${student.tempPassword}</li>
      </ul>
      <p><strong>Important:</strong> Please change your password after your first login.</p>
      <p>To access the platform, visit: <a href="${process.env.APP_URL || 'http://localhost:5173'}">${process.env.APP_URL || 'http://localhost:5173'}</a></p>
      <p>Best regards,<br>Exam Platform Admin</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: 'Your Secure Exam Platform Account Credentials',
      html: htmlContent
    });

    return true;
  } catch (error) {
    console.error(`Error sending email to ${student.email}:`, error);
    return false;
  }
}

/**
 * Generate temporary password
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Validate CSV headers
 */
function validateHeaders(headers) {
  const requiredFields = ['name', 'email', 'phone'];
  const providedFields = Object.keys(headers[0] || {}).map(h => h.toLowerCase().trim());

  for (const field of requiredFields) {
    if (!providedFields.includes(field)) {
      throw new Error(`Missing required column: "${field}"`);
    }
  }

  return providedFields;
}

/**
 * Validate individual row
 */
async function validateRow(row, rowNumber) {
  const errors = [];

  // Validate name
  if (!row.name || row.name.trim().length < 2) {
    errors.push(`Row ${rowNumber}: Name must be at least 2 characters`);
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!row.email || !emailRegex.test(row.email)) {
    errors.push(`Row ${rowNumber}: Invalid email format: ${row.email}`);
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: row.email });
  if (existingUser) {
    errors.push(`Row ${rowNumber}: Email already registered: ${row.email}`);
  }

  // Validate phone
  if (!row.phone || row.phone.trim().length < 10) {
    errors.push(`Row ${rowNumber}: Phone must be at least 10 digits`);
  }

  return errors;
}

/**
 * Parse and process CSV file
 */
async function processCSVFile(fileBuffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const errors = [];
    let rowNumber = 1;

    Readable.from([fileBuffer.toString()])
      .pipe(csv())
      .on('headers', (headers) => {
        try {
          validateHeaders([headers]);
        } catch (error) {
          reject(error);
        }
      })
      .on('data', (row) => {
        rowNumber++;
        rows.push({ ...row, rowNumber });
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}

/**
 * Main bulk import endpoint
 * POST /api/admin/students/bulk-import
 */
export async function bulkImportStudents(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Parse CSV file
    let csvRows;
    try {
      csvRows = await processCSVFile(req.file.buffer);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'CSV parsing failed',
        error: error.message
      });
    }

    if (csvRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty'
      });
    }

    // Validate all rows before creating any
    const validationErrors = [];
    for (const row of csvRows) {
      const rowErrors = await validateRow(row, row.rowNumber);
      validationErrors.push(...rowErrors);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.slice(0, 20), // Return first 20 errors
        totalErrors: validationErrors.length
      });
    }

    // Create students
    const createdStudents = [];
    const failedStudents = [];

    for (const row of csvRows) {
      try {
        const tempPassword = generateTempPassword();

        // Create user
        const user = await User.create({
          name: row.name.trim(),
          email: row.email.trim(),
          phone: row.phone.trim(),
          passwordHash: await hashPassword(tempPassword),
          role: 'student',
          authMethod: 'password',
          isPhoneVerified: true,
          isEmailVerified: true
        });

        // Send credentials email
        const emailSent = await sendCredentialsEmail({
          name: user.name,
          email: user.email,
          tempPassword
        });

        createdStudents.push({
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          emailSent
        });
      } catch (error) {
        failedStudents.push({
          name: row.name,
          email: row.email,
          error: error.message
        });
      }
    }

    // Log audit event
    await AuditLog.create({
      action: 'bulk_student_import',
      actor: req.user.id,
      actorRole: req.user.role,
      targetType: 'System',
      targetId: null,
      status: 'success',
      reason: `Bulk imported ${createdStudents.length} students`,
      context: {
        fileName: req.file.originalname,
        totalRows: csvRows.length,
        createdCount: createdStudents.length,
        failedCount: failedStudents.length,
        emailsSent: createdStudents.filter(s => s.emailSent).length
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: `Bulk import completed: ${createdStudents.length} students created`,
      summary: {
        totalProcessed: csvRows.length,
        created: createdStudents.length,
        failed: failedStudents.length,
        emailsSent: createdStudents.filter(s => s.emailSent).length
      },
      createdStudents: createdStudents.slice(0, 50), // Return first 50 in response
      failedStudents,
      importTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bulk import error:', error);

    // Log failure
    try {
      await AuditLog.create({
        action: 'bulk_student_import',
        actor: req.user.id,
        actorRole: req.user.role,
        targetType: 'System',
        targetId: null,
        status: 'failed',
        error: error.message,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    res.status(500).json({
      success: false,
      message: 'Bulk import failed',
      error: error.message
    });
  }
}

/**
 * Get bulk import status/history
 * GET /api/admin/students/bulk-imports
 */
export async function getBulkImportHistory(req, res) {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const imports = await AuditLog.find({
      action: 'bulk_student_import'
    })
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100))
      .skip(parseInt(skip))
      .lean();

    const formatted = imports.map(imp => ({
      id: imp._id,
      timestamp: imp.createdAt,
      importedBy: {
        name: imp.actor?.name,
        email: imp.actor?.email
      },
      status: imp.status,
      summary: {
        totalProcessed: imp.context?.totalRows,
        created: imp.context?.createdCount,
        failed: imp.context?.failedCount,
        emailsSent: imp.context?.emailsSent
      },
      fileName: imp.context?.fileName,
      error: imp.error
    }));

    const totalCount = await AuditLog.countDocuments({ action: 'bulk_student_import' });

    res.json({
      success: true,
      imports: formatted,
      pagination: {
        total: totalCount,
        limit: Math.min(parseInt(limit), 100),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import history'
    });
  }
}

/**
 * Get import statistics
 * GET /api/admin/students/bulk-imports/statistics
 */
export async function getBulkImportStatistics(req, res) {
  try {
    const imports = await AuditLog.find({ action: 'bulk_student_import' }).lean();

    const stats = {
      totalImports: imports.length,
      successfulImports: imports.filter(i => i.status === 'success').length,
      failedImports: imports.filter(i => i.status === 'failed').length,
      totalStudentsCreated: imports.reduce((sum, i) => sum + (i.context?.createdCount || 0), 0),
      totalEmailsSent: imports.reduce((sum, i) => sum + (i.context?.emailsSent || 0), 0),
      totalFailures: imports.reduce((sum, i) => sum + (i.context?.failedCount || 0), 0),
      averageStudentsPerImport: 0,
      recentImports: []
    };

    if (stats.totalImports > 0) {
      stats.averageStudentsPerImport = Math.round(stats.totalStudentsCreated / stats.totalImports);
    }

    // Get recent imports
    stats.recentImports = await AuditLog.find({ action: 'bulk_student_import' })
      .populate('actor', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .then(imports =>
        imports.map(i => ({
          timestamp: i.createdAt,
          importedBy: i.actor?.name,
          studentsCreated: i.context?.createdCount
        }))
      );

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
}

/**
 * Download CSV template
 * GET /api/admin/students/bulk-import-template
 */
export async function downloadCSVTemplate(req, res) {
  try {
    const csvTemplate = `name,email,phone
John Doe,john.doe@school.edu,+1234567890
Jane Smith,jane.smith@school.edu,+0987654321
Bob Johnson,bob.johnson@school.edu,+1122334455`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students-template.csv"');
    res.send(csvTemplate);
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
}
