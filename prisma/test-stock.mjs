const http = require('http')

const BASE_URL = 'http://localhost:3000'

function makeRequest(path, method, body, cookies) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const headers = { 'Content-Type': 'application/json' }
    if (cookies) {
      headers['Cookie'] = cookies
    }
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers,
    }
    const req = http.request(options, (res) => {
      let responseBody = ''
      res.on('data', (chunk) => { responseBody += chunk })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseBody,
        })
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  // Step 1: Login with credentials
  const loginRes = await makeRequest('/api/auth/callback/credentials', 'POST', {
    redirect: 'false',
    email: 'demo@fashionbiz.ai',
    password: 'demo123',
  })

  console.log('Login status:', loginRes.status)

  const cookies = loginRes.headers['set-cookie']
    ? loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
    : ''

  if (!cookies) {
    console.log('No cookies returned from login')
    return
  }

  console.log('Got session cookie')

  // Step 2: Get a product to test stock adjustment
  const productsRes = await makeRequest('/api/products', 'GET', null, cookies)
  console.log('Products status:', productsRes.status)

  const products = JSON.parse(productsRes.body)
  console.log('Products count:', products.length)

  if (products.length === 0) {
    console.log('No products to test with')
    return
  }

  const product = products[0]
  console.log('First product:', product.name, 'Current stock:', product.variants[0]?.stock)

  // Step 3: Add stock via PATCH endpoint
  const stockRes = await makeRequest('/api/products/' + product.id + '/stock', 'PATCH', {
    quantity: 50,
    notes: 'Restock via test script',
  }, cookies)

  console.log('Stock adjustment status:', stockRes.status)
  console.log('Stock response:', stockRes.body)

  // Step 4: Verify the stock was updated
  const verifyRes = await makeRequest('/api/products', 'GET', null, cookies)
  const updatedProducts = JSON.parse(verifyRes.body)
  const updatedProduct = updatedProducts.find(p => p.id === product.id)
  console.log('Updated stock for', updatedProduct.name + ':', updatedProduct.variants[0]?.stock)
}

main().catch(console.error)
