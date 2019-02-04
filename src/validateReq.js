import CONFIG from './config';


/**
 * Validates the request against the stored token
 *
 * @param {{headers, body}} req Request Object
 *
 * @returns {boolean} true if valid
 */
export default function ValidateReq({ headers }) {
    const token = headers['x-gitlab-token'];

    return token === CONFIG.SECRET;
}
