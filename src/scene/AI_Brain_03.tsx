import { Composition } from 'remotion';

const AI_Brain_03 = () => (
  <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <circle cx="250" cy="250" r="200" fill="#1A3D66"> <!-- Otak dengan data mengalir -->
    <line x1="250" y1="50" x2="250" y2="450" stroke="#00FFFF" stroke-width="4"/> <!-- Garis data bergerak -->
    <circle cx="250" cy="50" r="20" fill="#00FFFF"/>
    <circle cx="250" cy="450" r="20" fill="#00FFFF"/>
    <line x1="100" y1="250" x2="400" y2="250" stroke="#00FFFF" stroke-width="4"/>
    <circle cx="100" cy="250" r="15" fill="#00FFFF"/>
    <circle cx="400" cy="250" r="15" fill="#00FFFF"/>
    <!-- Efek data mengalir -->
    <circle cx="270" cy="150" r="8" fill="#FF00FF" opacity="0.7"/>
    <circle cx="230" cy="350" r="8" fill="#FF00FF" opacity="0.7"/>
    <circle cx="300" cy="250" r="8" fill="#FF00FF" opacity="0.7"/>
  </svg>
);

export default AI_Brain_03;