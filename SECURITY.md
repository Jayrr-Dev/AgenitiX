# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.12.x  | :white_check_mark: |
| 0.11.x  | :white_check_mark: |
| 0.10.x  | :white_check_mark: |
| < 0.10  | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public issue

Security vulnerabilities should not be disclosed publicly until they have been addressed.

### 2. Report privately

Please report security vulnerabilities by emailing us at [security@agenitix.com](mailto:security@agenitix.com).

Include the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes or mitigations

### 3. Response timeline

We will respond to security reports within 48 hours and provide regular updates on our progress.

### 4. Disclosure process

Once the vulnerability is confirmed and fixed:

- We will release a security patch
- We will update the CHANGELOG.md
- We will publicly acknowledge the report (with permission)

## Security Features

### Built-in Security

AgenitiX includes several security features:

- **Anubis Protection**: Enterprise-grade bot protection with adaptive risk assessment
- **Authentication**: Secure magic link authentication with Convex Auth
- **Data Encryption**: End-to-end encryption for sensitive data
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error handling that doesn't leak sensitive information

### Security Best Practices

When using AgenitiX:

1. **Environment Variables**: Never commit sensitive environment variables
2. **API Keys**: Store API keys securely using Convex's credential management
3. **Authentication**: Use strong authentication methods
4. **Updates**: Keep AgenitiX and dependencies updated
5. **Monitoring**: Enable monitoring and logging for security events

### Data Protection

- **GDPR Compliance**: AgenitiX is designed with GDPR compliance in mind
- **Data Minimization**: Only collect necessary data
- **Right to Deletion**: Users can delete their data
- **Data Portability**: Users can export their data

### Third-Party Security

AgenitiX integrates with several third-party services:

- **Convex**: Real-time database with enterprise security
- **Resend**: Email service with SOC 2 compliance
- **Gmail API**: Google's secure email API
- **Sentry**: Error tracking with data privacy controls

## Security Audit

We regularly conduct security audits:

- **Code Reviews**: All code changes are reviewed for security issues
- **Dependency Scanning**: Regular scanning of dependencies for vulnerabilities
- **Penetration Testing**: Periodic security testing
- **Compliance Checks**: Regular compliance assessments

## Responsible Disclosure

We follow responsible disclosure practices:

1. **Private Reporting**: Vulnerabilities are reported privately first
2. **Timely Fixes**: We work to fix vulnerabilities quickly
3. **Public Disclosure**: We disclose vulnerabilities after fixes are available
4. **Credit**: We give credit to security researchers who report vulnerabilities

## Security Contact

For security-related questions or reports:

- **Email**: [security@agenitix.com](mailto:security@agenitix.com)
- **PGP Key**: Available upon request
- **Response Time**: Within 48 hours

## Security Updates

Security updates are released as soon as possible. We recommend:

- **Automatic Updates**: Enable automatic updates when possible
- **Regular Checks**: Check for updates regularly
- **Security Alerts**: Subscribe to security alerts

## Bug Bounty Program

We are considering a bug bounty program for security researchers. More information will be available soon.

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Best Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Convex Security](https://docs.convex.dev/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
