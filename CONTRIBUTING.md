# Contributing to SupplyChainLens

Thank you for your interest in contributing to SupplyChainLens! We welcome contributions from the community and are grateful for your help in making this project better.

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 15+
- Redis 7+
- Git

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/supplychain-lens.git
   cd supplychain-lens
   ```
3. **Set up the development environment**:
   ```bash
   ./setup.sh
   ```
4. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Code Style

- **Frontend**: Use TypeScript, follow React best practices
- **Backend**: Use TypeScript, follow Node.js/Express conventions
- **ML Service**: Use Python, follow PEP 8 style guide
- **Database**: Use Prisma for database operations

### Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Add integration tests for API endpoints
- Test ML models with sample data

### Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions
- Update API documentation
- Include examples for new features

## Pull Request Process

1. **Ensure your code follows the style guidelines**
2. **Add tests for your changes**
3. **Update documentation as needed**
4. **Submit a pull request** with a clear description
5. **Respond to code review feedback**

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Issue Reporting

When reporting issues, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, browser, Node.js version, etc.
- **Screenshots**: If applicable

## Feature Requests

For feature requests, please include:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other solutions you've considered
- **Additional context**: Any other relevant information

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and follow our Code of Conduct.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or inappropriate comments
- Personal attacks or political discussions
- Public or private harassment
- Publishing private information without permission
- Other unprofessional conduct

## Development Areas

We're particularly interested in contributions to:

- **ML Models**: Improve accuracy and add new detection capabilities
- **Frontend**: Enhance user experience and add new visualizations
- **Backend**: Optimize performance and add new APIs
- **Documentation**: Improve guides and examples
- **Testing**: Increase test coverage
- **DevOps**: Improve deployment and monitoring

## Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Email**: Contact the maintainers directly

## License

By contributing to SupplyChainLens, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to SupplyChainLens! 🚀
