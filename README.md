[Root Ventures](root.vc) has a custom video conferencing app built on the [Daily](daily.co) API. You can use this on your own if you like. Fork the repo and modify to your heart's content.

## Getting Started

### Setup (Recommended steps using Netlify)
1. Create an account on [Daily.co](https://daily.co) and pick a subdomain name.
1. Deploy the app (recommended: use the Netlify button above, and create an account there.) 
1. Create rooms in the [Daily.co Dashboard](https://dashboard.daily.co), each beginning with the prefix `meet-`. For example, if you want to make rooms for Avidan, Chrissy, Kane, and Lee, you would create rooms called `meet-avidan`, `meet-chrissy`, `meet-kane`, and `meet-lee`. Make sure the rooms are public.
1. Go to your [Netlify Dashboard](https://app.netlify.com/sites) > Settings > Build & Deploy > Environment Variables and add `REACT_APP_DAILY_SUBDOMAIN=[YOUR_DAILY_SUBDOMAIN]`.
1. Visit `https://[YOUR_NETLIFY_APP_NAME].netlify.com/[YOUR_ROOM_NAME]`

### Usage
You must create rooms manually in the [Daily.co Dashboard](https://dashboard.daily.co) before going to the above URL. All room names must begin with `meet-` such as `meet-lee`. This room would be accessible at `https://[YOUR_NETLIFY_APP_NAME].netlify.com/lee`. You can share this URL with anyone.

Each of your meeting rooms are located at their own path name (minus the `meet-` at the beginning): `https://[YOUR_NETLIFY_APP_NAME].netlify.com/[YOUR_ROOM_NAME]`. The `meet-` prefix functions as a namespace in case you want to use your new Daily.co account for other purposes.

## Deployment Options

Deployment requires a [Netlify](https://www.netlify.com) account.

### Deploy with Netlify Button

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rootvc/meet)

### From Command Line

`netlify deploy`

Our app deploys with continuous deployment hooks, which you can configure for your app here: (https://docs.netlify.com/site-deploys/create-deploys/#drag-and-drop).

## Environment Variables

You can configure the following environment variables in the [Netlify UI](https://app.netlify.com/sites) under Settings > Build & Deploy > Environment Variables.

`REACT_APP_DAILY_SUBDOMAIN` = Subdomain on [daily.co](daily.co) for your account. (e.g. `rootvc`)
`REACT_APP_ASSET_PATH` = Path to your custom assets. For our own implementation, we use S3 and put the URL to the bucket here.
`REACT_APP_COMPANY_NAME` = Name of your company, which will appear in the title, alt tags for your logos, and various other places.
`REACT_APP_COMPANY_URL` = URL for your company, which is the target of the anchor tag around your logo.

### Room-Specific Environment Variables
To change the appearance of a room called "wine":
`REACT_APP_ROOM_WINE_TITLE` = text to display in the upper left corner of the screen
`REACT_APP_ROOM_WINE_BACKGROUND` = a filename for a custom loading spinner background that shows before the iframe loads

Learn about environment variables on Netlify: https://docs.netlify.com/configure-builds/environment-variables/#declare-variables

## Command Line Scripts

In the project directory, you can run:

### `npm install`

To install dependencies.

Meet uses [scarf-js](https://github.com/scarf-sh/scarf.js) to collect anonymized installation analytics. These analytics help support the maintainers of this package. However, if you'd like to opt out, you can do so by setting `scarfSettings.enabled = false` in your project's package.json, or by setting the environment variable `SCARF_ANALYTICS=false` before you install. See the scarf-js readme for more information.

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Personalization

### Brand Styles

Edit `src/brand.css` to add your custom color scheme.

### Brand Marks
Default brand marks are located below:

 - `public/favicon.ico`
 - `public/logo192.png`
 - `public/logo512.png`
 - `public/logo-header.png`
 - `public/logo.png`

To use your own brand marks, you can replace these files in your own fork or clone. Or you can change `REACT_APP_ASSET_PATH` to a URL for a directory (e.g. AWS S3, or your own asset server) that contains each of these files by name. See the files for recommended dimensions.

## References

Daily.co API Docs: https://docs.daily.co/reference
Netlify Docs: https://docs.netlify.com/

This app was created with create-react-app. You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started). (It has not been ejected. If you don't know what that means, either read the docs or don't worry about it.)

To learn React, check out the [React documentation](https://reactjs.org/).
