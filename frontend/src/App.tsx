import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import ReportForm from './pages/ReportForm'
import Complete from './pages/Complete'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/report/:id" element={<ReportForm />} />
          <Route path="/complete" element={<Complete />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
