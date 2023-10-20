import { Howl } from 'howler';
export const basicSound = new Howl({
  src: ["/audio/correct.mp3"], // Replace with your sound file path
  autoplay: false, // Play the sound right away
  loop: false, // Do not loop the sound
  volume: 0.5, // Set the volume to 50%
});
export const winSound = new Howl({
  src: ["/audio/success.mp3"], // Replace with your sound file path
  autoplay: false, // Play the sound right away
  loop: false, // Do not loop the sound
  volume: 0.5, // Set the volume to 50%
});
export const wrongSound = new Howl({
  src: ["/audio/wrong_sound.mp3"], // Replace with your sound file path
  autoplay: false, // Play the sound right away
  loop: false, // Do not loop the sound
  volume: 0.5, // Set the volume to 50%
});