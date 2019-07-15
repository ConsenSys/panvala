import { Theme } from 'styled-system';

export const COLORS: any = {
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
  blue2: '#489FCC',
  blue3: '#DEF0FA',

  yellow1: 'rgba(255, 245, 2, 0.2)',
  yellow2: '#C6B72C',

  green1: '#E5FFEE',
  green2: '#31AE5C',

  red1: 'rgba(255, 147, 147, 0.25)',
  red2: '#EA6B6B',
};

export const BUTTON_COLORS: any = {
  default: COLORS.grey5,
  submit: COLORS.grey5,
  firstChoice: COLORS.green1,
  secondChoice: COLORS.yellow1,
  firstChoiceFg: COLORS.green2,
  secondChoiceFg: COLORS.yellow2,
};

export const colors: any = {
  black: '#000',
  grey: '#8E9EA6',
  greys: {
    dark: '#343434',
    border: '#E5ECED',
    light: '#F0F5F6',
    veryLight: '#FCFDFE',
    disabled: '#C5D3D9',
  },
  white: '#FFF',
  transparent: 'transparent',
  blue: '#489FCC',
  blues: {
    dark: '#1872A0',
    light: '#DEF0FA',
  },
  yellow: '#C6B72C',
  yellows: {
    light: 'rgba(255, 245, 2, 0.2)',
  },
  green: '#31AE5C',
  greens: {
    light: '#E5FFEE',
  },
  red: '#EA6B6B',
  reds: {
    dark: '#DE3333',
    light: 'rgba(255, 147, 147, 0.25)',
  },
};

export const theme: Theme = {
  // 640px, 832px, 1024px, 1440px
  breakpoints: ['40em', '52em', '64em', '90em'],
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fontSizes: [12, 14, 16, 20, 24, 36, 48, 80, 96],
  fontWeights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  lineHeights: {
    solid: 1,
    title: 1.25,
    copy: 1.5,
  },
  fonts: {
    serif: 'Canela, athelas, georgia, times, serif',
    sansSerif:
      '-apple-system, BlinkMacSystemFont, roboto, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, noto, "segoe ui", arial, sans-serif',
  },
  borders: [0, '1px solid', '2px solid', '4px solid', '8px solid', '16px solid', '32px solid'],
  radii: [0, 2, 4, 16, 9999, '100%'],
  shadows: ['0px 5px 20px rgba(0, 0, 0, 0.1)'],
  sizes: [16, 32, 64, 128, 256],
  colors,
};
