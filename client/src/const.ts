export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Path to the local login page */
export const LOGIN_PATH = "/login";

/** Redirect to login page (replaces Manus OAuth portal redirect) */
export const getLoginUrl = () => LOGIN_PATH;
