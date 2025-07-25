# Contributing to Glimpse

Thank you for your interest in contributing to Glimpse! We're excited to have you help us build a better creative competition platform inspired by Taskmaster.

## Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please read and follow our Code of Conduct:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome people of all backgrounds and experience levels
- **Be collaborative**: Work together and help each other learn
- **Be patient**: Remember that everyone is learning and growing
- **Be constructive**: Provide helpful feedback and suggestions

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Git
- Basic understanding of Next.js and React
- Familiarity with TypeScript and Tailwind CSS

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/glimpse.git
   cd glimpse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your development environment**
   ```bash
   cp .env.example .env
   # Fill in your development environment variables
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # Open http://localhost:3000 in your browser
   ```

## Development Guidelines

### Code Style and Standards

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check code style
npm run lint

# Fix automatically fixable issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type whenever possible
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Component Guidelines
- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Use custom hooks for complex logic
- Implement proper prop validation with TypeScript
- Follow the component structure:

```typescript
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2 
}) => {
  // Hooks
  // Event handlers
  // Render logic
  
  return (
    // JSX
  );
};
```

### State Management
- Use React Context for global state
- Use local state for component-specific data
- Use custom hooks to encapsulate state logic
- Keep state as close to where it's used as possible

### File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `PromptCard.tsx`)
- Pages: `page.tsx` in app directory (Next.js 13+ convention)
- API Routes: `route.ts` in app/api directories
- Hooks: `camelCase.ts` starting with "use" (e.g., `usePrompts.ts`)
- Utils: `camelCase.ts` (e.g., `dateHelpers.ts`)
- Types: `camelCase.ts` ending with "Types" (e.g., `promptTypes.ts`)

## Testing

We maintain high test coverage to ensure code quality:

### Unit Tests
- Write tests for all business logic
- Test custom hooks thoroughly
- Use React Testing Library for component tests
- Test API routes with Jest
- Aim for 80%+ coverage

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

### E2E Tests
- Use Playwright or Cypress for end-to-end testing
- Focus on critical user journeys
- Test on multiple browsers and screen sizes

## Commit Message Format

We follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(voting): add ranked voting system for competitions
fix(leaderboard): resolve ranking calculation issue
docs(readme): update competition flow instructions
test(hooks): add tests for useLeague and useVoting hooks
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Include a detailed description of changes
   - Reference any related issues
   - Add screenshots for UI changes

### Pull Request Template
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

## Issue Reporting

When reporting bugs or requesting features:

### Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide device/OS information
- Include screenshots or videos if helpful

### Feature Requests
- Use the feature request template
- Explain the problem you're solving
- Describe your proposed solution
- Consider alternative solutions

## Project Areas for Contribution

### Good First Issues
- UI component improvements for league dashboard
- Documentation updates
- Test coverage improvements for voting system
- Bug fixes with clear reproduction steps
- Tailwind CSS styling improvements for competition interface

### Intermediate Contributions
- New creative challenge categories and management
- Voting interface enhancements
- Performance optimizations for leaderboards
- Accessibility improvements for competition features
- Database schema enhancements for voting and scoring
- API route improvements for league management

### Advanced Contributions
- Multiple league system architecture
- Achievement and badge system implementation
- Next.js performance optimizations for real-time updates
- Vercel deployment optimizations for automated cycles
- Security enhancements for voting integrity
- Database optimization and scaling for competition data

## Development Tips

### Local Development
- Use browser developer tools for debugging competition flows
- Enable hot reloading for quick iterations (automatic in Next.js)
- Use React DevTools browser extension
- Test with multiple player accounts for voting scenarios
- Test on multiple screen sizes and browsers

### Performance
- Use React.memo for expensive leaderboard components
- Implement proper image optimization with Next.js Image for submissions
- Monitor bundle size with Next.js bundle analyzer
- Use Next.js built-in performance monitoring
- Optimize vote calculation algorithms

### Accessibility
- Add proper ARIA labels for voting interfaces
- Test screen reader compatibility with competition status
- Ensure good color contrast ratios for rankings
- Support keyboard navigation in voting interface
- Use proper heading hierarchy for dashboard tabs

### Competition Testing
- Test multi-user voting scenarios with different browser sessions
- Verify automated cycle transitions work correctly
- Test vote integrity and anti-gaming measures
- Validate leaderboard calculations and rankings
- Test admin challenge management features

## Community

- **Discussions**: Use GitHub Discussions for questions and ideas
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Chat**: Join our development Discord (invite link in README)
- **Updates**: Follow project updates in GitHub

## Recognition

Contributors will be:
- Listed in our README contributors section
- Credited in release notes for significant contributions
- Invited to beta test new features
- Given priority support for their own issues

Thank you for helping make Glimpse better for everyone! 🎉