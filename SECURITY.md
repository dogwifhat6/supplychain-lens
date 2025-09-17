# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public GitHub issue

Security vulnerabilities should be reported privately to protect our users.

### 2. Email us directly

Send an email to: security@supplychainlens.com

Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if you have them)

### 3. What to expect

- We will acknowledge receipt within 48 hours
- We will provide regular updates on our progress
- We will work with you to understand and resolve the issue
- We will credit you in our security advisories (unless you prefer to remain anonymous)

## Security Measures

### Authentication & Authorization
- JWT-based authentication with secure token handling
- Role-based access control (RBAC)
- Session management with secure cookies
- Password hashing using bcrypt

### Data Protection
- Encryption at rest for sensitive data
- HTTPS/TLS for all communications
- Input validation and sanitization
- SQL injection prevention using Prisma ORM

### API Security
- Rate limiting to prevent abuse
- CORS configuration
- Request validation using Joi and express-validator
- Error handling that doesn't leak sensitive information

### Infrastructure Security
- Docker containers with minimal attack surface
- Non-root user execution
- Regular security updates
- Network segmentation

### Monitoring & Logging
- Comprehensive audit logging
- Security event monitoring
- Error tracking and alerting
- Performance monitoring

## Security Best Practices

### For Developers
- Keep dependencies updated
- Use secure coding practices
- Implement proper input validation
- Follow the principle of least privilege
- Regular security code reviews

### For Users
- Use strong, unique passwords
- Enable two-factor authentication when available
- Keep your systems updated
- Report suspicious activity immediately
- Follow data handling best practices

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed and fixed. We will:

- Release patches for supported versions
- Provide detailed security advisories
- Credit security researchers appropriately
- Maintain a security changelog

## Contact

For security-related questions or concerns:
- Email: security@supplychainlens.com
- Response time: Within 48 hours

## Acknowledgments

We thank the security researchers and community members who help us keep SupplyChainLens secure by responsibly reporting vulnerabilities.

## Legal

This security policy is provided for informational purposes only and does not create any legal obligations or warranties.
