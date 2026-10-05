# 🖋️ WeVis's E-Initiative Template

Full process template for citizen initiative campaign, from digital signatures' collection to PDF document rendering for legislative submission.

[View campaign site demo](https://wevisdemo.github.io/e-initiative-template/)

**Table of contents**

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [🌟 Features](#-features)
- [🔍 Usage](#-usage)
  - [Clone the template](#clone-the-template)
  - [Set up data sources](#set-up-data-sources)
    - [Firebase](#firebase)
    - [Cloudflare Turnstile](#cloudflare-turnstile)
    - [Cloud Functions](#cloud-functions)
    - [Google Sheets](#google-sheets)
  - [Configuration file](#configuration-file)
  - [Campaign website](#campaign-website)
    - [Development](#development)
    - [Build](#build)
    - [Deployment](#deployment)
  - [Post-campaign scripts](#post-campaign-scripts)
    - [Test and adjustment with mock data](#test-and-adjustment-with-mock-data)
    - [Download and render production data](#download-and-render-production-data)
- [📚 Appendix](#-appendix)
  - [How to make a legislative initiative?](#how-to-make-a-legislative-initiative)
- [⚖️ License](#-license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 🌟 Features

1. **Ready to use campaign static website** _(Astro, Svelte, Tailwind and DaisyUI)_
   - An online form with a signature pad
   - Signatures counter, from both offline and online channels
   - Support offline sign locations list
   - Privacy policy template
   - GitHub Action's Workflow file for build and deploy to GitHub Pages
2. **Database configuration** _(Firebase, Cloudflare Turnstile, and Google Sheets with Sheethuahua)_
   - Cloudflare Turnstile integration for bot/spam protection on the online form
   - Firebase Cloud Functions for online submission, signature count, and admin-only data download
   - Firebase emulator with mocked data for local development
   - Google Sheets template for human-curated data
3. **Post-campaign scripts** _(pdf-lib and Node.js)_
   - Download online submission signatories' data as CSV files
   - Render CSV data on the PDF template for legislative submission

The configuration file is provided, but everything can be customized via code.

## 🔍 Usage

Required [Node.js](https://nodejs.org/en) v20 or higher with [pnpm](https://pnpm.io) package manager.

### Clone the template

```sh
pnpm dlx degit github:wevisdemo/e-initiative-template <project-name>
```

The template will be downloaded to the `project-name` folder. Then install the dependencies of both the website and Cloud Functions (`functions` is a separate package, not part of the workspace):

```sh
pnpm install
pnpm --dir functions install --ignore-workspace
```

### Set up data sources

#### Firebase

For online signature submission

1. Create a new project in [Firebase Console](https://console.firebase.google.com) and upgrade it to the _Blaze_ plan (required for Cloud Functions). Then set the project ID as `prod` in [`.firebaserc`](.firebaserc).
2. Set up **Authentication**
   2.1. Enable _"Email/Password"_ and _"Anonymous"_ sign-in methods.
   2.2. Add user and provide email/password for the admin account. Then add the same information in the local `.env.production` file (create it in the project folder if it does not exist) with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` keys. They are used by the download script, not by the website build.
3. Set up **Firestore Database** by enabling the Firestore. The rules in [`firestore.rules`](firestore.rules) deny all client access since every read and write goes through Cloud Functions. They are deployed together with the functions in the [Cloud Functions](#cloud-functions) step.
4. Obtain Firebase config
   4.1. Add a new web app from project settings > General > Your Apps
   4.2. Copy `firebaseConfig` as a one-line JSON format and put it in `PUBLIC_FIREBASE_CONFIG` of the local `.env.production` file.

At the end, your `.env.production` file should look like this:

```env
PUBLIC_FIREBASE_CONFIG={"apiKey": "???", "authDomain": "???", "projectId": "???", "storageBucket": "???", "messagingSenderId": "???", "appId": "???"}
ADMIN_EMAIL=???
ADMIN_PASSWORD=???
```

**Note:** There is a `.env.development` with mocked data for working with the Firebase emulator in the local development environment. You don't need to change anything there.

#### Cloudflare Turnstile

[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) is used as a CAPTCHA alternative to protect the online signature form from bots and spam submissions. The token is verified server-side in the Firebase Cloud Function before a submission is accepted.

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com/) and navigate to **Turnstile**.
2. Add a new site and configure the allowed hostnames for your campaign domain.
3. Copy the **Site Key** and add it to your `.env.production` file:
   ```env
   PUBLIC_TURNSTILE_SITE_KEY=<your-site-key>
   ```
4. Copy the **Secret Key**. It will be added to `functions/.env` in the [Cloud Functions](#cloud-functions) step.

Your `.env.production` should now include:

```env
PUBLIC_FIREBASE_CONFIG={"apiKey": "???", ...}
PUBLIC_TURNSTILE_SITE_KEY=???
ADMIN_EMAIL=???
ADMIN_PASSWORD=???
```

**Note:** The `.env.development` and `functions/.env.local` files already contain Cloudflare's [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) that always pass verification, so Turnstile works out of the box in the local development environment.

#### Cloud Functions

Online submission, signature count, and data download are handled by Cloud Functions in [`functions/src/index.ts`](functions/src/index.ts).

1. Add your campaign domain to the `cors` list of `callableOptions` in [`functions/src/index.ts`](functions/src/index.ts).
2. Create `functions/.env` with the Cloud Functions environment variables. It is read on deploy, separately from `.env.production`:
   ```env
   ADMIN_EMAIL=<same admin email as in .env.production>
   TURNSTILE_SECRET_KEY=<your-turnstile-secret-key>
   ```
3. Deploy the functions and Firestore rules:
   ```sh
   pnpm exec firebase login
   pnpm exec firebase deploy --only functions,firestore:rules -P prod
   ```

Re-deploy whenever `functions/.env` or the function code changes.

#### Google Sheets

For human-curated data, including offline signature count and voluntary sign locations. You can skip this step if your campaign doesn't need both functions.

1. Duplicate [Google Sheets template](https://docs.google.com/spreadsheets/d/1PPl4bIKrNC68nc9sWDp7aolnTv0xiHZYQRlsvnRpAHc/edit?usp=sharing). It contains 2 sheets:
   - **"offline-signature"** sheets for recording offline signature count in each day. The total number is the summation of every row.
   - **"locations"** is the sign location showing in the location page.
2. Grant _"Viewer"_ permission to _"Anyone with the link"_ in Share menu
3. Obtain Sheets ID from the URL `https://docs.google.com/spreadsheets/d/{sheetsID}/` and add it to the `sheets.id` in [`e-initiative.config.mjs`](e-initiative.config.mjs)
4. _(Optional)_ If you allow anyone to submit a voluntary offline sign location.
   4.1. Create a Google Form with fields corresponding to the columns in the `locations` sheet.
   4.2. In the form response settings, link the form response to your duplicated sheets. A response sheet will be created with each question in the header.
   4.2. Rename the column header to be like the `locations` sheet. Doesn't need to have the same order, but it must correspond to each question.
   4.3 Remove the old `locations` sheet and rename the form response sheet to `locations` instead.

### Configuration file

Most of the campaign information can be configured via [`e-initiative.config.mjs`](e-initiative.config.mjs). Explanation can be found by hovering at the configuration keys (on JSDoc supported IDE) or the [type definition file](src/models/config.d.ts). Configuration should be updated first so that you will know what is not covered and require editing the source code.

### Campaign website

#### Development

- Website content can be directly edited through source code. The index page entry point to get started is [`src/pages/index.astro`](src/pages/index.astro).
- UI components are from either [Daisy UI v3](https://v3.daisyui.com) or custom-made available in [`src/components`](src/components). Svelte is mainly used, but you can install additional[ UI Framework integration for Astro](https://docs.astro.build/en/guides/framework-components/)
- Color theme defined in [`e-initiative.config.mjs`](e-initiative.config.mjs) is available as a Tailwind class. For VSCode users, Tailwind extension is recommended for Tailwind class auto-completion.
- Typography CSS global utility classes are defined in [`src/styles/typography.css`](src/styles/typography.css) and ready to be used.
- Design system corresponds to the [Figma](https://www.figma.com/design/CmcP7sbvY4KSRshC2fKCfD/e-initiative-template)
- Don't forget to review the privacy policy in [`src/pages/privacy-policy.astro`](src/pages/privacy-policy.astro) and remove the _"mark"_ tags (for highlighting) after updating the content.

The emulator runs the compiled Cloud Functions from `functions/lib`, so build them first (and again after changing the function code):

```sh
pnpm --dir functions run build
```

To start Astro development server and Firebase emulator:

```sh
pnpm run dev
```

During the development mode, any changes to Firebase will be in the local emulator, leaving the production database untouched. Mock data will be initialized in the Firestore emulator for post-campaign script testing. The [`.env.development`](.env.development) and `functions/.env.local` are used.

#### Build

To build a website for production:

```sh
pnpm run build
```

The static site will be generated to `/dist` and we can preview the production build with

```sh
pnpm run preview
```

Note that the production build will use `.env.production` and the real Firebase, not the emulator.

#### Deployment

Since Astro uses Static Site Generation (SSG), the signature count and Google Sheets data are fetched only at build time. Re-build and re-deploy to refresh them.

The template includes GitHub Action's workflow file [`.github/workflows/deploy.yaml`](.github/workflows/deploy.yaml), which builds and deploys to GitHub Pages on every push to `main` or when manually run from the Actions tab. Add a `schedule` trigger if you want the data refreshed periodically. Remove the file before pushing to GitHub if you don't want to use it. If you do, add `PUBLIC_FIREBASE_CONFIG` and `PUBLIC_TURNSTILE_SITE_KEY` as repository secrets. The admin credentials are not needed in CI.

### Post-campaign scripts

Your PDF output template might not have the same field value/position as our given template. Before using the thousands of production records, we recommend testing with one record of mock data first.

#### Test and adjustment with mock data

To get mock data (Firebase emulator must be running from `dev` or `dev:firebase` command):

```sh
pnpm run download:local
```

Output CSV files will be generated to the `/out` directory: one version with base64 signature data, and one version without it. Then start the renderer in watch mode:

```sh
pnpm run render:watch
```

The output PDF files will be re-generated to `/out` directory every time any file has changed. Keep adjusting the `renderer` config in [`e-initiative.config.mjs`](e-initiative.config.mjs) until the output PDF looks pretty.

#### Download and render production data

First, download the production signatories' data in CSV format (duplicated or invalid records will be filtered out):

```sh
pnpm run download:prod
```

Then, render to the PDF files:

```sh
pnpm run render
```

Both CSV and PDF files will be generated to `/out` directory, replacing existing data if exists (eg. from mock data).

## 📚 Appendix

### How to make a legislative initiative?

Citizens have the right to propose a law draft to the parliament when they can gather enough signatures (more about [Thailand legislative process](https://parliamentwatch.wevis.info/legislative-process)). The initiative leader usually follows this pattern:

1. **Pre-campaign**

   - Create a law draft
   - Design campaign content and activities

2. **Campaign**
   - Promote the initiative
   - Collect citizen signatures through offline/online channel
3. **Post campaign**
   - Submit the draft together with all the signatures to the parliament

## ⚖️ License

Our team is committed to developing all projects as Open Source and releasing data as Open Data under the [Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) license. This means the work can be used, adapted, and built upon, but it must not be used for commercial purposes or profit-making. Credit must be given to the original creators, and any derivative work must be shared under the same license as the original. WeVis Ltd. and Punch Up Ltd. are the joint licensors of this license.
