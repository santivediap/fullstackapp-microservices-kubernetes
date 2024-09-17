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
      const backendRequest = await axios.get(input)
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
