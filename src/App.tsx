import "./App.css"
import { formatDexNumber } from "./shared/dex"

const dexNumbers: number[] = [1, 25, 493, 1025]

function App() {
  const labels = dexNumbers.map(formatDexNumber)

  return (
    <>
      <div className="dex">
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
