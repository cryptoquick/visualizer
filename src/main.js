'use strict'

// Helpers
const log = (val) => {
  console.log(val)
  return val
}

const map = (arr, func) => {
  const result = []
  for (let i = 0, ii = arr.length; i < ii; i++) {
    result.push(func(arr[i], i))
  }
  return result
}

const wait = (time) => new Promise((resolve, reject) => {
  const clearValue = setTimeout(() => resolve(clearValue), time)
})

// Color Normalization Helpers
const normalizeValue = ({ value, min, max }) => ((value - min) * (1.0 / (max - min)) + 1 || 1).toFixed(0)

// Rainbow
const getColor = ({ value }) => `hsl(${ ((value / 128) * 360).toFixed(0) }, 100%, 44%)`

// Presentational Components
const h = React.createElement

const Chart = ({
    data,
    width,
    height,
    gap,
  }) => h('svg', { width, height },
    Row({
      data,
      grid_y: 0,
      height,
      width: width - data.length * gap,
      row_length: data.length,
      min: data.reduce((min, value) => Math.min(min, value || 1), 1),
      max: data.reduce((max, value) => Math.max(max, value || 0), 0),
      gap,
    })
  )

const Row = ({
    data,
    grid_y,
    width,
    height,
    row_length,
    min,
    max,
    gap,
  }) => h('g',
    { transform: `translate(0, ${grid_y * 90})` },
    ...map(
      data,
      (value, grid_x) => Cell({
        value,
        grid_x,
        grid_y,
        width,
        height,
        row_length,
        min,
        max,
        gap,
      })
    )
  )

const Cell = ({
    value,
    grid_x,
    grid_y,
    width,
    height,
    row_length,
    min,
    max,
    gap,
  }) => h('rect', {
    x: grid_x * (width / row_length + gap),
    y: 0,
    width: width / row_length,
    height: 100,
    rx: 4,
    ry: 4,
    fill: getColor({ value, min, max, grid_y }),
  })

// Audio
const getAudioStream = () => {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

  return new Promise((resolve, reject) => {
    navigator.getUserMedia({
      video: false,
      audio: true,
    }, (mediaStream) => {
      resolve(mediaStream)
    }, (error) => {
      console.error(error)
      reject(error)
    })
  })
}

const getAudioContext = () => {
  window.AudioContext = window.AudioContext || window.webkitAudioContext
  return new AudioContext()
}

let data, analyzer

const render = async () => {
  await wait(50) // Rate limit at 20 FPS
  analyzer.getByteTimeDomainData(data)
  chart('chart_div', data)
  requestAnimationFrame(render)
}

const main = async () => {
  try {
    const stream = await getAudioStream()
    const context = getAudioContext()
    const microphone = context.createMediaStreamSource(stream)
    analyzer = context.createAnalyser()
    analyzer.fftSize = 128 // 2048
    const bufferLength = analyzer.frequencyBinCount
    data = new Uint8Array(bufferLength)
    analyzer.getByteTimeDomainData(data)
    microphone.connect(analyzer)
    render()
  }
  catch (error) {
    console.error(error)
  }
}

main()

// Render Chart
const sizeScreen = (component, { data, width, height, gap }) => {
  width = window.innerWidth
  return Chart({ data, width, height, gap })
}

const chart = (chart_id, data) => {
  const gap = 1
  const width = window.innerWidth
  const height = 100
  ReactDOM.render(sizeScreen(Chart, { data, width, height, gap }), document.getElementById(chart_id))
}
