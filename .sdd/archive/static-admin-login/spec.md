# Static Admin Login

## Why

The album link will be shared publicly, so visitors should be able to browse and copy lists without accidentally editing Angela's album state.

## What

Add a static JSON-backed login simulation with an admin role. Angela can log in and edit collected/repeated stickers; normal visitors cannot edit.

## Constraints

- MUST store the static user records in a `.json` file.
- MUST align the login control with the title area on the right.
- MUST preserve browse, search, tab, progress, and copy behavior for visitors.
- MUST NOT add a backend or runtime dependency.
- MUST treat this as a static simulation, not real security.

## Tasks

1. Add static users and local auth state.
   Verify: TypeScript can import the JSON and exposes admin/normal role state.
2. Add header login/logout UI.
   Verify: Login button sits beside the title and the form works on mobile/desktop.
3. Gate edit controls by admin role.
   Verify: visitors cannot toggle collected state or repeated counts; admin can.
4. Update display docs and run build.
   Verify: `npm run build` passes.

## Validation

- Visitor view shows read-only sticker rows and no plus/minus mutation controls.
- Admin login enables all existing editing actions.
- Logout returns to read-only mode.
