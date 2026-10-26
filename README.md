# DHRD — Department of Human Resource Development

ប្រព័ន្ធគ្រប់គ្រងឯកសារ និងធនធានមនុស្ស  
**Ministry of Health (MoH)**

## 1. Overview

DHRD is a web-based management system designed to support the Department of Human Resource Development in organizing documents, administrative dispatches, examinations, training programs, certificates, user permissions, and system activities.

The system is intended to support multiple offices (Bureaus) and centralized data management.

### Main Features

- Document Library and document uploads
- Incoming and outgoing dispatch management
- Examination management
- Training management
- Certificate management and QR code verification
- User management and role-based permissions
- Bureau-level access control
- System settings and location management
- Audit logs and activity tracking
- CSV export and data backup
- Google Drive integration for file storage
- Supabase integration for centralized data management (subject to configuration)

## 2. Technology Stack

| Component | Purpose |
|---|---|
| HTML | Application structure |
| CSS / Tailwind CSS | User interface and responsive layout |
| JavaScript | Application logic |
| Supabase Auth | Authentication, when configured |
| Supabase Database | Centralized data storage, when configured |
| Supabase Row Level Security (RLS) | Database access control |
| Google Drive | Document file storage |
| Google Apps Script | Google Drive upload endpoint |
| GitHub | Source code version control and repository hosting |

> Note: Confirm the actual versions, CDN dependencies, and deployment configuration in the application source before publishing this documentation.

## 3. Project Structure

Recommended project structure:

```text
DHRD/
├── README.md
├── index.html
├── assets/
│   ├── images/
│   ├── icons/
│   └── styles/
├── scripts/
│   └── app.js
├── supabase/
│   ├── migrations/
│   └── functions/
│       └── dhrd-admin-create-user/
└── docs/
    ├── USER_MANUAL.md
    └── SECURITY.md
```

The structure above is a recommended organization. Keep the existing single-file application if it is currently deployed that way; do not move files until their dependencies and deployment paths have been checked.

## 4. Requirements

Before deploying the system, prepare:

- A GitHub repository or another approved hosting environment.
- A Supabase project, if centralized authentication and database storage are required.
- A Google Drive folder for documents.
- A Google Apps Script Web App for authorized document uploads.
- Appropriate administrative accounts and access policies.
- A backup of existing data before modifying the application.

## 5. Supabase Configuration

### 5.1 Create a Supabase Project

1. Create a project in the Supabase Dashboard.
2. Open the project's API settings.
3. Obtain the Project URL and publishable key (or legacy `anon` key, where applicable).
4. Enable the required authentication methods.
5. Create and review the database tables required by the application.
6. Configure Row Level Security policies before allowing access to sensitive data.

### 5.2 Configure the Client

For a browser-based application using Supabase JavaScript v2, the configuration can follow this pattern:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
```

Use the appropriate Supabase CDN script or package setup for the deployment environment.

**Security requirements:**

- Never place a Supabase `service_role` key or secret key in browser code.
- Never store user passwords in `localStorage` or application tables.
- Use Supabase Auth to manage credentials.
- Protect database tables with RLS.
- Verify authorization on the server or database for every sensitive operation.
- Do not assume that hiding a button in the UI provides access control.

The configuration above is an example. It does not automatically connect or migrate the existing DHRD application.

## 6. Authentication and User Management

The recommended authentication and authorization design consists of:

1. Supabase Auth for sign-in and session management.
2. User profiles for non-sensitive user information.
3. Role assignments for predefined roles.
4. Bureau scopes for office-level access.
5. Module permissions for specific application features.
6. Permission overrides for approved exceptions.
7. Server-side or database enforcement for protected operations.
8. Audit events for security-sensitive activities.

### 6.1 Recommended Roles

| Role | Description |
|---|---|
| Super Admin | Full system administration, subject to protected administrative controls |
| System Administrator | Manages approved system settings and users |
| Editor / Officer | Creates and edits permitted records |
| Viewer | Reads permitted information |
| Approver / Auditor | Reviews or approves assigned records and views authorized audit information |

Assign the minimum permissions necessary for each user's responsibilities.

### 6.2 Recommended Permissions

| Permission | Description |
|---|---|
| Read | View permitted records |
| Create | Create new records |
| Edit | Modify permitted records |
| Upload | Upload authorized files |
| Download | Download permitted files |
| Delete | Delete authorized records |
| Approve | Approve assigned requests or records |
| Export | Export authorized data |
| Manage Users | Manage user accounts and assignments |
| Manage Settings | Change authorized system settings |
| View Audit Logs | View authorized activity records |
| Backup | Create or initiate authorized backups |
| Restore | Restore data under controlled procedures |

### 6.3 Bureau and Module Access

Permissions should be evaluated against both the user's assigned Bureau and the requested module/action.

Example modules:

- Documents
- Dispatch
- Examinations
- Training
- Certificates
- User Management
- System Settings
- Audit Logs
- Backup and Recovery

A user authorized to read documents in one Bureau should not automatically receive access to documents belonging to another Bureau.

## 7. Google Drive Integration

Google Drive can be used to store document files, while the application database stores associated metadata and authorized file references.

### Setup

1. Create a dedicated Google Drive folder.
2. Create a Google Apps Script project to handle authorized uploads.
3. Deploy the script as a Web App with carefully reviewed execution and access settings.
4. Configure the endpoint in the application.
5. Validate upload responses before recording a successful upload.
6. Test upload, access, download, and error handling.

Example configuration:

```javascript
const GOOGLE_DRIVE_WEBHOOK_URL =
  "YOUR_AUTHORIZED_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

