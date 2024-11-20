# flipdisc depth camera

Build fancy visualizations with depth cameras:  https://www.youtube.com/watch?v=lnPYv7SnUhc. It composes depth and color data into one simple imageData buffer at 30-60fps.

![flipdisc display](https://i.imgur.com/6X8ijtq.jpeg "flipdisc display")

- Purchase D435(i) $80ish [ebay](https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2334524.m570.l1313&_nkw=intel+realsense+d435&_sacat=0&_odkw=intel+realsense+d435%3D&_osacat=0)
- Install librealsense 

## Install 
### Mac

```bash
brew install librealsense
npm install
```

### Linux 
```bash

sudo apt install git cmake libssl-dev libusb-1.0-0-dev pkg-config -y
sudo apt install build-essential -y
sudo apt install libglfw3-dev libgl1-mesa-dev libglu1-mesa-dev -y

git clone https://github.com/IntelRealSense/librealsense.git
cd librealsense

sudo cp config/99-realsense-libusb.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && udevadm trigger

mkdir build && cd build
cmake ../ -DBUILD_EXAMPLES=true
make -j$(nproc)
sudo make install

npm install

```

### Update [config/config.js](https://github.com/kelly/flipdisc-depth-camera/blob/main/config/config.js)


### Start

```bash
npm start
```

### Adjust Settings

```js
  depthThreshold: 1000; // [0 - 10000] How close you want it to start picking up objects (in mm)
  darknessThreshold: 50 // [0 - 255]; Adjust this to have more black features detected.
```