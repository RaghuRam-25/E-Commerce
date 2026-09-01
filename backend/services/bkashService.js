// Memory cache for bKash ID token
let cachedToken = null
let tokenExpiresAt = 0

/**
 * Checks if bKash credentials are properly set in .env and not placeholders.
 */
function isConfigured() {
  const { BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD } = process.env
  return Boolean(
    BKASH_APP_KEY &&
    BKASH_APP_KEY !== 'your_app_key_here' &&
    BKASH_APP_SECRET &&
    BKASH_APP_SECRET !== 'your_app_secret_here' &&
    BKASH_USERNAME &&
    BKASH_USERNAME !== 'your_sandbox_username' &&
    BKASH_PASSWORD &&
    BKASH_PASSWORD !== 'your_sandbox_password'
  )
}

/**
 * Step 1: Grant Token — Authenticates with bKash API using App Key, App Secret, Username, Password.
 * Returns cached token if valid.
 */
async function grantToken() {
  // Check placeholder credentials requirement
  if (!isConfigured()) {
    throw new Error(
      'bKash API credentials are not configured. Please set valid BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, and BKASH_PASSWORD in backend/.env file.'
    )
  }

  // Return cached token if valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  const baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  const appKey = process.env.BKASH_APP_KEY
  const appSecret = process.env.BKASH_APP_SECRET
  const username = process.env.BKASH_USERNAME
  const password = process.env.BKASH_PASSWORD

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username: username,
        password: password,
      },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
      }),
    })

    const data = await res.json()

    if (data.id_token) {
      cachedToken = data.id_token
      tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000
      return cachedToken
    } else {
      throw new Error(data.statusMessage || 'bKash token grant authentication failed.')
    }
  } catch (err) {
    console.error('bKash grantToken error:', err.message)
    throw err
  }
}

/**
 * Step 2: Create Payment — Initializes a bKash Checkout session with official bKash API.
 * Returns official bkashURL for customer redirect.
 */
async function createPayment({ amount, orderId, payerReference = '01700000000' }) {
  const token = await grantToken()
  const baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  const callbackUrl = process.env.BKASH_CALLBACK_URL || 'http://localhost:5000/api/bkash/callback'

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: payerReference,
        callbackURL: `${callbackUrl}?orderId=${orderId}`,
        amount: Number(amount).toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId,
      }),
    })

    const data = await res.json()

    if (data.statusCode === '0000' && data.bkashURL) {
      return {
        paymentID: data.paymentID,
        bkashURL: data.bkashURL,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
      }
    } else {
      throw new Error(data.statusMessage || 'bKash payment creation failed.')
    }
  } catch (err) {
    console.error('bKash createPayment error:', err.message)
    throw err
  }
}

/**
 * Step 3: Execute Payment — Finalizes the transaction after customer completes OTP/PIN on bKash.
 */
async function executePayment(paymentID) {
  const token = await grantToken()
  const baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        paymentID: paymentID,
      }),
    })

    const data = await res.json()
    return data
  } catch (err) {
    console.error('bKash executePayment error:', err.message)
    throw err
  }
}

/**
 * Step 4: Query Payment Status — Verifies transaction status with bKash API.
 */
async function queryPayment(paymentID) {
  const token = await grantToken()
  const baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        paymentID: paymentID,
      }),
    })

    const data = await res.json()
    return data
  } catch (err) {
    console.error('bKash queryPayment error:', err.message)
    throw err
  }
}

module.exports = {
  isConfigured,
  grantToken,
  createPayment,
  executePayment,
  queryPayment,
}
