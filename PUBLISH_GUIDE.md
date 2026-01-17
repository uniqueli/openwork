# Publishing Guide for @uniqueli/openwork

## Pre-publish Checklist

- [x] Update version in `package.json` (v0.2.0)
- [x] Update README.md with new features
- [x] Create release notes
- [x] Run `npm run build` successfully
- [ ] Test the built application
- [ ] Login to npm
- [ ] Publish to npm

## Step-by-Step Publishing

### 1. Verify Build

```bash
cd openwork
npm run build
```

Make sure there are no errors.

### 2. Test Locally (Optional but Recommended)

```bash
# Test the built application
npm start
```

Verify that:
- The app launches correctly
- You can add custom providers via the "+ 添加Provider" button
- Custom providers appear in the provider list
- Models work correctly with custom APIs

### 3. Login to npm

```bash
npm login
```

Enter your npm credentials:
- Username: `uniqueli`
- Password: (your npm password)
- Email: (your npm email)
- OTP: (if 2FA is enabled)

### 4. Publish to npm

```bash
npm publish --access public
```

The `--access public` flag is required for scoped packages (@uniqueli/openwork).

### 5. Verify Publication

After publishing, verify at:
- https://www.npmjs.com/package/@uniqueli/openwork

Check that:
- Version shows as 0.2.0
- README displays correctly
- Package can be installed: `npm install -g @uniqueli/openwork`

### 6. Create GitHub Release (Optional)

1. Go to https://github.com/uniqueli/openwork/releases
2. Click "Draft a new release"
3. Tag: `v0.2.0`
4. Title: `v0.2.0 - Multiple Custom API Providers`
5. Description: Copy from `RELEASE_NOTES_v0.2.0.md`
6. Publish release

## Troubleshooting

### "You must be logged in to publish packages"
Run `npm login` first.

### "You do not have permission to publish"
Make sure you're logged in as the correct user and have access to the `@uniqueli` scope.

### "Package already exists"
The version might already be published. Increment the version number in `package.json`.

### Build errors
Run `npm run typecheck` to see TypeScript errors, then fix them before building.

## Post-publish

After successful publication:

1. Test installation:
   ```bash
   npm install -g @uniqueli/openwork@0.2.0
   openwork
   ```

2. Update documentation if needed

3. Announce the release (optional):
   - Twitter/X
   - Reddit (r/programming, r/node, etc.)
   - Hacker News
   - Chinese tech communities (V2EX, 掘金, etc.)

## Quick Publish Command

If everything is ready:

```bash
cd openwork && npm run build && npm publish --access public
```
