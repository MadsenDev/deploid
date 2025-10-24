// NetworkDebug component for debugging network connectivity
// This is a template that will be used by the debug-network plugin

export const NetworkDebug = () => {
  const [testResult, setTestResult] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(false)

  const testNetwork = async () => {
    setIsLoading(true)
    setTestResult('Testing network connectivity...\n')
    
    try {
      // Test 1: Basic fetch to a reliable public API
      try {
        setTestResult((prev: string) => prev + `🔄 Testing API endpoint: https://httpbin.org/get\n`)
        const response = await fetch('https://httpbin.org/get', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        setTestResult((prev: string) => prev + `✅ API Health Check: ${response.status} ${response.statusText}\n`)
      } catch (apiError) {
        const error = apiError as Error
        setTestResult((prev: string) => prev + `❌ API Test Failed:\n`)
        setTestResult((prev: string) => prev + `   Error: ${error.message}\n`)
        setTestResult((prev: string) => prev + `   Type: ${error.constructor.name}\n`)
        throw apiError
      }
      
      // Test 2: Check if we can reach a reliable domain
      try {
        setTestResult((prev: string) => prev + `🔄 Testing domain: https://www.google.com/\n`)
        const pingResponse = await fetch('https://www.google.com/', {
          method: 'HEAD',
        })
        
        setTestResult((prev: string) => prev + `✅ Domain Reachable: ${pingResponse.status}\n`)
      } catch (domainError) {
        const error = domainError as Error
        setTestResult((prev: string) => prev + `❌ Domain Test Failed:\n`)
        setTestResult((prev: string) => prev + `   Error: ${error.message}\n`)
        setTestResult((prev: string) => prev + `   Type: ${error.constructor.name}\n`)
        throw domainError
      }
      
      // Test 3: Check localStorage availability
      try {
        localStorage.setItem('test', 'value')
        const retrieved = localStorage.getItem('test')
        localStorage.removeItem('test')
        setTestResult((prev: string) => prev + `✅ localStorage: Working (${retrieved === 'value' ? 'OK' : 'FAIL'})\n`)
      } catch (error) {
        setTestResult((prev: string) => prev + `❌ localStorage: ${error}\n`)
      }
      
      // Test 4: Check user agent
      setTestResult((prev: string) => prev + `📱 User Agent: ${navigator.userAgent}\n`)
      
    } catch (error) {
      const err = error as Error
      setTestResult((prev: string) => prev + `❌ Network Error Details:\n`)
      setTestResult((prev: string) => prev + `   Error Type: ${err.constructor.name}\n`)
      setTestResult((prev: string) => prev + `   Error Message: ${err.message}\n`)
      setTestResult((prev: string) => prev + `   Error Stack: ${err.stack}\n`)
      setTestResult((prev: string) => prev + `   Full Error: ${JSON.stringify(error, null, 2)}\n`)
      
      // Additional debugging info
      setTestResult((prev: string) => prev + `\n🔍 Debug Information:\n`)
      setTestResult((prev: string) => prev + `   Online Status: ${navigator.onLine}\n`)
      setTestResult((prev: string) => prev + `   Connection Type: ${(navigator as any).connection?.effectiveType || 'unknown'}\n`)
      setTestResult((prev: string) => prev + `   User Agent: ${navigator.userAgent}\n`)
      setTestResult((prev: string) => prev + `   Current URL: ${window.location.href}\n`)
      setTestResult((prev: string) => prev + `   Protocol: ${window.location.protocol}\n`)
      setTestResult((prev: string) => prev + `   Host: ${window.location.host}\n`)
      
      // Network-specific debugging
      setTestResult((prev: string) => prev + `\n🌐 Network Analysis:\n`)
      setTestResult((prev: string) => prev + `   Is Localhost: ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'}\n`)
      setTestResult((prev: string) => prev + `   Is HTTPS: ${window.location.protocol === 'https:'}\n`)
      setTestResult((prev: string) => prev + `   Is Android: ${navigator.userAgent.includes('Android')}\n`)
      setTestResult((prev: string) => prev + `   Is WayDroid: ${navigator.userAgent.includes('WayDroid')}\n`)
      
      // Try alternative endpoints
      setTestResult((prev: string) => prev + `\n🔄 Testing Alternative Endpoints:\n`)
      
      // Test localhost HTTP instead of external HTTPS
      try {
        setTestResult((prev: string) => prev + `   Testing localhost HTTP...\n`)
        const localResponse = await fetch('http://localhost:3000', { method: 'HEAD' })
        setTestResult((prev: string) => prev + `   ✅ Localhost HTTP: ${localResponse.status}\n`)
      } catch (localError) {
        setTestResult((prev: string) => prev + `   ❌ Localhost HTTP failed: ${(localError as Error).message}\n`)
      }
      
      // Test if we can reach the current domain
      try {
        setTestResult((prev: string) => prev + `   Testing current domain...\n`)
        const currentResponse = await fetch(window.location.origin, { method: 'HEAD' })
        setTestResult((prev: string) => prev + `   ✅ Current domain: ${currentResponse.status}\n`)
      } catch (currentError) {
        setTestResult((prev: string) => prev + `   ❌ Current domain failed: ${(currentError as Error).message}\n`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white font-bold mb-2">Network Debug</h3>
      <button 
        onClick={testNetwork}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Network'}
      </button>
      <pre className="text-green-400 text-xs mt-2 whitespace-pre-wrap">
        {testResult}
      </pre>
    </div>
  )
}