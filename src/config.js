const env = process.env;

export default {
    ASSET_PATH: env.REACT_APP_ASSET_PATH || ".",
    DAILY_SUBDOMAIN: env.REACT_APP_DAILY_SUBDOMAIN,
    COMPANY_NAME: env.REACT_APP_COMPANY_NAME || "Daily.co",
    COMPANY_URL: env.REACT_APP_COMPANY_URL || "https://daily.co",
}