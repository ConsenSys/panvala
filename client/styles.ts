export const COLORS = {
  primary: '#59B6E6',
  text: '#343434',

  grey1: '#000000',
  grey2: '#343434',
  grey3: '#8E9EA6',
  grey4: '#C5D3D9',
  grey5: '#F0F5F6',
  grey6: '#FCFDFE',
  greyBorder: '#E5ECED',

  white: '#FFFFFF',

  blue1: '#1872A0',
  blue2: '#59B6E6',
  blue3: '#DEF0FA',

  yellow1: 'rgba(255, 245, 2, 0.2)',
  yellow2: '#C6B72C',

  green1: '#E5FFEE',
  green2: '#31AE5C',

  red1: 'rgba(255, 147, 147, 0.25)',
  red2: '#EA6B6B',
};

export const BUTTON_COLORS = {
  default: COLORS.grey5,
  submit: COLORS.grey5,
  firstChoice: COLORS.green1,
  secondChoice: COLORS.yellow1,
  firstChoiceFg: COLORS.green2,
  secondChoiceFg: COLORS.yellow2,
};

export const theme = {
  breakpoints: ['40em', '52em', '64em', '90em'],
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fontSizes: [12, 14, 16, 20, 24, 36, 48, 80, 96],
  fontWeights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  lineHeights: {
    solid: 1,
    title: 1.25,
    copy: 1.5,
  },
  letterSpacings: {
    normal: 'normal',
    tracked: '0.1em',
    tight: '-0.05em',
    mega: '0.25em',
  },
  fonts: {
    serif: 'athelas, georgia, times, serif',
    sansSerif:
      '-apple-system, BlinkMacSystemFont, roboto, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, noto, "segoe ui", arial, sans-serif',
  },
  borders: [0, '1px solid', '2px solid', '4px solid', '8px solid', '16px solid', '32px solid'],
  radii: [0, 2, 4, 16, 9999, '100%'],
  width: [16, 32, 64, 128, 256],
  heights: [16, 32, 64, 128, 256],
  maxWidths: [16, 32, 64, 128, 256, 512, 768, 1024, 1536],
  colors: {
    black: '#000',
    'near-black': '#111',
    'dark-gray': '#333',
    'mid-gray': '#555',
    gray: ' #777',
    silver: '#999',
    'light-silver': '#aaa',
    'moon-gray': '#ccc',
    'light-gray': '#eee',
    'near-white': '#f4f4f4',
    white: '#fff',
    transparent: 'transparent',
    blacks: [
      'rgba(0,0,0,.0125)',
      'rgba(0,0,0,.025)',
      'rgba(0,0,0,.05)',
      'rgba(0,0,0,.1)',
      'rgba(0,0,0,.2)',
      'rgba(0,0,0,.3)',
      'rgba(0,0,0,.4)',
      'rgba(0,0,0,.5)',
      'rgba(0,0,0,.6)',
      'rgba(0,0,0,.7)',
      'rgba(0,0,0,.8)',
      'rgba(0,0,0,.9)',
    ],
    whites: [
      'rgba(255,255,255,.0125)',
      'rgba(255,255,255,.025)',
      'rgba(255,255,255,.05)',
      'rgba(255,255,255,.1)',
      'rgba(255,255,255,.2)',
      'rgba(255,255,255,.3)',
      'rgba(255,255,255,.4)',
      'rgba(255,255,255,.5)',
      'rgba(255,255,255,.6)',
      'rgba(255,255,255,.7)',
      'rgba(255,255,255,.8)',
      'rgba(255,255,255,.9)',
    ],
    // ... and so on
  },
};