Do not expose confidential credentials in the repository. Restrict access to the upload endpoint and validate file type, file size, user authorization, and upload results.

Do not record an upload as successful unless the server confirms that the file was stored successfully.

## 8. Data Management and Migration

Before moving existing data from browser storage to Supabase:

1. Export and preserve the existing data.
2. Identify all existing storage keys and database tables.
3. Define a mapping between legacy records and the new schema.
4. Identify duplicate records and missing identifiers.
5. Migrate a test copy first.
6. Verify record counts, file references, permissions, and relationships.
7. Test all existing application modules.
8. Plan a controlled deployment and rollback procedure.

Do not delete legacy browser data until migration and recovery have been verified.

## 9. Security Checklist

Before production deployment, verify the following:

- [ ] Authentication is handled by Supabase Auth or another approved authentication provider.
- [ ] No plaintext passwords are stored in application storage.
- [ ] No secret or `service_role` keys are exposed in client-side code.
- [ ] RLS is enabled and tested on protected database tables.
- [ ] Users cannot access records outside their authorized Bureau.
- [ ] Module permissions are enforced by trusted backend/database controls.
- [ ] Administrative actions require appropriate authorization.
- [ ] Login attempts and important security events are logged.
- [ ] Session expiration and sign-out behavior are tested.
- [ ] File uploads validate type, size, and authorization.
- [ ] Dynamic user content is rendered safely to prevent XSS.
- [ ] Backup and restore procedures have been tested.
- [ ] Sensitive data is not unnecessarily exposed in logs or exports.
- [ ] Administrative accounts use strong authentication and MFA where available.

## 10. Backup and Recovery

The system should maintain a documented backup process for:

- Database records
- User profile and permission configuration
- Document metadata
- Relevant file storage references
- Google Drive documents
- Application source code and deployment configuration

A database backup does not necessarily include files stored in Google Drive. Verify that database backups and file backups are both covered.

Restrict restore operations to authorized administrators and test restoration in a non-production environment.

## 11. Testing Before Deployment

Test the following workflows before releasing an updated version:

- Login and logout
- Session persistence and expiration
- User creation, suspension, and activation
- Role assignment and custom permissions
- Bureau and module access restrictions
- Document upload and download
- Dispatch management
- Examination and training management
- Certificate generation and QR verification
- CSV export
- Audit logging
- Backup and restore
- Google Drive and Supabase connection failures
- Responsive layout on desktop and mobile devices

Test with separate accounts for each role. Confirm that unauthorized operations are rejected by the backend, not merely hidden from the interface.

## 12. Deployment

For GitHub-based deployment:

1. Commit the reviewed source code.
2. Confirm that secrets and sensitive files are excluded from version control.
3. Configure the hosting environment.
4. Set the correct Supabase and Google Drive configuration.
5. Verify authentication, RLS, and file upload behavior.
6. Test the deployed application using non-administrative accounts.
7. Retain the previous stable version for rollback.

The exact deployment procedure depends on the hosting platform and the current repository structure.

## 13. Development Guidelines

- Preserve existing DHRD modules unless a change has been approved.
- Make incremental changes rather than replacing the application without migration.
- Keep authentication, authorization, and database access clearly separated.
- Document database schema changes and migrations.
- Avoid committing passwords, API secrets, or confidential records.
- Test changes against a backup or staging environment before production.
- Maintain a record of important changes and known limitations.

## 14. License and Internal Use

This project is intended for the Department of Human Resource Development and its authorized users.

Specify the applicable license, ownership, and redistribution policy before making the repository public. Do not publish confidential personnel information or operational secrets.

## 15. Project Status

The actual implementation status of Supabase Auth, RLS policies, Google Drive integration, backup automation, and permission enforcement must be verified against the deployed application and backend configuration.

This README documents the intended architecture and recommended operating practices. It does not certify that every feature or security control has already been implemented.

---

**Department of Human Resource Development (DHRD)**  
**Ministry of Health (MoH)**  
Cambodia
