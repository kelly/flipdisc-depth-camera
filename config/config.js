import { Panels } from 'flipdisc'

const layout = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
  [21, 22, 23, 24]
]
const devices = [{
  path: '/dev/ttyUSB1',
  addresses: [1, 5, 9, 13, 17, 21],
  baudRate: 57600
}, {
  path: '/dev/ttyUSB3', 
  addresses: [2, 6, 10, 14, 18, 22],
  baudRate: 57600
}, {
  path: '/dev/ttyUSB2', 
  addresses: [3, 7, 11, 15, 19, 23],
  baudRate: 57600
}, {
  path: '/dev/ttyUSB0',
  addresses: [4, 8, 12, 16, 20, 24],
  baudRate: 57600
}]

const options = {
  isMirrored: false,
  panel: {
    type: Panels.AlfaZetaSegmentPanel,
    width: 7,
    height: 4
  } 
}

export { layout, devices, options }