import { Composition } from 'remotion';

const AI_Brain_01 = () => (
  <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <circle cx="250" cy="250" r="200" fill="#4A90E2"> <!-- Otak dasar -->
    <line x1="250" y1="50" x2="250" y2="450" stroke="#FFFFFF" stroke-width="2"/> <!-- Node saraf -->
    <circle cx="250" cy="50" r="10" fill="#FFFFFF"/>
    <circle cx="250" cy="450" r="10" fill="#FFFFFF"/>
  </svg>
);

export default AI_Brain_01;
