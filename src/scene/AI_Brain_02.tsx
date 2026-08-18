import { Composition } from 'remotion';

const AI_Brain_02 = () => (
  <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <circle cx="250" cy="250" r="200" fill="#2E5C8A"> <!-- Otak berevolusi warna lebih gelap -->
    <line x1="250" y1="50" x2="250" y2="450" stroke="#00FF00" stroke-width="3"/> <!-- Node saraf lebih kompleks -->
    <circle cx="250" cy="50" r="15" fill="#00FF00"/>
    <circle cx="250" cy="450" r="15" fill="#00FF00"/>
    <line x1="100" y1="250" x2="400" y2="250" stroke="#00FF00" stroke-width="3"/> <!-- Koneksi horizontal -->
    <circle cx="100" cy="250" r="10" fill="#00FF00"/>
    <circle cx="400" cy="250" r="10" fill="#00FF00"/>
  </svg>
);

export default AI_Brain_02;