const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': '694c27dd168aa50020a882a7',
            'PLAID-SECRET': '666a5e8300db0fb89e11e927cc8430',
        },
    },
});

const client = new PlaidApi(configuration);

async function test() {
    try {
        console.log("Testing Plaid Credentials...");
        const response = await client.linkTokenCreate({
            user: { client_user_id: 'test_user_verification' },
            client_name: 'Verification Test',
            products: ['transactions'],
            country_codes: ['DE'],
            language: 'en',
        });
        console.log('SUCCESS: Generated Link Token:', response.data.link_token);
    } catch (error) {
        console.error('FAILURE:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

test();
