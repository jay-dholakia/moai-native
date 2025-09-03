# Maestro Installation Guide

The automated installation is timing out. Here are manual installation options:

## Option 1: Direct Download (Fastest)

1. Download Maestro directly:
   ```bash
   mkdir -p ~/.maestro
   cd ~/.maestro
   curl -L https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip -o maestro.zip
   unzip maestro.zip
   rm maestro.zip
   ```

2. Add to PATH:
   ```bash
   echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

## Option 2: Homebrew (Recommended but slower)

```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

## Option 3: Using NPX (Alternative)

For each test run, use npx:
```bash
npx @maestro-mobile/cli@latest test .maestro/flows/smoke-test.yaml
```

## Verify Installation

```bash
maestro --version
```

## Quick Test

Once installed, test the setup:
```bash
# Start iOS simulator first
open -a Simulator

# Build and run your app
npm run ios

# Run smoke test
npm run test:e2e:smoke
```

## Troubleshooting

- **Command not found**: Restart terminal and check PATH
- **No device found**: Ensure simulator is running and app is installed
- **Test fails**: Check app is launched and UI elements match test expectations

## Next Steps After Installation

1. Start iOS Simulator: `open -a Simulator`
2. Build app: `npm run ios`
3. Run tests: `npm run test:e2e:smoke`
4. Review test results and iterate

The test framework is ready - just need Maestro CLI installed!