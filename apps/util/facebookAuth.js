const axios = require("axios");
const querystring = require("querystring");

function getFacebookAuthURL() {
    const rootUrl = "https://www.facebook.com/v21.0/dialog/oauth";
    const options = {
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URL,
        scope: ["email", "public_profile"].join(","),
        response_type: "code",
        auth_type: "rerequest",
    };
    return `${rootUrl}?${querystring.stringify(options)}`;
}

async function getFacebookAccessToken(code) {
    const tokenUrl = "https://graph.facebook.com/v21.0/oauth/access_token";
    const params = {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URL,
        code,
    };
    const { data } = await axios.get(tokenUrl, { params });
    return data;
}

async function getFacebookUser(access_token) {
    const userUrl = "https://graph.facebook.com/me";
    const params = {
        fields: "id,name,email,picture",
        access_token,
    };
    const { data } = await axios.get(userUrl, { params });
    return data;
}

module.exports = {
  getFacebookAuthURL,
  getFacebookAccessToken,
  getFacebookUser,
};