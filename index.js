import RealSenseCamera from 'realsense';
import { createDisplay } from 'flipdisc';
import { processFrame } from "./src/process.js";
import { layout, devices, options } from './config/config.js'

const camera = new RealSenseCamera();
const cameraOptions = {
  depthWidth: 480,
  depthHeight: 270,
  colorWidth: 424,
  colorHeight: 240,
  maxFPS: 30
};

const display = createDisplay(layout, devices, options);

camera.on('frame', (frame) => {
  imageData = processFrame(frame, {
    depthThreshold: 2000,
    darknessThreshold: 20,
    outputWidth: display.width,
    outputHeight: display.height,
    isMirrored: true
  });
  display.send(imageData)
})

camera.on('end', () => {
  console.log('Streaming ended.');
});

camera.start(cameraOptions);