import "./App.css"
import { formatDexNumber } from "./shared/dex"

const dexNumbers: number[] = [1, 25, 493, 1025]

function App() {
  const labels = dexNumbers.map(formatDexNumber)

  return (
    <>
      <div className="dex">
        <h1 style={{ fontFamily: "var(--font-display)" }}>도감 백과</h1>
        <ul>
          {labels.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App
