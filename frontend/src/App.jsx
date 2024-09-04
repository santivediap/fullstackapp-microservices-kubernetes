import { useState } from 'react'
import './App.css'
import axios from "axios"

function App() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")

  const changeInput = async (e) => {
    e.preventDefault()

    setInput(e.target.value)
  }

  const submitForm = async (e) => {
    e.preventDefault()

    try {
      // Did this so client will request to /api/test instead of //api/test (for example) in backend when proxy is set on NGINX
      const charIndex = input.indexOf("/", input.indexOf("/") + 1)
      const backendRequest = await axios.get(input.substring(0, charIndex) + input.substring(charIndex + 1))
      setResult(backendRequest.data.msg)
      
    } catch(err) {
      console.error(err);
      
      setResult("No matching route in backend")
    }
  }

  return (
    <main>
      <h1>Kubernetes - Demo</h1>
      <form onSubmit={ submitForm }>
        <input placeholder='Try /backend, /backend/api/test or /backend/api/hello' onChange={ changeInput } type="text" />
        <button type="submit">Search backend route</button>
      </form>

      <p>{ result }</p>
    </main>
  )
}

export default App
