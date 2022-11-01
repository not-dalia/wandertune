const randomInt = (upperLimit, type = 'all') => {
  switch (type) {
    case 'even':
      return Math.floor(Math.random() * upperLimit / 2) * 2;
    case 'odd':
      return Math.floor(Math.random() * upperLimit / 2) * 2 + 1;
    case 'all':
    default:
      return Math.floor(Math.random() * upperLimit);
  }
}

const pixelSize = 4;
const pathWidth = 60;
const tileSize = 200;
const streetColor = '#546e7a'
const directions = ['u', 'r', 'd', 'l'];
const currentSeason = ['spring', 'summer', 'autumn', 'winter'][randomInt(4)];

const pixelsPerMeter = 30;

